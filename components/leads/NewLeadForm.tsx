'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Profile, EntryAngle, LeadStatus } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/hooks/use-toast'
import { Loader2, ChevronLeft } from 'lucide-react'

const ENTRY_ANGLES: EntryAngle[] = [
  'Außenwirkung', 'Website', 'Social Media', 'Anfragen', 'KI-Zeitersparnis', 'Recruiting',
]

const INDUSTRIES = [
  'Handwerk', 'Dienstleistung', 'Handel', 'Gesundheit', 'IT/Tech', 'Immobilien',
  'Gastronomie', 'Coaching', 'Steuerberatung', 'Unternehmensberatung', 'HR / Recruiting',
  'Marketing', 'E-Commerce', 'Sonstiges',
]

interface Props {
  profile: Profile
  allProfiles: Pick<Profile, 'id' | 'full_name' | 'role' | 'email'>[]
}

export function NewLeadForm({ profile, allProfiles }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    role_title: '',
    phone: '',
    email: '',
    website: '',
    instagram: '',
    linkedin: '',
    industry: '',
    lead_source: '',
    entry_angle: '' as EntryAngle | '',
    pain_guess: '',
    status: 'Zu kontaktieren' as LeadStatus,
    assigned_to: profile.id,
    preferred_contact_channel: '' as string,
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company_name.trim()) {
      toast({ title: 'Pflichtfeld fehlt', description: 'Unternehmensname ist erforderlich.', variant: 'destructive' })
      return
    }
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...form,
        entry_angle: form.entry_angle || null,
        assigned_to: form.assigned_to || null,
      })
      .select()
      .single()

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    toast({ title: 'Lead erstellt!', description: `${form.company_name} wurde hinzugefügt.` })
    router.push(`/leads/${data.id}`)
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/leads" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2">
          <ChevronLeft className="h-4 w-4" /> Zur Leadliste
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Neuen Lead hinzufügen</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Unternehmen *</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Unternehmensname *</Label>
              <Input value={form.company_name} onChange={e => update('company_name', e.target.value)} placeholder="Mayer GmbH" required />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Branche</Label>
                <Select value={form.industry} onValueChange={v => update('industry', v)}>
                  <SelectTrigger><SelectValue placeholder="Branche wählen…" /></SelectTrigger>
                  <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Lead-Quelle</Label>
                <Input value={form.lead_source} onChange={e => update('lead_source', e.target.value)} placeholder="Kaltakquise, LinkedIn, Empfehlung…" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input value={form.website} onChange={e => update('website', e.target.value)} placeholder="www.beispiel.de" />
              </div>
              <div className="space-y-1.5">
                <Label>Instagram</Label>
                <Input value={form.instagram} onChange={e => update('instagram', e.target.value)} placeholder="instagram.com/…" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>LinkedIn</Label>
              <Input value={form.linkedin} onChange={e => update('linkedin', e.target.value)} placeholder="linkedin.com/in/…" />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Kontaktperson</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.contact_name} onChange={e => update('contact_name', e.target.value)} placeholder="Thomas Mayer" />
              </div>
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Input value={form.role_title} onChange={e => update('role_title', e.target.value)} placeholder="Geschäftsführer" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+49 89 123456" />
              </div>
              <div className="space-y-1.5">
                <Label>E-Mail</Label>
                <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="name@unternehmen.de" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Bevorzugter Kontaktweg</Label>
              <Select value={form.preferred_contact_channel} onValueChange={v => update('preferred_contact_channel', v)}>
                <SelectTrigger><SelectValue placeholder="Wählen…" /></SelectTrigger>
                <SelectContent>
                  {['Telefon', 'WhatsApp', 'E-Mail', 'LinkedIn'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sales */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Sales-Einschätzung</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Einstiegswinkel / HK-Hebel</Label>
              <Select value={form.entry_angle} onValueChange={v => update('entry_angle', v)}>
                <SelectTrigger><SelectValue placeholder="Winkel wählen…" /></SelectTrigger>
                <SelectContent>{ENTRY_ANGLES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vermuteter Pain</Label>
              <Textarea
                value={form.pain_guess}
                onChange={e => update('pain_guess', e.target.value)}
                placeholder="Was ist der vermutete Engpass des Unternehmens?"
                rows={3}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => update('status', v as LeadStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['Neu', 'Zu kontaktieren', 'Interessiert'] as LeadStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Zugewiesen an</Label>
                <Select value={form.assigned_to} onValueChange={v => update('assigned_to', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allProfiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name || p.email} ({p.role})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none" disabled={loading}>
            {loading ? <><Loader2 className="animate-spin h-4 w-4" /> Speichere…</> : 'Lead erstellen'}
          </Button>
          <Link href="/leads">
            <Button type="button" variant="outline" size="lg">Abbrechen</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
