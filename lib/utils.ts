import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { LeadStatus, LeadScore, EntryAngle, CallResult } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '–'
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '–'
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function isToday(date: string | null | undefined): boolean {
  if (!date) return false
  const d = new Date(date)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

export function isTomorrow(date: string | null | undefined): boolean {
  if (!date) return false
  const d = new Date(date)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return d.toDateString() === tomorrow.toDateString()
}

export function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false
  return new Date(date) < new Date()
}

export function getStatusColor(status: LeadStatus): string {
  const colors: Partial<Record<LeadStatus, string>> = {
    'Neu': 'bg-gray-100 text-gray-700 border-gray-200',
    'Zu kontaktieren': 'bg-blue-100 text-blue-700 border-blue-200',
    'Nicht erreicht': 'bg-orange-100 text-orange-700 border-orange-200',
    'Interessiert': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Setter-Call geplant': 'bg-purple-100 text-purple-700 border-purple-200',
    'Setter qualifiziert': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Closer-Call geplant': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Angebot vorbereiten': 'bg-teal-100 text-teal-700 border-teal-200',
    'Angebot gesendet': 'bg-lime-100 text-lime-700 border-lime-200',
    'Follow-up': 'bg-amber-100 text-amber-700 border-amber-200',
    'Gewonnen': 'bg-green-100 text-green-700 border-green-200',
    'Verloren': 'bg-red-100 text-red-700 border-red-200',
    'Nicht passend': 'bg-slate-100 text-slate-500 border-slate-200',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
}

export function getScoreColor(score: LeadScore | null | undefined): string {
  if (!score) return 'bg-gray-100 text-gray-500'
  const colors: Record<LeadScore, string> = {
    'A': 'bg-green-500 text-white',
    'B': 'bg-blue-500 text-white',
    'C': 'bg-yellow-500 text-white',
    'No-Fit': 'bg-red-500 text-white',
  }
  return colors[score]
}

export function getCallResultColor(result: CallResult | null | undefined): string {
  if (!result) return 'bg-gray-100 text-gray-600'
  const colors: Partial<Record<CallResult, string>> = {
    'Nicht erreicht': 'bg-orange-100 text-orange-700',
    'Kein Interesse': 'bg-red-100 text-red-700',
    'Interessiert': 'bg-green-100 text-green-700',
    'Termin vereinbart': 'bg-blue-100 text-blue-700',
    'Rückruf vereinbart': 'bg-yellow-100 text-yellow-700',
    'Rückruf gewünscht': 'bg-yellow-100 text-yellow-700',
    'Qualifiziert für Closer': 'bg-green-100 text-green-700',
    'Angebot vorbereiten': 'bg-teal-100 text-teal-700',
    'Angebot gesendet': 'bg-lime-100 text-lime-700',
    'Gewonnen': 'bg-green-100 text-green-700',
    'Verloren': 'bg-red-100 text-red-700',
    'Nicht mehr kontaktieren': 'bg-zinc-200 text-zinc-700',
    'Nicht passend': 'bg-slate-100 text-slate-600',
  }
  return colors[result] ?? 'bg-gray-100 text-gray-600'
}

export function getEntryAngleEmoji(angle: EntryAngle | null | undefined): string {
  if (!angle) return '🎯'
  const emojis: Partial<Record<EntryAngle, string>> = {
    'Außenwirkung': '✨',
    'Website': '🌐',
    'Social Media': '📱',
    'Anfragen': '📬',
    'KI-Zeitersparnis': '🤖',
    'Recruiting': '👥',
    'Personal Brand': '🧑‍💼',
    'Unternehmensbrand': '🏢',
    'Paid Ads': '📈',
    'Lokale Sichtbarkeit': '📍',
    'Automationen & CRM': '⚙️',
    'Content-Produktion': '🎬',
    'Imagefilm': '🎥',
    'Events': '🎪',
    'Komplettangebot': '🎯',
  }
  return emojis[angle] ?? '🎯'
}

export function fillEmailTemplate(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value || `[${key}]`)
  }
  return result
}

/** Entfernt Markdown-Marker (**fett**, *kursiv*, `code`, # …) für die reine
 *  Text-Anzeige — verhindert sichtbare Sternchen aus importierten Feldern. */
export function stripMarkdown(input: string | null | undefined): string {
  if (!input) return ''
  return String(input)
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **fett**
    .replace(/__(.+?)__/g, '$1')        // __fett__
    .replace(/(^|\s)\*(?!\s)(.+?)\*/g, '$1$2') // *kursiv*
    .replace(/(^|\s)_(?!\s)(.+?)_/g, '$1$2')   // _kursiv_
    .replace(/`([^`]+)`/g, '$1')        // `code`
    .replace(/^#{1,6}\s+/gm, '')         // # Überschrift
    .replace(/^\s*[-*+]\s+/gm, '• ')     // Listenpunkte
    .trim()
}

export function timeAgo(date: string | null | undefined): string {
  if (!date) return '–'
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return `vor ${minutes} Min.`
  if (hours < 24) return `vor ${hours} Std.`
  if (days === 1) return 'gestern'
  if (days < 7) return `vor ${days} Tagen`
  return formatDate(date)
}
