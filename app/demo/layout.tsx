import Link from 'next/link'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Demo banner */}
      <div className="bg-amber-400 text-amber-900 text-center text-sm font-semibold py-2 px-4">
        DEMO-MODUS — Alle Daten sind Testdaten. Aktionen werden nicht gespeichert.
        <span className="ml-4 inline-flex gap-3">
          <Link href="/demo/opener" className="underline hover:text-amber-950">Opener</Link>
          <Link href="/demo/setter" className="underline hover:text-amber-950">Setter</Link>
          <Link href="/demo/closer" className="underline hover:text-amber-950">Closer</Link>
          <Link href="/demo/lead/dataflow" className="underline hover:text-amber-950">Closer-Dossier</Link>
        </span>
      </div>
      {children}
    </div>
  )
}
