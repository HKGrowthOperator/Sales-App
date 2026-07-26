import type { NextConfig } from 'next'

// ============================================================
// Sicherheits-Header.
// ------------------------------------------------------------
// Erst jetzt sinnvoll, wo die App unter HTTPS läuft. Sie kosten
// nichts, schließen aber eine Reihe von Angriffswegen, die sonst
// offen stehen — vor allem das Einbetten der angemeldeten
// Oberfläche in eine fremde Seite (Clickjacking).
// ============================================================
const securityHeaders = [
  // Browser merkt sich: diese Domain nur noch über HTTPS aufrufen.
  // Verhindert, dass ein erster Aufruf über http abgefangen wird.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },

  // Kein Einbetten in fremde Seiten — sonst könnte eine präparierte
  // Seite die angemeldete App unsichtbar überlagern und Klicks abgreifen.
  { key: 'X-Frame-Options', value: 'DENY' },

  // Browser darf den Inhaltstyp nicht "raten". Verhindert, dass eine
  // hochgeladene Datei als Skript ausgeführt wird.
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Beim Klick auf externe Links (Kundenwebsites im Dialer) wird nur
  // die Domain übertragen, nicht der volle Pfad mit Lead-ID.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // Kamera, Mikrofon und Standort braucht die App nicht.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  // Verrät sonst unnötig, womit die App gebaut ist.
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
