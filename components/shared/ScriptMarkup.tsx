'use client'

// ============================================================
// Farbcode-Markup für HK-Skripte (Migration 016) — gemeinsame
// Render-Bausteine für ScriptPanel (Call) und ScriptsClient (Review).
// [G]…[/G] = Schlüsselsatz (gelb) · [J]…[/J] = Ja-Trigger (grün, danach still)
// [R]…[/R] = Regie, nicht vorlesen (blau, kursiv) · [U]…[/U] = Wort betonen.
// Übrige [Platzhalter] werden orange markiert (vor dem Call füllen).
// ============================================================

export const SCRIPT_FONT = { fontFamily: 'Georgia, "Times New Roman", serif' }

/** Markup-Tags für Klartext-Kopien entfernen. */
export function stripMarkup(text: string): string {
  return text.replace(/\[\/?[GJRU]\]/g, '')
}

export function renderMarkup(text: string, key = 0): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /\[(G|J|R|U)\]([\s\S]*?)\[\/\1\]/
  let rest = text
  let k = key
  while (rest.length > 0) {
    const m = rest.match(re)
    if (!m || m.index === undefined) { out.push(...renderPlaceholders(rest, k)); break }
    if (m.index > 0) out.push(...renderPlaceholders(rest.slice(0, m.index), k))
    const inner = renderMarkup(m[2], k * 100 + 1)
    const tag = m[1]
    k++
    if (tag === 'G') out.push(<mark key={`g${k}`} className="bg-yellow-200/80 text-slate-900 rounded px-0.5">{inner}</mark>)
    else if (tag === 'J') out.push(<mark key={`j${k}`} className="bg-green-200/90 text-slate-900 font-semibold rounded px-0.5">{inner}</mark>)
    else if (tag === 'R') out.push(<span key={`r${k}`} className="bg-blue-100 text-blue-800 italic text-[0.85em] rounded px-1" style={{ fontFamily: 'inherit' }}>{inner}</span>)
    else out.push(<u key={`u${k}`} className="decoration-2 underline-offset-2">{inner}</u>)
    rest = rest.slice(m.index + m[0].length)
  }
  return out
}

function renderPlaceholders(text: string, key = 0): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /\[([^\[\]\n]{1,40})\]/
  let rest = text
  let k = 0
  while (rest.length > 0) {
    const m = rest.match(re)
    if (!m || m.index === undefined) { out.push(rest); break }
    if (m.index > 0) out.push(rest.slice(0, m.index))
    k++
    out.push(
      <span key={`p${key}-${k}`} className="bg-orange-200/80 text-orange-900 rounded px-1 text-[0.9em] font-medium" style={{ fontFamily: 'ui-sans-serif, system-ui' }}>
        [{m[1]}]
      </span>
    )
    rest = rest.slice(m.index + m[0].length)
  }
  return out
}

export function ColorLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
      <span><mark className="bg-yellow-200/80 rounded px-1">Gelb</mark> Schlüsselsatz</span>
      <span><mark className="bg-green-200/90 rounded px-1 font-semibold">Grün</mark> Ja-Trigger → still sein</span>
      <span><span className="bg-blue-100 text-blue-800 italic rounded px-1">Blau</span> Regie – nicht vorlesen</span>
      <span><span className="bg-orange-200/80 text-orange-900 rounded px-1">Orange</span> Platzhalter</span>
      <span><u className="decoration-2">Unterstrichen</u> = betonen</span>
    </div>
  )
}
