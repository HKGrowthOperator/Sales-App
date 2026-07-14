'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2 } from 'lucide-react'

type Result =
  | { kind: 'ok'; status: string; preview?: boolean; message?: string }
  | { kind: 'err'; message: string }

export function ScanDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter()
  const [region, setRegion] = useState('Gummersbach und Umgebung')
  const [radiusKm, setRadiusKm] = useState('')
  const [searchScope, setSearchScope] = useState('')
  const [targetOffer, setTargetOffer] = useState('Website, Google-Profil, Social Media, Sichtbarkeit')
  const [desiredCount, setDesiredCount] = useState('20')
  const [qualityFocus, setQualityFocus] = useState('Lieber weniger Leads, dafür echte Chancen mit klarem Anrufgrund')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  async function start() {
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/radar/scan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          region: region.trim(),
          radius_km: radiusKm ? Number(radiusKm) : null,
          search_scope: searchScope.trim(),
          target_offer: targetOffer.trim() || null,
          desired_count: Number(desiredCount) || 20,
          quality_focus: qualityFocus.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ kind: 'err', message: data?.error || `Fehler ${res.status}` })
      } else {
        setResult({ kind: 'ok', status: data.status, preview: data.preview, message: data.message })
        router.refresh()
      }
    } catch (e: any) {
      setResult({ kind: 'err', message: e?.message || String(e) })
    } finally {
      setBusy(false)
    }
  }

  const canStart = region.trim().length > 0 && searchScope.trim().length > 0 && !busy

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" /> KI-Research-Scan starten
          </DialogTitle>
          <DialogDescription>
            Der Radar recherchiert KI-geführt über mehrere Quellen und liefert eine kuratierte
            Leadliste mit Anrufwinkel — keine rohen Verzeichniseinträge.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="region">Region / Zielgebiet *</Label>
              <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="z.B. Gummersbach und Umgebung" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="radius">Umkreis (km)</Label>
              <Input id="radius" type="number" value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} placeholder="25" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="scope">Suchbereich / Branche *</Label>
            <Textarea id="scope" rows={2} value={searchScope} onChange={(e) => setSearchScope(e.target.value)}
              placeholder="z.B. lokale Restaurants, Handwerker, Dienstleister" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="offer">Zielangebot</Label>
            <Input id="offer" value={targetOffer} onChange={(e) => setTargetOffer(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="count">Lead-Menge</Label>
              <Input id="count" type="number" value={desiredCount} onChange={(e) => setDesiredCount(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="quality">Qualitätsfokus</Label>
              <Input id="quality" value={qualityFocus} onChange={(e) => setQualityFocus(e.target.value)} />
            </div>
          </div>
        </div>

        {result && (
          <div
            className={
              result.kind === 'err'
                ? 'rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800'
                : 'rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800'
            }
          >
            {result.kind === 'err'
              ? `Fehler: ${result.message}`
              : result.preview
                ? (result.message || 'Scan vorgemerkt (Preview – n8n-Webhook nicht gesetzt).')
                : `Scan gestartet (Status: ${result.status}). Treffer erscheinen, sobald n8n fertig ist.`}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Schließen
          </Button>
          <Button onClick={start} disabled={!canStart}>
            {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
            Recherche starten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
