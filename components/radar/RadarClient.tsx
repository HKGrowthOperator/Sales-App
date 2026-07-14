'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Profile,
  RadarTarget,
  RadarLeadState,
  ProductArea,
  RADAR_STATUS_CONFIG,
  PRODUCT_AREA_CONFIG,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScanDialog } from '@/components/radar/ScanDialog'
import {
  Radar as RadarIcon,
  Globe,
  Instagram,
  Bot,
  Heart,
  Phone,
  Mail,
  MapPin,
  Clock,
  User,
  ArrowRight,
  X,
  Sparkles,
  Map as MapIcon,
} from 'lucide-react'

// Karte nur clientseitig laden (MapLibre braucht window)
const RadarMap = dynamic(() => import('@/components/radar/RadarMap'), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center text-sm text-slate-400">Karte lädt…</div>
  ),
})

// ------------------------------------------------------------
// Geometrie: Blip-Position im Radar-Scope
//   Winkel  = Produktbereich-Sektor (gruppiert visuell)
//   Radius  = invers zum Soul-Fit (besserer Fit → näher zur Mitte)
//   Größe   = Gesamt-Score (A > B > C)
// ------------------------------------------------------------
const SECTOR_CENTER: Record<ProductArea, number> = {
  'Website': 150,
  'Social Media': 270,
  'KI-Integration': 30,
}
const SIZE_BY_SCORE: Record<string, number> = { A: 13, B: 10, C: 8, 'No-Fit': 6 }

function hashFloat(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000
  return h / 100000 // 0..1
}

function blipGeometry(t: RadarTarget) {
  const area = (t.product_areas?.[0] as ProductArea) || null
  const baseAngle = area ? SECTOR_CENTER[area] : hashFloat(t.id) * 360
  const spread = (hashFloat(t.id) - 0.5) * 80 // ±40° innerhalb des Sektors
  const angle = ((baseAngle + spread) * Math.PI) / 180

  const fit = t.soul_fit_score ?? 5
  const maxR = 170
  // Fit 10 → ~30 (innen), Fit 1 → ~170 (außen)
  const radius = 30 + (1 - fit / 10) * (maxR - 30)

  const cx = 200 + Math.cos(angle) * radius
  const cy = 200 + Math.sin(angle) * radius
  const r = SIZE_BY_SCORE[t.overall_score || 'No-Fit'] ?? 7
  const hex = area ? PRODUCT_AREA_CONFIG[area].hex : '#64748b'
  return { cx, cy, r, hex }
}

function ScoreBar({
  label,
  icon: Icon,
  score,
  inverse,
  hint,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  score: number | null
  inverse?: boolean // niedrig = Chance (Website)
  hint?: string
}) {
  const v = score ?? 0
  // Bei inverse ist ein NIEDRIGER Score die Chance → grün bei niedrig
  const good = inverse ? v <= 4 : v >= 7
  const mid = inverse ? v <= 6 : v >= 4
  const color = score == null ? 'bg-slate-200' : good ? 'bg-emerald-500' : mid ? 'bg-amber-400' : 'bg-rose-400'
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="flex items-center gap-1.5 font-medium text-slate-700">
          <Icon className="h-4 w-4 text-slate-400" />
          {label}
        </span>
        <span className="tabular-nums text-slate-500">{score == null ? '–' : `${score}/10`}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${v * 10}%` }} />
      </div>
      {hint && <p className="mt-1 text-xs text-slate-500 leading-snug">{hint}</p>}
    </div>
  )
}

// Ergebnis der promote_radar_target-RPC (siehe Migration 009).
type PromoteResult = {
  lead_id: string
  was_duplicate: boolean
  was_already_promoted: boolean
  lead_status: string
  do_not_contact: boolean
}

type Notice = { kind: 'success' | 'info' | 'error'; text: string }

// CRM-Stand eines Targets in eine Badge übersetzen (Read-Back, Migration 009).
// Priorität: Opt-out > Kunde > Termin > aktiver Deal > sonst „im CRM".
// null = die Firma ist der Sales-App noch unbekannt → frei zum Übernehmen.
type CrmBadge = { label: string; tone: 'danger' | 'success' | 'info' | 'warn' | 'muted'; dot: string }
function crmBadgeFor(state: RadarLeadState | undefined): CrmBadge | null {
  if (!state) return null
  if (state.do_not_contact) return { label: 'Nicht kontaktieren', tone: 'danger', dot: '#dc2626' }
  if (state.is_customer) return { label: 'Kunde', tone: 'success', dot: '#059669' }
  if (state.appointment_at) {
    const d = new Date(state.appointment_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
    return { label: `Termin ${d}`, tone: 'info', dot: '#2563eb' }
  }
  if (state.is_active_deal) return { label: 'Aktiver Deal', tone: 'warn', dot: '#d97706' }
  return { label: `Im CRM: ${state.status}`, tone: 'muted', dot: '#64748b' }
}

const CRM_TONE_CLASS: Record<CrmBadge['tone'], string> = {
  danger: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  warn: 'border-amber-200 bg-amber-50 text-amber-700',
  muted: 'border-slate-200 bg-slate-50 text-slate-600',
}

export function RadarClient({
  profile,
  initialTargets,
  leadStates = {},
}: {
  profile: Profile
  initialTargets: RadarTarget[]
  leadStates?: Record<string, RadarLeadState>
}) {
  const router = useRouter()
  const [targets] = useState(initialTargets)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [scanOpen, setScanOpen] = useState(false)
  const [view, setView] = useState<'map' | 'scope'>('scope')

  // Sichtbare Blips = noch nicht verworfene/duplizierte
  const liveTargets = useMemo(
    () => targets.filter((t) => t.status !== 'dismissed' && t.status !== 'duplicate'),
    [targets],
  )
  const selected = targets.find((t) => t.id === selectedId) || null

  // target.id → Ring-Farbe für Karten-/Blip-Marker (nur was im CRM bekannt ist)
  const crmDots = useMemo(() => {
    const out: Record<string, string> = {}
    for (const t of targets) {
      const b = crmBadgeFor(leadStates[t.dedup_key ?? ''])
      if (b) out[t.id] = b.dot
    }
    return out
  }, [targets, leadStates])

  const counts = useMemo(() => {
    const scored = targets.filter((t) => t.status === 'scored').length
    const aLeads = targets.filter((t) => t.overall_score === 'A' && t.status === 'scored').length
    const promoted = targets.filter((t) => t.status === 'promoted').length
    return { total: targets.length, scored, aLeads, promoted }
  }, [targets])

  // Promotion läuft über EINE atomare, dedup-sichere RPC (Migration 009):
  // legt den Lead an ODER verknüpft ein bereits existierendes Lead-Duplikat,
  // markiert das Target und gibt das Ergebnis zurück. Kein roher Client-INSERT.
  async function promote(t: RadarTarget) {
    setBusy(true)
    setNotice(null)
    const supabase = createClient()
    const { data, error } = await supabase.rpc('promote_radar_target', {
      p_target_id: t.id,
    })

    if (error) {
      setNotice({ kind: 'error', text: `Promotion fehlgeschlagen: ${error.message}` })
    } else {
      const r = data as PromoteResult
      if (r.was_duplicate) {
        setNotice({
          kind: 'info',
          text: `${t.company_name} existiert bereits als Lead (Status „${r.lead_status}"`
            + `${r.do_not_contact ? ', Opt-out' : ''}) — als Duplikat verknüpft, kein neuer Lead angelegt.`,
        })
      } else if (r.was_already_promoted) {
        setNotice({ kind: 'info', text: `${t.company_name} war bereits in der Sales-App.` })
      } else {
        setNotice({ kind: 'success', text: `${t.company_name} als Lead übernommen (Status „${r.lead_status}").` })
      }
      router.refresh()
    }
    setBusy(false)
    setSelectedId(null)
  }

  async function dismiss(t: RadarTarget) {
    setBusy(true)
    setNotice(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('radar_targets')
      .update({ status: 'dismissed' })
      .eq('id', t.id)
    if (error) setNotice({ kind: 'error', text: `Verwerfen fehlgeschlagen: ${error.message}` })
    setBusy(false)
    setSelectedId(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Kopf */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <RadarIcon className="h-6 w-6 text-emerald-600" />
            Lead Radar
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Scannt Unternehmen, bewertet sie auf vier Achsen und spielt die besten in die Sales-App.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Ansicht: Karte ↔ Scope */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              onClick={() => setView('map')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                view === 'map' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <MapIcon className="h-4 w-4" /> Karte
            </button>
            <button
              onClick={() => setView('scope')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                view === 'scope' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <RadarIcon className="h-4 w-4" /> Scope
            </button>
          </div>
          <Button onClick={() => setScanOpen(true)}>
            <Sparkles className="h-4 w-4 mr-1.5" /> Neuen Scan starten
          </Button>
        </div>
      </div>

      <ScanDialog open={scanOpen} onOpenChange={setScanOpen} />

      {/* Ergebnis-Hinweis (Promote/Dismiss) */}
      {notice && (
        <div
          className={cn(
            'flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm',
            notice.kind === 'success' && 'border-green-200 bg-green-50 text-green-800',
            notice.kind === 'info' && 'border-amber-200 bg-amber-50 text-amber-800',
            notice.kind === 'error' && 'border-red-200 bg-red-50 text-red-800',
          )}
          role="status"
        >
          <span>{notice.text}</span>
          <button
            onClick={() => setNotice(null)}
            className="shrink-0 opacity-60 hover:opacity-100"
            aria-label="Hinweis schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Status-Zeile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Gescannt', value: counts.total },
          { label: 'Bewertet', value: counts.scored },
          { label: 'A-Leads', value: counts.aLeads },
          { label: 'In Sales-App', value: counts.promoted },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        {/* ---------- Karte ODER Radar-Scope ---------- */}
        {view === 'map' ? (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[560px] w-full">
                <RadarMap targets={liveTargets} selectedId={selectedId} onSelect={setSelectedId} crmDots={crmDots} />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t p-3 text-xs text-slate-500">
                {(Object.keys(PRODUCT_AREA_CONFIG) as ProductArea[]).map((a) => (
                  <span key={a} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: PRODUCT_AREA_CONFIG[a].hex }} />
                    {a}
                  </span>
                ))}
                <span className="text-slate-400">· Markergröße = Score · Ring = schon im CRM · Klick = Details</span>
              </div>
            </CardContent>
          </Card>
        ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="relative mx-auto w-full max-w-[520px] aspect-square">
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <defs>
                  <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#052e2b" />
                    <stop offset="100%" stopColor="#020617" />
                  </radialGradient>
                  <linearGradient id="sweep" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.45" />
                  </linearGradient>
                </defs>

                <circle cx="200" cy="200" r="190" fill="url(#radarBg)" />
                {/* konzentrische Ringe */}
                {[48, 96, 144, 190].map((r) => (
                  <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#10b981" strokeOpacity="0.15" />
                ))}
                {/* Fadenkreuz */}
                <line x1="200" y1="10" x2="200" y2="390" stroke="#10b981" strokeOpacity="0.12" />
                <line x1="10" y1="200" x2="390" y2="200" stroke="#10b981" strokeOpacity="0.12" />

                {/* rotierender Sweep */}
                <g style={{ transformOrigin: '200px 200px' }} className="hk-radar-sweep">
                  <path d="M200 200 L390 200 A190 190 0 0 0 320 64 Z" fill="url(#sweep)" />
                  <line x1="200" y1="200" x2="390" y2="200" stroke="#10b981" strokeOpacity="0.6" />
                </g>

                {/* Blips */}
                {liveTargets.map((t) => {
                  const g = blipGeometry(t)
                  const isSel = t.id === selectedId
                  const isPromoted = t.status === 'promoted'
                  const crm = crmBadgeFor(leadStates[t.dedup_key ?? ''])
                  return (
                    <g key={t.id} className="cursor-pointer" onClick={() => setSelectedId(t.id)}>
                      <circle
                        cx={g.cx}
                        cy={g.cy}
                        r={g.r}
                        fill={g.hex}
                        fillOpacity={isPromoted ? 0.35 : 0.85}
                        stroke={isSel ? '#fff' : g.hex}
                        strokeWidth={isSel ? 2.5 : 1}
                        className="hk-blip"
                      />
                      {isSel && (
                        <circle cx={g.cx} cy={g.cy} r={g.r + 6} fill="none" stroke="#fff" strokeOpacity="0.5" />
                      )}
                      {/* CRM-Marker: schon im Sales-CRM (Lead/Opt-out/Termin/Kunde) */}
                      {crm && (
                        <circle
                          cx={g.cx + g.r * 0.7}
                          cy={g.cy - g.r * 0.7}
                          r={3.5}
                          fill={crm.dot}
                          stroke="#020617"
                          strokeWidth={1}
                        >
                          <title>{crm.label}</title>
                        </circle>
                      )}
                    </g>
                  )
                })}
              </svg>

              {liveTargets.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-center px-6">
                  <p className="text-sm text-emerald-200/70">
                    Noch keine Targets im Scope.<br />Der Discovery-Scan füllt das Radar.
                  </p>
                </div>
              )}
            </div>

            {/* Legende */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
              {(Object.keys(PRODUCT_AREA_CONFIG) as ProductArea[]).map((a) => (
                <span key={a} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PRODUCT_AREA_CONFIG[a].hex }} />
                  {a}
                </span>
              ))}
              <span className="text-slate-400">· Mitte = hoher Werte-Fit · Größe = Score</span>
            </div>
          </CardContent>
        </Card>
        )}

        {/* ---------- Detail-Panel ---------- */}
        <div className="lg:sticky lg:top-20">
          {selected ? (
            <TargetDetail
              t={selected}
              crm={crmBadgeFor(leadStates[selected.dedup_key ?? ''])}
              busy={busy}
              onClose={() => setSelectedId(null)}
              onPromote={() => promote(selected)}
              onDismiss={() => dismiss(selected)}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-sm text-slate-500">
                <RadarIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                Wähle einen Blip im Radar, um Bewertung & Übergabe zu sehen.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes hk-radar-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .hk-radar-sweep { animation: hk-radar-rotate 4s linear infinite; }
        @keyframes hk-blip-pulse { 0%,100% { opacity: 0.85; } 50% { opacity: 0.45; } }
        .hk-blip { animation: hk-blip-pulse 2.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .hk-radar-sweep, .hk-blip { animation: none; }
        }
      `}</style>
    </div>
  )
}

function TargetDetail({
  t,
  crm,
  busy,
  onClose,
  onPromote,
  onDismiss,
}: {
  t: RadarTarget
  crm: CrmBadge | null
  busy: boolean
  onClose: () => void
  onPromote: () => void
  onDismiss: () => void
}) {
  const status = RADAR_STATUS_CONFIG[t.status]
  const reach =
    t.decision_maker_reachability === 'direkt'
      ? 'Entscheider direkt erreichbar'
      : t.decision_maker_reachability === 'zentrale'
        ? 'über Zentrale / Gatekeeper'
        : 'Erreichbarkeit unklar'

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        {/* Kopf */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">{t.company_name}</h2>
              {t.overall_score && (
                <Badge className="bg-slate-900 text-white">{t.overall_score}</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {[t.industry, t.region].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Schließen">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* CRM-Stand (Read-Back) — verhindert Doppel-Akquise */}
        {crm && (
          <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium', CRM_TONE_CLASS[crm.tone])}>
            <span className="h-2 w-2 rounded-full" style={{ background: crm.dot }} />
            {crm.tone === 'danger'
              ? 'Opt-out — diese Firma nicht mehr kontaktieren.'
              : `Schon im Sales-CRM · ${crm.label}`}
          </div>
        )}

        {/* Produktbereiche + Status */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{status.label}</Badge>
          {(t.product_areas || []).map((a) => (
            <Badge
              key={a}
              variant="outline"
              style={{ borderColor: PRODUCT_AREA_CONFIG[a as ProductArea]?.hex, color: PRODUCT_AREA_CONFIG[a as ProductArea]?.hex }}
            >
              {a}
            </Badge>
          ))}
        </div>

        {/* Basics */}
        <div className="space-y-1.5 text-sm">
          {t.decision_maker_name && (
            <Row icon={User} text={`${t.decision_maker_name}${t.decision_maker_role ? ` · ${t.decision_maker_role}` : ''}`} sub={reach} />
          )}
          {t.phone && <Row icon={Phone} text={t.phone} />}
          {t.email && <Row icon={Mail} text={t.email} />}
          {t.opening_hours && <Row icon={Clock} text={t.opening_hours} />}
          {t.address && <Row icon={MapPin} text={t.address} />}
          {t.decision_maker_note && (
            <p className="text-xs text-slate-500 pl-6">{t.decision_maker_note}</p>
          )}
        </div>

        {/* Vier Bewertungsachsen */}
        <div className="space-y-3 pt-1">
          <ScoreBar label="Website" icon={Globe} score={t.website_score} inverse hint={t.website_analysis || undefined} />
          <ScoreBar
            label="Social Media"
            icon={Instagram}
            score={t.social_score}
            hint={[
              t.follower_count != null ? `${t.follower_count.toLocaleString('de-DE')} Follower` : null,
              t.post_frequency,
              t.posts_reels ? 'Reels' : null,
              t.has_stories ? 'Stories' : null,
            ].filter(Boolean).join(' · ') || (t.social_analysis || undefined)}
          />
          <ScoreBar
            label="KI-Integration"
            icon={Bot}
            score={t.ai_applicable === false ? null : t.ai_score}
            hint={t.ai_applicable === false ? 'Für dieses Unternehmen nicht relevant' : (t.ai_analysis || undefined)}
          />
          <ScoreBar label="Werte-Fit" icon={Heart} score={t.soul_fit_score} hint={t.soul_fit_reason || undefined} />
        </div>

        {/* Pains pro Rolle */}
        {(t.opener_pitch || t.setter_context || t.closer_context || t.pain_summary) && (
          <div className="space-y-2 pt-1">
            {t.opener_pitch && <PainBlock role="Opener" color="bg-orange-50 text-orange-900 border-orange-200" text={t.opener_pitch} />}
            {t.setter_context && <PainBlock role="Setter" color="bg-purple-50 text-purple-900 border-purple-200" text={t.setter_context} />}
            {t.closer_context && <PainBlock role="Closer" color="bg-blue-50 text-blue-900 border-blue-200" text={t.closer_context} />}
          </div>
        )}

        {/* Aktionen */}
        {t.status === 'promoted' ? (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <ArrowRight className="h-4 w-4" /> Bereits als Lead in der Sales-App.
          </div>
        ) : (
          <div className="flex gap-2 pt-1">
            <Button className="flex-1" onClick={onPromote} disabled={busy}>
              <ArrowRight className="h-4 w-4 mr-1.5" /> In Sales-App übernehmen
            </Button>
            <Button variant="outline" onClick={onDismiss} disabled={busy}>
              Verwerfen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Row({
  icon: Icon,
  text,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  text: string
  sub?: string
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div>
        <span className="text-slate-700">{text}</span>
        {sub && <span className="block text-xs text-slate-400">{sub}</span>}
      </div>
    </div>
  )
}

function PainBlock({ role, color, text }: { role: string; color: string; text: string }) {
  return (
    <div className={cn('rounded-lg border px-3 py-2 text-sm', color)}>
      <span className="text-[11px] font-bold uppercase tracking-wide opacity-70">{role}</span>
      <p className="leading-snug">{text}</p>
    </div>
  )
}
