// ============================================================
// Anrede für Geschäftsmails.
// ------------------------------------------------------------
// „Hallo Thomas," ist für einen Geschäftsführer, den man einmal am
// Telefon hatte, zu vertraulich — im deutschen B2B wird gesiezt und mit
// Nachnamen angesprochen.
//
// Sauber wäre „Guten Tag Herr Müller". Dafür braucht es die Anrede, und
// die lässt sich aus einem Vornamen NICHT zuverlässig ableiten — ein
// falsches „Frau" beim Erstkontakt ist schlimmer als eine neutrale
// Formulierung. Deshalb:
//
//   1. Ist die Anrede gepflegt (leads.salutation = 'Herr' | 'Frau'),
//      wird daraus „Herr Müller".
//   2. Sonst der vollständige Name: „Thomas Müller". Neutral, gesiezt,
//      im Geschäftsverkehr üblich, wenn das Geschlecht nicht bekannt ist.
//   3. Ist gar kein Name da, bleibt die Anrede leer und die Vorlagen
//      greifen auf ihre eigene Formulierung zurück.
// ============================================================

export interface SalutationInput {
  contact_name?: string | null
  salutation?: string | null   // 'Herr' | 'Frau', falls gepflegt
}

/** Nachname = alles ab dem zweiten Wort; Titel wie „Dr." werden übersprungen. */
function lastNameOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  const ohneTitel = parts.filter(p => !/^(dr\.?|prof\.?|dipl\.?-?\w*\.?|ing\.?)$/i.test(p))
  return ohneTitel.length > 1 ? ohneTitel[ohneTitel.length - 1] : (ohneTitel[0] || '')
}

/** Ergibt „Herr Müller", „Thomas Müller" oder einen leeren Text. */
export function buildSalutation(lead: SalutationInput | null | undefined): string {
  const name = (lead?.contact_name || '').trim()
  if (!name) return ''
  const anrede = (lead?.salutation || '').trim()
  if (anrede === 'Herr' || anrede === 'Frau') {
    const nach = lastNameOf(name)
    return nach ? `${anrede} ${nach}` : anrede
  }
  return name
}

/** Vorname — bleibt für Vorlagen erhalten, die ihn bewusst nutzen. */
export function firstNameOf(contactName: string | null | undefined): string {
  return (contactName || '').trim().split(/\s+/)[0] || ''
}
