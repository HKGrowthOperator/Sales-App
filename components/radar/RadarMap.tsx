'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { RadarTarget, ProductArea, PRODUCT_AREA_CONFIG } from '@/lib/types'

// Vektor-Style ohne API-Key (frei). Über NEXT_PUBLIC_MAP_STYLE_URL überschreibbar
// (z.B. ein MapTiler-Style mit Key, falls gewünscht).
const STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty'

// Fallback-Zentrum: Gummersbach [lng, lat]
const DEFAULT_CENTER: [number, number] = [7.565, 51.027]
const DEFAULT_ZOOM = 10

const SIZE_BY_SCORE: Record<string, number> = { A: 30, B: 26, C: 22, 'No-Fit': 18 }

function areaOf(t: RadarTarget): ProductArea | null {
  return (t.product_areas?.[0] as ProductArea) || null
}
function colorOf(t: RadarTarget): string {
  const a = areaOf(t)
  return a ? PRODUCT_AREA_CONFIG[a].hex : '#64748b'
}
function hasCoords(t: RadarTarget): boolean {
  return typeof t.latitude === 'number' && typeof t.longitude === 'number'
}

function applyMarkerStyle(el: HTMLElement, t: RadarTarget, selected: boolean, crmDot?: string) {
  const size = SIZE_BY_SCORE[t.overall_score || 'No-Fit'] ?? 20
  const color = colorOf(t)
  // Firma schon im Sales-CRM → farbiger Ring (Read-Back, verhindert Doppel-Akquise).
  const ring = selected
    ? ',0 0 0 4px rgba(15,23,42,.25)'
    : crmDot
      ? `,0 0 0 3px ${crmDot}`
      : ''
  el.style.cssText = [
    `width:${size}px`,
    `height:${size}px`,
    'border-radius:9999px',
    `background:${color}`,
    `border:2px solid ${selected ? '#0f172a' : '#ffffff'}`,
    `box-shadow:0 1px 4px rgba(0,0,0,.4)${ring}`,
    'cursor:pointer',
    'display:grid',
    'place-items:center',
    'color:#fff',
    'font:700 11px/1 ui-sans-serif,system-ui,sans-serif',
    'padding:0',
    `opacity:${t.status === 'promoted' ? '0.5' : '1'}`,
    `transform:scale(${selected ? 1.15 : 1})`,
    'transition:transform .12s ease',
    `z-index:${selected ? 2 : 1}`,
  ].join(';')
  el.textContent = t.overall_score && t.overall_score !== 'No-Fit' ? t.overall_score : ''
}

function buildMarkerEl(t: RadarTarget, selected: boolean, onSelect: (id: string) => void, crmDot?: string): HTMLElement {
  const el = document.createElement('button')
  el.type = 'button'
  el.title = `${t.company_name}${t.overall_score ? ` · ${t.overall_score}` : ''}`
  el.setAttribute('aria-label', t.company_name)
  applyMarkerStyle(el, t, selected, crmDot)
  el.addEventListener('click', (e) => {
    e.stopPropagation()
    onSelect(t.id)
  })
  return el
}

export default function RadarMap({
  targets,
  selectedId,
  onSelect,
  crmDots = {},
}: {
  targets: RadarTarget[]
  selectedId: string | null
  onSelect: (id: string) => void
  // target.id → Ring-Farbe, wenn die Firma schon im Sales-CRM ist
  crmDots?: Record<string, string>
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLElement; target: RadarTarget }>>(new Map())
  const readyRef = useRef(false)
  // aktuelle Callback/Selection ohne Map-Reinit referenzierbar halten
  const onSelectRef = useRef(onSelect)
  const selectedRef = useRef(selectedId)
  const crmDotsRef = useRef(crmDots)
  onSelectRef.current = onSelect
  selectedRef.current = selectedId
  crmDotsRef.current = crmDots

  // --- Map einmalig initialisieren ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')
    mapRef.current = map
    // Marker sind DOM-Overlays → unabhängig vom Style sofort zeichnen,
    // damit sie auch erscheinen, falls das 'load'-Event verzögert/aus bleibt.
    readyRef.current = true
    renderMarkers()
    fitToMarkers()
    map.on('load', () => {
      map.resize()
      renderMarkers()
      fitToMarkers()
    })
    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove())
      markersRef.current.clear()
      map.remove()
      mapRef.current = null
      readyRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Marker neu aufbauen, wenn sich die Targets ändern ---
  function renderMarkers() {
    const map = mapRef.current
    if (!map) return
    markersRef.current.forEach(({ marker }) => marker.remove())
    markersRef.current.clear()
    for (const t of targets) {
      if (!hasCoords(t)) continue
      const el = buildMarkerEl(t, t.id === selectedRef.current, (id) => onSelectRef.current(id), crmDotsRef.current[t.id])
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([t.longitude as number, t.latitude as number])
        .addTo(map)
      markersRef.current.set(t.id, { marker, el, target: t })
    }
  }

  function fitToMarkers() {
    const map = mapRef.current
    if (!map) return
    const coords = targets.filter(hasCoords)
    if (coords.length === 0) return
    if (coords.length === 1) {
      map.easeTo({ center: [coords[0].longitude as number, coords[0].latitude as number], zoom: 12 })
      return
    }
    const bounds = new maplibregl.LngLatBounds()
    coords.forEach((t) => bounds.extend([t.longitude as number, t.latitude as number]))
    map.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 600 })
  }

  useEffect(() => {
    if (!readyRef.current) return
    renderMarkers()
    fitToMarkers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targets])

  // --- Auswahl hervorheben + sanft anfliegen ---
  useEffect(() => {
    if (!readyRef.current) return
    // Stile in-place aktualisieren (kein Element-Austausch → kein Flackern)
    markersRef.current.forEach(({ el, target }) => {
      applyMarkerStyle(el, target, target.id === selectedId, crmDotsRef.current[target.id])
    })
    const map = mapRef.current
    const sel = selectedId ? markersRef.current.get(selectedId)?.target : null
    if (map && sel && hasCoords(sel)) {
      map.easeTo({ center: [sel.longitude as number, sel.latitude as number], duration: 500 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const withCoords = targets.filter(hasCoords).length
  const without = targets.length - withCoords

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {without > 0 && (
        <div className="absolute bottom-2 right-2 z-10 rounded-md bg-white/90 px-2.5 py-1 text-xs text-slate-600 shadow">
          {without} ohne Koordinaten – „Geocoding starten"
        </div>
      )}
      {withCoords === 0 && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-slate-50/70 text-center text-sm text-slate-500 px-6">
          Noch keine Koordinaten.<br />Starte „Geocoding" oder einen Scan, der Koordinaten liefert.
        </div>
      )}
    </div>
  )
}
