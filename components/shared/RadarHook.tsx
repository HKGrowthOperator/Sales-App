// Kompakte, wiederverwendbare Anzeige eines rollenspezifischen Radar-Pains/Hooks.
// Erscheint überall, wo ein Verkäufer auf Leads schaut (Dashboards, Call, Dossier).
export function RadarHook({
  text,
  label,
  className = '',
}: {
  text?: string | null
  label?: string
  className?: string
}) {
  if (!text) return null
  return (
    <div className={`bg-violet-50 border border-violet-200 rounded-lg px-3 py-2 ${className}`}>
      <span className="text-xs font-semibold text-violet-700">🛰 Radar{label ? ` · ${label}` : ''}: </span>
      <span className="text-xs text-slate-700">{text}</span>
    </div>
  )
}
