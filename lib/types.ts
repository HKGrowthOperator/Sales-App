export type UserRole = 'opener' | 'setter' | 'closer' | 'admin'

export type LeadStatus =
  | 'Neu'
  | 'Zu kontaktieren'
  | 'Nicht erreicht'
  | 'Kontaktiert'
  | 'Interessiert'
  | 'Setter-Call geplant'
  | 'Setter qualifiziert'
  | 'Closer-Call geplant'
  | 'Angebot vorbereiten'
  | 'Angebot gesendet'
  | 'Follow-up'
  | 'Gewonnen'
  | 'Verloren'
  | 'Später erneut kontaktieren'
  | 'Nicht passend'
  | 'Nicht mehr kontaktieren'

export type LeadScore = 'A' | 'B' | 'C' | 'No-Fit'

export type EntryAngle =
  | 'Außenwirkung'
  | 'Website'
  | 'Social Media'
  | 'Anfragen'
  | 'KI-Zeitersparnis'
  | 'Recruiting'
  | 'Personal Brand'
  | 'Unternehmensbrand'
  | 'Paid Ads'
  | 'Lokale Sichtbarkeit'
  | 'Automationen & CRM'
  | 'Content-Produktion'
  | 'Imagefilm'
  | 'Events'
  | 'Komplettangebot'

export type RoleContext = 'Opener' | 'Setter' | 'Closer'

export type CallResult =
  // gemeinsam
  | 'Nicht erreicht'
  | 'Kein Interesse'
  | 'Interessiert'
  | 'Termin vereinbart'
  | 'Rückruf vereinbart'
  | 'Rückruf gewünscht'
  | 'Nicht passend'
  | 'Später erneut kontaktieren'
  | 'Nicht mehr kontaktieren'
  // Opener
  | 'Falscher Ansprechpartner'
  // Setter
  | 'Qualifiziert für Closer'
  | 'Noch nicht qualifiziert'
  | 'Follow-up nötig'
  | 'Kein Entscheider'
  | 'Kein echter Pain'
  | 'Timing später'
  // Closer
  | 'Angebot vorbereiten'
  | 'Angebot gesendet'
  | 'Follow-up'
  | 'Gewonnen'
  | 'Verloren'

export type AppointmentType = 'Setter-Call' | 'Closer-Call' | 'Follow-up'
export type AppointmentStatus = 'Geplant' | 'Bestätigt' | 'Stattgefunden' | 'Abgesagt' | 'No-Show'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  company_name: string
  contact_name: string | null
  role_title: string | null
  phone: string | null
  email: string | null
  website: string | null
  instagram: string | null
  linkedin: string | null
  industry: string | null
  lead_source: string | null
  lead_score: LeadScore | null
  status: LeadStatus
  assigned_to: string | null
  closer: string | null
  pain_guess: string | null
  entry_angle: EntryAngle | null
  last_contact_at: string | null
  next_step: string | null
  followup_at: string | null
  appointment_at: string | null
  decision_maker_status: string | null
  preferred_contact_channel: string | null
  last_note: string | null
  // V1-Fundament (003)
  do_not_contact: boolean
  opt_out_at: string | null
  opt_out_reason: string | null
  relevance_reason: string | null
  recommended_module_keys: string[] | null
  // Lead Radar (008/009/010)
  radar_target_id?: string | null
  dedup_key?: string | null
  opener_pitch?: string | null
  setter_context?: string | null
  closer_context?: string | null
  radar_analysis?: string | null
  automation_potential?: string | null
  // Wachstumssystem-Liste (Rich-Felder)
  address?: string | null
  cluster?: string | null
  employee_count?: string | null
  management?: string | null
  owner_led?: string | null
  package_potential?: string | null
  cross_sell_score?: number | null
  key_bottlenecks?: string | null
  offer_level1?: string | null
  offer_level2?: string | null
  offer_level3?: string | null
  recommended_entry?: string | null
  hiring_signal?: string | null
  approach_notes?: string | null
  buy_signal?: string | null
  entry_point?: string | null
  verification_status?: string | null
  open_positions_raw?: string | null
  employee_count_min?: number | null
  employee_count_max?: number | null
  primary_decision_maker_id?: string | null
  // Umsatz (optional, nie erfunden)
  revenue_amount?: number | null
  revenue_currency?: string | null
  revenue_period?: 'monat' | 'jahr' | null
  revenue_is_estimate?: boolean | null
  revenue_source?: string | null
  revenue_confidence?: number | null
  revenue_raw?: string | null
  created_at: string
  updated_at: string
  // joined
  assigned_profile?: Profile | null
  closer_profile?: Profile | null
  call_notes?: CallNote[]
  appointments?: Appointment[]
  decision_makers?: DecisionMaker[]
}

export interface DecisionMaker {
  id: string
  lead_id: string
  full_name: string
  first_name: string | null
  last_name: string | null
  title: string | null
  role_title: string | null
  is_primary: boolean
  verification_status: string | null
  source: string | null
  verified_at: string | null
  note: string | null
  raw: string | null
  created_at: string
  updated_at: string
}

export interface CallNote {
  id: string
  lead_id: string
  user_id: string
  role_context: RoleContext
  call_result: CallResult | null
  interest_level: number | null
  interest_topics: string[] | null
  email_confirmed: boolean
  preferred_contact_channel: string | null
  appointment_requested: boolean
  appointment_at: string | null
  decision_makers_needed: string | null
  objections: string[] | null
  raw_note: string | null
  structured_summary: string | null
  next_step: string | null
  created_at: string
  // joined
  user?: Profile
}

export interface Appointment {
  id: string
  lead_id: string
  closer: string | null
  appointment_at: string
  appointment_type: AppointmentType
  attendees: string[] | null
  customer_email: string | null
  status: AppointmentStatus
  calendar_event_id: string | null
  confirmation_email_status: 'ausstehend' | 'gesendet' | 'fehlgeschlagen'
  reminder_24h_status: 'ausstehend' | 'gesendet' | 'fehlgeschlagen'
  reminder_1h_status: 'ausstehend' | 'gesendet' | 'fehlgeschlagen'
  notes: string | null
  created_at: string
  // joined
  lead?: Lead
  closer_profile?: Profile
}

export type ScriptType = 'master' | 'personal'

export type ScriptStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived'

export type ScriptSituation =
  // Opener — Einstiegswinkel
  | 'standard_lokal'
  | 'website'
  | 'social_media'
  | 'personal_brand'
  | 'anfragen'
  | 'anfragen_lokal'
  | 'ki_automation'
  | 'recruiting'
  | 'content_drehtag'
  | 'imagefilm'
  | 'events'
  | 'komplettangebot'
  // Opener — Einwände & Hindernisse
  | 'gatekeeper'
  | 'einwand_kein_interesse'
  | 'einwand_info_senden'
  | 'einwand_haben_jemanden'
  | 'einwand_keine_zeit'
  | 'einwand_preis'
  | 'einwand_hat_agentur'
  | 'einwand_macht_schon_social'
  // Setter
  | 'qualifizierung'
  | 'pain_check'
  | 'entscheider'
  | 'timing'
  | 'closer_freigabe'
  | 'no_fit_abschluss'
  // Closer
  | 'call_start'
  | 'diagnose'
  | 'engpass_spiegeln'
  | 'loesungspfad'
  | 'angebot'
  | 'followup'
  | 'no_fit'

export const SITUATION_LABELS: Record<ScriptSituation, string> = {
  // Opener Einstieg
  standard_lokal:             'Genereller Erstkontakt',
  website:                    'Website fehlt / schwach',
  social_media:               'Social Media Betreuung',
  personal_brand:             'Personal Brand / Außenwirkung',
  anfragen:                   'Ads & Leadgenerierung',
  anfragen_lokal:             'Lokale Sichtbarkeit & Google',
  ki_automation:              'Automationen & CRM',
  recruiting:                 'Recruiting & Mitarbeiter',
  content_drehtag:            'Content-Produktion & Drehtag',
  imagefilm:                  'Imagefilm & Markenfilm',
  events:                     'Events & Event-Content',
  komplettangebot:            'Komplettangebot / Ganzheitlich',
  // Einwände
  gatekeeper:                 'Gatekeeper',
  einwand_kein_interesse:     'Einwand: Kein Interesse',
  einwand_info_senden:        'Einwand: Mail senden',
  einwand_haben_jemanden:     'Einwand: Haben schon jemanden',
  einwand_keine_zeit:         'Einwand: Keine Zeit',
  einwand_preis:              'Einwand: Was kostet das?',
  einwand_hat_agentur:        'Einwand: Haben schon Agentur',
  einwand_macht_schon_social: 'Einwand: Machen schon Social Media',
  // Setter
  qualifizierung:             'Qualifizierung',
  pain_check:                 'Pain prüfen',
  entscheider:                'Entscheider klären',
  timing:                     'Timing prüfen',
  closer_freigabe:            'Closer-Call freigeben',
  no_fit_abschluss:           'No-Fit beenden',
  // Closer
  call_start:                 'Call-Start',
  diagnose:                   'Diagnosefragen',
  engpass_spiegeln:           'Engpass spiegeln',
  loesungspfad:               'Lösungspfad erklären',
  angebot:                    'Angebot',
  followup:                   'Follow-up fixieren',
  no_fit:                     'No-Fit',
}

export interface Script {
  id: string
  role: RoleContext
  entry_angle: EntryAngle | null
  industry: string | null
  title: string
  // Legacy-Felder (bleiben für Kompatibilität)
  opening_line: string | null
  main_body: string | null
  closing_line: string | null
  objection_handling: ObjectionHandling[]
  is_active: boolean
  // V2-Felder
  script_type: ScriptType
  situation: ScriptSituation | null
  parent_script_id: string | null
  owner_user_id: string | null
  status: ScriptStatus
  version: number
  relevance_line: string | null
  core_question: string | null
  transition_line: string | null
  call_goal: string | null
  full_script: string | null
  required_notes_json: string[]
  // Erweiterte Struktur (echte HK-Skripte)
  positioning: string | null
  method_name: string | null
  qualifying_questions_json: string[]
  tone_guidance: string | null
  created_by: string | null
  approved_by: string | null
  approved_at: string | null
  rejection_note: string | null
  created_at: string
  updated_at: string
}

export interface ObjectionHandling {
  objection: string
  response: string
}

// Einwand-Library (wiederverwendbare Bausteine, separat von Skripten)
export interface ObjectionItem {
  id: string
  key: string
  role: RoleContext | null
  entry_angle: EntryAngle | null
  objection_label: string
  response: string
  psychology_note: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

// Angebots-/Modul-Katalog
export interface OfferModule {
  id: string
  key: string
  name: string
  category: 'social' | 'website' | 'ads' | 'recruiting' | 'content' | 'community' | 'strategy'
  tier: string | null
  billing: 'monthly' | 'project' | 'addon'
  price_anchor_text: string | null
  price_min: number | null
  price_max: number | null
  internal_priority: 'A' | 'B' | 'C' | null
  description: string | null
  is_addon: boolean
  is_active: boolean
  sort_order: number
  created_at: string
}

// Call-Session (operative Wirbelsäule)
export type CallSessionStatus = 'aktiv' | 'abgeschlossen' | 'abgebrochen'

export interface CallSession {
  id: string
  user_id: string
  role_context: RoleContext
  session_goal: string | null
  status: CallSessionStatus
  planned_lead_count: number
  started_at: string
  ended_at: string | null
  review_done: boolean
  common_objections: string[] | null
  what_worked: string | null
  what_to_improve: string | null
  content_ideas: string | null
  learnings: string | null
  leads_to_prioritize: string | null
  created_at: string
}

export interface SessionLead {
  id: string
  session_id: string
  lead_id: string
  position: number
  state: 'pending' | 'done' | 'skipped'
  outcome: CallResult | null
  call_note_id: string | null
  handled_at: string | null
  created_at: string
  lead?: Lead
}

export interface EmailTemplate {
  id: string
  role: RoleContext
  template_type: string
  subject: string
  body: string
  variables: string[] | null
  is_active: boolean
  created_at: string
}

export interface Followup {
  id: string
  lead_id: string
  assigned_to: string | null
  due_at: string
  type: 'Anruf' | 'E-Mail' | 'WhatsApp' | 'LinkedIn' | 'Meeting'
  note: string | null
  status: 'offen' | 'erledigt' | 'übersprungen'
  created_at: string
  // joined
  lead?: Lead
}

// ============================================================
// Lead Radar (Discovery- & Enrichment-Layer, Migration 008)
// ============================================================

export type RadarStatus =
  | 'discovered'
  | 'enriched'
  | 'scored'
  | 'promoted'
  | 'dismissed'
  | 'duplicate'

export type DecisionMakerReachability = 'direkt' | 'zentrale' | 'unbekannt'

// HK-Produktbereiche, in die der Radar einsortiert
export type ProductArea = 'Website' | 'Social Media' | 'KI-Integration'

export type RadarPriority = 'low' | 'medium' | 'high'
export type RadarScanStatus = 'queued' | 'running' | 'done' | 'failed'

// Ein KI-Research-Lauf (App triggert → n8n recherchiert → schreibt Targets)
export interface RadarScan {
  id: string
  requested_by: string | null
  region: string
  radius_km: number | null
  search_scope: string
  target_offer: string | null
  desired_count: number
  quality_focus: string | null
  status: RadarScanStatus
  found_count: number
  kept_count: number
  n8n_run_id: string | null
  error: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
}

// Eingaben des Scan-Formulars (= Body des /api/radar/scan-Triggers)
export interface RadarScanRequest {
  region: string
  radius_km?: number | null
  search_scope: string
  target_offer?: string | null
  desired_count?: number
  quality_focus?: string | null
}

export interface RadarTarget {
  id: string
  // Identität / Dedup
  company_name: string
  dedup_key: string | null
  industry: string | null
  region: string | null
  // Basics
  website: string | null
  instagram: string | null
  phone: string | null
  email: string | null
  address: string | null
  opening_hours: string | null
  // Entscheider
  decision_maker_name: string | null
  decision_maker_role: string | null
  decision_maker_reachability: DecisionMakerReachability
  decision_maker_note: string | null
  // Achse 1 — Website
  website_present: boolean | null
  website_score: number | null
  website_analysis: string | null
  // Achse 2 — Social Media
  instagram_present: boolean | null
  social_score: number | null
  social_analysis: string | null
  post_frequency: string | null
  posts_reels: boolean | null
  has_stories: boolean | null
  follower_count: number | null
  // Achse 3 — KI-Integration
  ai_applicable: boolean | null
  ai_score: number | null
  ai_analysis: string | null
  // Achse 4 — Werte- / Soul-Fit
  soul_fit_score: number | null
  soul_fit_reason: string | null
  // Gesamteinordnung
  overall_score: LeadScore | null
  product_areas: ProductArea[] | null
  recommended_module_keys: string[] | null
  // Pains pro Rolle
  pain_summary: string | null
  opener_pitch: string | null
  setter_context: string | null
  closer_context: string | null
  // Lebenszyklus
  status: RadarStatus
  scan_source: string | null
  scanned_at: string | null
  promoted_lead_id: string | null
  dismissed_reason: string | null
  // n8n-Research-Kontrakt (Migration 010)
  scan_id: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  google_maps_url: string | null
  social_url: string | null
  sources: string[] | null
  company_summary: string | null
  detected_weakness: string | null
  why_interesting: string | null
  recommended_offer: string | null
  opener_angle: string | null
  priority: RadarPriority | null
  confidence: number | null
  missing_data: string[] | null
  lead_score_num: number | null
  created_at: string
  updated_at: string
}

// Read-Back aus v_radar_lead_state (Migration 009): CRM-Stand je dedup_key.
// Sagt dem Radar/Admin, was mit einer Firma im CRM schon passiert ist, damit
// niemand doppelt akquiriert. Match: radar_targets.dedup_key === dedup_key.
export interface RadarLeadState {
  dedup_key: string
  lead_id: string
  company_name: string | null
  status: string
  lead_score: LeadScore | null
  do_not_contact: boolean
  last_contact_at: string | null
  appointment_at: string | null
  radar_target_id: string | null
  is_customer: boolean
  is_active_deal: boolean
}

export const RADAR_STATUS_CONFIG: Record<RadarStatus, { color: string; label: string }> = {
  discovered: { color: 'slate',  label: 'Entdeckt' },
  enriched:   { color: 'sky',    label: 'Angereichert' },
  scored:     { color: 'blue',   label: 'Bewertet' },
  promoted:   { color: 'green',  label: 'In Sales-App' },
  dismissed:  { color: 'zinc',   label: 'Verworfen' },
  duplicate:  { color: 'amber',  label: 'Duplikat' },
}

export const PRODUCT_AREA_CONFIG: Record<ProductArea, { color: string; hex: string }> = {
  'Website':        { color: 'blue',    hex: '#2563eb' },
  'Social Media':   { color: 'fuchsia', hex: '#c026d3' },
  'KI-Integration': { color: 'emerald', hex: '#059669' },
}

// ============================================================
// Status-Konfiguration für die UI
// ============================================================

export const STATUS_CONFIG: Record<LeadStatus, { color: string; next: LeadStatus[] }> = {
  'Neu': { color: 'gray', next: ['Zu kontaktieren', 'Nicht passend'] },
  'Zu kontaktieren': { color: 'blue', next: ['Nicht erreicht', 'Kontaktiert', 'Interessiert', 'Nicht passend', 'Nicht mehr kontaktieren'] },
  'Nicht erreicht': { color: 'orange', next: ['Zu kontaktieren', 'Kontaktiert', 'Interessiert', 'Nicht passend'] },
  'Kontaktiert': { color: 'sky', next: ['Interessiert', 'Nicht erreicht', 'Follow-up', 'Später erneut kontaktieren', 'Nicht passend', 'Nicht mehr kontaktieren'] },
  'Interessiert': { color: 'yellow', next: ['Setter-Call geplant', 'Nicht passend'] },
  'Setter-Call geplant': { color: 'purple', next: ['Setter qualifiziert', 'Nicht passend', 'Follow-up'] },
  'Setter qualifiziert': { color: 'indigo', next: ['Closer-Call geplant', 'Nicht passend'] },
  'Closer-Call geplant': { color: 'cyan', next: ['Angebot vorbereiten', 'Nicht passend', 'Follow-up'] },
  'Angebot vorbereiten': { color: 'teal', next: ['Angebot gesendet'] },
  'Angebot gesendet': { color: 'lime', next: ['Gewonnen', 'Verloren', 'Follow-up'] },
  'Follow-up': { color: 'amber', next: ['Interessiert', 'Setter-Call geplant', 'Verloren', 'Nicht passend'] },
  'Gewonnen': { color: 'green', next: [] },
  'Verloren': { color: 'red', next: ['Später erneut kontaktieren'] },
  'Später erneut kontaktieren': { color: 'amber', next: ['Zu kontaktieren', 'Nicht passend'] },
  'Nicht passend': { color: 'slate', next: [] },
  'Nicht mehr kontaktieren': { color: 'zinc', next: [] },
}

export const SCORE_CONFIG: Record<LeadScore, { color: string; label: string }> = {
  'A': { color: 'green', label: 'A – Top Lead' },
  'B': { color: 'blue', label: 'B – Gut' },
  'C': { color: 'yellow', label: 'C – Möglich' },
  'No-Fit': { color: 'red', label: 'No-Fit' },
}

export const OPENER_STATUSES: LeadStatus[] = ['Neu', 'Zu kontaktieren', 'Nicht erreicht']
export const SETTER_STATUSES: LeadStatus[] = ['Interessiert', 'Setter-Call geplant', 'Setter qualifiziert']
export const CLOSER_STATUSES: LeadStatus[] = ['Closer-Call geplant', 'Angebot vorbereiten', 'Angebot gesendet', 'Follow-up']
