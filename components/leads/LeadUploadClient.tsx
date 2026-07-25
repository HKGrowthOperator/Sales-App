'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Profile } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/lib/hooks/use-toast'
import {
  ChevronLeft, Upload, FileSpreadsheet, ClipboardPaste, Link2,
  Loader2, CheckCircle2, AlertTriangle, XCircle, Sparkles,
} from 'lucide-react'

// ============================================================
// Lead-Upload (Sales App v1.1) — CSV-Datei, Copy-Paste aus
// Excel/Sheets oder Google-Sheet-Link → Spalten-Mapping →
// Import durch die Radar-Pipeline (Dedup + Research + CRM).
// ============================================================

type TargetField =
  | 'company_name' | 'contact_name' | 'role_title' | 'phone' | 'email'
  | 'website' | 'social_url' | 'linkedin' | 'industry' | 'city' | 'address'
  | 'pain_summary' | 'cluster' | 'employee_count' | 'management' | 'owner_led'
  | 'package_potential' | 'cross_sell_score' | 'key_bottlenecks'
  | 'hiring_signal' | 'buy_signal' | 'entry_point' | 'verification_status'
  | 'open_positions_raw' | 'approach_notes' | 'ignore'

const FIELD_LABELS: Record<TargetField, string> = {
  company_name: 'Unternehmen *',
  contact_name: 'Ansprechpartner',
  role_title: 'Position',
  phone: 'Telefon',
  email: 'E-Mail',
  website: 'Website',
  social_url: 'Social Media',
  linkedin: 'LinkedIn',
  industry: 'Branche / Leistung',
  city: 'Stadt',
  address: 'Adresse',
  cluster: 'Cluster',
  employee_count: 'Mitarbeiter',
  management: 'Geschäftsführung',
  owner_led: 'Inhabergeführt',
  package_potential: 'Paket-Potenzial',
  cross_sell_score: 'Cross-Sell-Score / Score',
  key_bottlenecks: 'Engstellen',
  hiring_signal: 'Akuter Anlass / Hiring',
  buy_signal: 'Kaufsignal',
  entry_point: 'Einstiegspunkt',
  verification_status: 'Status Verifizierung',
  open_positions_raw: 'Offene Stellen',
  approach_notes: 'Hinweise für Ansprache',
  pain_summary: 'Pain / Notiz',
  ignore: '— ignorieren —',
}

// Header-Synonyme (DE/EN) für das Auto-Mapping der Spalten.
const HEADER_SYNONYMS: [TargetField, string[]][] = [
  ['company_name', ['firma', 'firmenname', 'unternehmen', 'unternehmensname', 'company', 'company name', 'betrieb']],
  ['management', ['geschäftsführung', 'geschaeftsfuehrung', 'geschäftsführer', 'gf', 'management', 'leitung']],
  ['contact_name', ['ansprechpartner', 'kontakt', 'kontaktperson', 'kontaktname', 'contact', 'contact name', 'inhaber']],
  ['role_title', ['position', 'rolle', 'funktion', 'role', 'title', 'titel']],
  ['phone', ['telefon', 'telefonnummer', 'tel', 'tel.', 'phone', 'phone number', 'mobil', 'handy', 'mobile']],
  ['email', ['email', 'e-mail', 'mail', 'e-mail-adresse', 'emailadresse']],
  ['website', ['website', 'webseite', 'web', 'url', 'homepage', 'domain', 'internetseite']],
  ['social_url', ['instagram', 'social', 'social media', 'facebook', 'insta']],
  ['linkedin', ['linkedin']],
  ['cluster', ['cluster', 'segment', 'gruppe']],
  ['industry', ['branche', 'branche / leistung', 'leistung', 'industry', 'gewerbe', 'kategorie', 'sector']],
  ['employee_count', ['mitarbeiter', 'mitarbeiterzahl', 'employees', 'ma', 'größe', 'groesse', 'size']],
  ['owner_led', ['inhabergeführt', 'inhabergefuehrt', 'owner-led', 'familiengeführt']],
  ['package_potential', ['paket-potenzial', 'paket', 'potenzial', 'package']],
  ['cross_sell_score', ['cross-sell-score', 'cross-sell-score (0–6)', 'cross sell', 'cross-sell', 'score']],
  ['key_bottlenecks', ['klare engstellen', 'engstellen', 'engstelle', 'bottleneck', 'schwachstellen']],
  ['open_positions_raw', ['offene stellen', 'offene stellen (stand 07/2026)', 'stellen', 'jobs', 'vakanzen']],
  ['buy_signal', ['kaufsignal', 'buy signal', 'signal']],
  ['entry_point', ['einstiegspunkt', 'einstieg', 'entry point']],
  ['verification_status', ['status verifizierung', 'verifizierung', 'verifiziert', 'status verifiziert']],
  ['hiring_signal', ['akuter anlass', 'akuter anlass (aktuelles hiring o.ä.)', 'anlass', 'hiring']],
  ['approach_notes', ['hinweise für ansprache', 'hinweise', 'ansprache', 'approach', 'note für ansprache']],
  ['city', ['stadt', 'ort', 'city', 'standort']],
  ['address', ['adresse', 'address', 'anschrift', 'straße', 'strasse', 'street']],
  ['pain_summary', ['pain', 'notiz', 'notizen', 'notes', 'note', 'bemerkung', 'bemerkungen', 'kommentar', 'beschreibung']],
]

// linkedin ist kein IngestLead-Direktfeld → beim Bauen auf social_url-Fallback abbilden.

function autoMapHeader(header: string, taken: Set<TargetField>): TargetField {
  const h = header.trim().toLowerCase()
  if (!h) return 'ignore'
  for (const [field, names] of HEADER_SYNONYMS) {
    if (taken.has(field)) continue
    if (names.includes(h) || names.some((n) => h.startsWith(n))) return field
  }
  return 'ignore'
}

/** Quote-aware CSV/TSV-Parser mit Trennzeichen-Erkennung (Tab, ; , ). */
function parseTable(text: string): string[][] {
  const firstLine = text.slice(0, text.indexOf('\n') >= 0 ? text.indexOf('\n') : text.length)
  const counts: [string, number][] = [
    ['\t', (firstLine.match(/\t/g) || []).length],
    [';', (firstLine.match(/;/g) || []).length],
    [',', (firstLine.match(/,/g) || []).length],
  ]
  counts.sort((a, b) => b[1] - a[1])
  const delim = counts[0][1] > 0 ? counts[0][0] : ','

  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++ } else inQuotes = false
      } else cell += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === delim) {
      row.push(cell); cell = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some((v) => v.trim() !== '')) rows.push(row)
      row = []
    } else cell += c
  }
  row.push(cell)
  if (row.some((v) => v.trim() !== '')) rows.push(row)
  return rows
}

type ImportSummary = Record<string, number>
type ImportResult = {
  dedup_key: string | null
  company_name: string | null
  status: string
  reason?: string
  lead?: string
  missing?: string[]
}

interface Props {
  profile: Profile
  allProfiles: Pick<Profile, 'id' | 'full_name' | 'role' | 'email'>[]
}

const CHUNK_SIZE = 20

export function LeadUploadClient({ profile, allProfiles }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<TargetField[]>([])
  const [hasHeader, setHasHeader] = useState(true)
  const [pasteText, setPasteText] = useState('')
  const [sheetUrl, setSheetUrl] = useState('')
  const [sheetLoading, setSheetLoading] = useState(false)
  const [leadSource, setLeadSource] = useState('Tabellen-Import')
  const [assignTo, setAssignTo] = useState<string>(profile.id)

  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [results, setResults] = useState<ImportResult[]>([])
  // Fehler bleibt sichtbar stehen — eine Toast-Meldung ist weg, bevor man
  // sie lesen konnte, und dann steht man ohne Anhaltspunkt da.
  const [importError, setImportError] = useState<string | null>(null)

  function loadTable(text: string, label: string) {
    const parsed = parseTable(text)
    if (parsed.length < 1 || parsed[0].length < 1) {
      toast({ title: 'Nichts erkannt', description: 'Keine Tabellendaten gefunden.', variant: 'destructive' })
      return
    }
    const header = parsed[0]
    const looksLikeHeader = header.every((h) => h.trim() && !/^[+\d(]/.test(h.trim()) && !h.includes('@'))
    setHasHeader(looksLikeHeader)
    const taken = new Set<TargetField>()
    const auto = header.map((h, i) => {
      const f = looksLikeHeader ? autoMapHeader(h, taken) : 'ignore'
      if (f !== 'ignore') taken.add(f)
      return f as TargetField
    })
    setMapping(auto)
    setRows(parsed)
    setSummary(null)
    setResults([])
    toast({ title: `${label} geladen`, description: `${parsed.length - (looksLikeHeader ? 1 : 0)} Zeilen, ${header.length} Spalten erkannt.` })
  }

  async function handleFile(file: File) {
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      toast({
        title: 'Excel-Datei erkannt',
        description: 'Bitte als CSV exportieren ("Speichern unter → CSV") oder die Tabelle direkt kopieren und im Tab "Einfügen" einfügen.',
        variant: 'destructive',
      })
      return
    }
    loadTable(await file.text(), file.name)
  }

  async function handleSheet() {
    if (!sheetUrl.trim()) return
    setSheetLoading(true)
    try {
      const res = await fetch('/api/leads/upload/sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sheetUrl }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast({ title: 'Sheet nicht ladbar', description: data.detail || data.error || 'Unbekannter Fehler', variant: 'destructive' })
      } else {
        loadTable(data.csv, 'Google Sheet')
      }
    } catch {
      toast({ title: 'Fehler', description: 'Google Sheet konnte nicht geladen werden.', variant: 'destructive' })
    } finally {
      setSheetLoading(false)
    }
  }

  function setColMapping(idx: number, field: TargetField) {
    setMapping((prev) => prev.map((f, i) => {
      if (i === idx) return field
      // ein Zielfeld nur einmal vergeben
      if (field !== 'ignore' && f === field) return 'ignore'
      return f
    }))
  }

  const dataRows = useMemo(() => (hasHeader ? rows.slice(1) : rows), [rows, hasHeader])

  const leads = useMemo(() => {
    return dataRows.map((r) => {
      const lead: Record<string, any> = {}
      mapping.forEach((field, i) => {
        const v = (r[i] || '').trim()
        if (!v || field === 'ignore') return
        if (field === 'contact_name') {
          lead.decision_maker = { ...(lead.decision_maker || {}), name: v }
        } else if (field === 'role_title') {
          lead.decision_maker = { ...(lead.decision_maker || {}), role: v }
        } else if (field === 'management') {
          // Geschäftsführung NUR als Rohwert speichern — NIE als Ansprechpartner/
          // Vorname setzen (Rollenwörter/mehrere Personen). Strukturierte
          // Entscheider werden separat aus diesem Rohwert geparst.
          lead.management = v
        } else {
          lead[field] = v
        }
      })
      return lead
    })
  }, [dataRows, mapping])

  const validation = useMemo(() => {
    let ok = 0, noCompany = 0, noKey = 0
    for (const l of leads) {
      if (!l.company_name) { noCompany++; continue }
      if (!l.website && !l.phone) { noKey++; continue }
      ok++
    }
    return { ok, noCompany, noKey }
  }, [leads])

  const companyMapped = mapping.includes('company_name')

  async function handleImport() {
    const importable = leads.filter((l) => l.company_name)
    if (!importable.length) {
      toast({ title: 'Keine importierbaren Zeilen', description: 'Mindestens die Spalte "Unternehmen" muss gemappt sein.', variant: 'destructive' })
      return
    }
    setImporting(true)
    setSummary(null)
    setResults([])
    setImportError(null)
    setProgress({ done: 0, total: importable.length })

    const agg: ImportSummary = {}
    const allResults: ImportResult[] = []
    try {
      for (let i = 0; i < importable.length; i += CHUNK_SIZE) {
        const chunk = importable.slice(i, i + CHUNK_SIZE)
        const res = await fetch('/api/leads/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leads: chunk,
            lead_source: leadSource,
            assigned_to: assignTo || null,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.ok) {
          const msg = data.detail || data.error || `HTTP ${res.status} ${res.statusText}`
          setImportError(`Zeilen ${i + 1}–${Math.min(i + CHUNK_SIZE, importable.length)}: ${msg}`)
          toast({ title: 'Import-Fehler', description: msg, variant: 'destructive' })
          break
        }
        for (const [k, v] of Object.entries(data.summary as ImportSummary)) {
          agg[k] = (agg[k] || 0) + (v as number)
        }
        allResults.push(...(data.results || []))
        setProgress({ done: Math.min(i + CHUNK_SIZE, importable.length), total: importable.length })
        setSummary({ ...agg })
        setResults([...allResults])
      }
    } catch (e: any) {
      setImportError(e?.message || String(e))
      toast({ title: 'Import abgebrochen', description: e?.message || String(e), variant: 'destructive' })
    } finally {
      setImporting(false)
    }
  }

  const problems = results.filter((r) => r && (r.status === 'skipped' || r.status === 'rejected'))

  // ---------- Ergebnis-Ansicht ----------
  if (summary && !importing) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Link href="/leads" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ChevronLeft className="h-4 w-4" /> Zur Leadliste
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Import abgeschlossen</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Leads im CRM', value: summary.leads_created || 0, icon: CheckCircle2, cls: 'text-green-600' },
            { label: 'Research nötig', value: summary.needs_enrichment || 0, icon: Sparkles, cls: 'text-amber-600' },
            { label: 'Übersprungen', value: summary.skipped || 0, icon: AlertTriangle, cls: 'text-slate-500' },
            { label: 'Abgelehnt', value: summary.rejected || 0, icon: XCircle, cls: 'text-red-600' },
          ].map(({ label, value, icon: Icon, cls }) => (
            <Card key={label}>
              <CardContent className="p-4 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-1 ${cls}`} />
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {(summary.researched || 0) + (summary.website_corrected || 0) > 0 && (
          <p className="text-sm text-slate-600">
            🔎 Research: {summary.researched || 0} Firmen geprüft, {summary.website_corrected || 0} Websites gefunden/korrigiert.
          </p>
        )}

        {problems.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Nicht importiert ({problems.length})</CardTitle></CardHeader>
            <CardContent className="space-y-1 max-h-72 overflow-y-auto">
              {problems.map((r, i) => (
                <div key={i} className="text-sm flex items-start gap-2">
                  <span className="font-medium text-slate-800 shrink-0">{r.company_name || '—'}</span>
                  <span className="text-slate-500">{r.reason}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/leads')}>
            Zu den Leads
          </Button>
          <Button variant="outline" onClick={() => { setRows([]); setSummary(null); setResults([]) }}>
            Weitere Leads importieren
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <Link href="/leads" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2">
          <ChevronLeft className="h-4 w-4" /> Zur Leadliste
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Leads importieren</h1>
        <p className="text-sm text-slate-500">
          Google Sheet, CSV oder kopierte Tabelle hochladen — jeder Lead wird automatisch recherchiert
          (Website / Social Media / Pain) und verkaufsfertig ins CRM übernommen.
        </p>
      </div>

      {rows.length === 0 ? (
        <Tabs defaultValue="file">
          <TabsList>
            <TabsTrigger value="file"><FileSpreadsheet className="h-4 w-4 mr-1" /> CSV-Datei</TabsTrigger>
            <TabsTrigger value="paste"><ClipboardPaste className="h-4 w-4 mr-1" /> Einfügen</TabsTrigger>
            <TabsTrigger value="sheet"><Link2 className="h-4 w-4 mr-1" /> Google Sheet</TabsTrigger>
          </TabsList>

          <TabsContent value="file">
            <Card>
              <CardContent className="p-8">
                <div
                  className="border-2 border-dashed border-slate-200 rounded-lg p-10 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
                >
                  <Upload className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium text-slate-700">CSV-Datei hier ablegen oder klicken</p>
                  <p className="text-sm text-slate-400 mt-1">.csv / .tsv — Excel bitte als CSV exportieren oder kopieren &amp; einfügen</p>
                  <input
                    ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paste">
            <Card>
              <CardContent className="p-4 space-y-3">
                <Label>Tabelle aus Excel / Google Sheets kopieren und hier einfügen</Label>
                <Textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={'Firma\tTelefon\tWebsite\nMayer GmbH\t+49 89 123456\twww.mayer.de'}
                  rows={8}
                  className="font-mono text-xs"
                />
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!pasteText.trim()}
                  onClick={() => loadTable(pasteText, 'Tabelle')}
                >
                  Tabelle übernehmen
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sheet">
            <Card>
              <CardContent className="p-4 space-y-3">
                <Label>Google-Sheets-Link (Freigabe: „Jeder mit dem Link kann ansehen“)</Label>
                <div className="flex gap-2">
                  <Input
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/…"
                  />
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSheet} disabled={sheetLoading || !sheetUrl.trim()}>
                    {sheetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Laden'}
                  </Button>
                </div>
                <p className="text-xs text-slate-400">
                  Ein Google Doc mit einer Tabelle? Tabelle im Doc markieren, kopieren und im Tab „Einfügen“ einfügen.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <>
          {/* Spalten-Mapping + Vorschau */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Spalten zuordnen ({dataRows.length} Zeilen)</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setRows([])}>Andere Quelle wählen</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="text-sm w-full">
                  <thead>
                    <tr>
                      {mapping.map((field, i) => (
                        <th key={i} className="p-1.5 text-left min-w-[150px]">
                          <Select value={field} onValueChange={(v) => setColMapping(i, v as TargetField)}>
                            <SelectTrigger className={`h-8 text-xs ${field === 'ignore' ? 'text-slate-400' : 'font-medium'}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(FIELD_LABELS) as TargetField[]).map((f) => (
                                <SelectItem key={f} value={f}>{FIELD_LABELS[f]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {hasHeader && <span className="block text-[10px] text-slate-400 font-normal mt-0.5 truncate">{rows[0][i]}</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.slice(0, 5).map((r, ri) => (
                      <tr key={ri} className="border-t border-slate-100">
                        {mapping.map((_, ci) => (
                          <td key={ci} className="p-1.5 text-slate-600 truncate max-w-[200px]">{r[ci]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {dataRows.length > 5 && (
                <p className="text-xs text-slate-400 mt-2">… und {dataRows.length - 5} weitere Zeilen</p>
              )}
            </CardContent>
          </Card>

          {/* Validierung */}
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1 text-green-700">
              <CheckCircle2 className="h-4 w-4" /> {validation.ok} importierbar
            </span>
            {validation.noKey > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-4 w-4" /> {validation.noKey} ohne Website/Telefon (Research versucht Website zu finden)
              </span>
            )}
            {validation.noCompany > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="h-4 w-4" /> {validation.noCompany} ohne Unternehmensname (werden abgelehnt)
              </span>
            )}
          </div>
          {!companyMapped && (
            <p className="text-sm text-red-600 font-medium">
              ⚠️ Bitte eine Spalte als „Unternehmen“ zuordnen — ohne Firmenname kein Import.
            </p>
          )}

          {/* Import-Optionen */}
          <Card>
            <CardContent className="p-4 grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Lead-Quelle</Label>
                <Input value={leadSource} onChange={(e) => setLeadSource(e.target.value)} placeholder="z.B. Messe-Liste, Kammer-Verzeichnis…" />
              </div>
              <div className="space-y-1.5">
                <Label>Zuweisen an</Label>
                <Select value={assignTo} onValueChange={setAssignTo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allProfiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name || p.email} ({p.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Fehler bleibt stehen, bis der nächste Versuch startet */}
          {importError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-red-800">
                  <XCircle className="h-4 w-4" /> Import fehlgeschlagen
                </div>
                <p className="text-xs text-red-700 break-words">{importError}</p>
                <p className="text-[11px] text-red-500">
                  Diesen Text bitte vollständig weitergeben — daran lässt sich die Ursache erkennen.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Import */}
          {importing ? (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importiere &amp; recherchiere… {progress.done}/{progress.total} Leads
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Jeder Lead durchläuft Dedup-Check, No-Fit-Filter und Research (Website/Social/Pain) — das dauert einen Moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!companyMapped || validation.ok + validation.noKey === 0}
              onClick={handleImport}
            >
              <Upload className="h-4 w-4 mr-1" />
              {validation.ok + validation.noKey} Leads importieren &amp; recherchieren
            </Button>
          )}
        </>
      )}
    </div>
  )
}
