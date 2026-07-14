import Link from 'next/link'

export default function DemoPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">HK Sales Cockpit</h1>
        <p className="text-slate-500">Demo — Wähle eine Rolle</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        <Link href="/demo/opener" className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border-2 border-orange-200 hover:border-orange-400 hover:shadow-md transition-all">
          <span className="text-4xl">📞</span>
          <span className="font-bold text-slate-800">Opener</span>
          <span className="text-xs text-slate-500 text-center">Erstkontakt, Lead qualifizieren</span>
        </Link>
        <Link href="/demo/setter" className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-md transition-all">
          <span className="text-4xl">🎯</span>
          <span className="font-bold text-slate-800">Setter</span>
          <span className="text-xs text-slate-500 text-center">Qualifizieren, Closer-Gate prüfen</span>
        </Link>
        <Link href="/demo/closer" className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all">
          <span className="text-4xl">💼</span>
          <span className="font-bold text-slate-800">Closer</span>
          <span className="text-xs text-slate-500 text-center">Calls, Dossier, Angebote</span>
        </Link>
      </div>
      <Link href="/demo/lead/dataflow" className="text-sm text-blue-600 underline hover:text-blue-800">
        → Direkt zum Closer-Dossier (DataFlow Consulting)
      </Link>
    </div>
  )
}
