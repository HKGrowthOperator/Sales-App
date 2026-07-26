// ============================================================
// Profilspalten, die an den Browser gehen dürfen.
// ------------------------------------------------------------
// Das Profil wird in fast jeder Seite geladen und als Eigenschaft an
// Client-Komponenten weitergereicht. Alles, was dabei mitkommt, steht
// im HTML-Quelltext der Seite.
//
// Mit select('*') war seit der Kalender-Anbindung auch
// google_refresh_token dabei — ein langlebiger Zugang zum
// Google-Konto, der eine Abmeldung überdauert. Ein Sitzungscookie
// laeuft ab, ein Refresh-Token nicht.
//
// Deshalb hier eine feste Liste statt '*'. Neue Spalten sind
// standardmäßig NICHT dabei und müssen bewusst aufgenommen werden.
// ============================================================
// `as const` ist wichtig: Supabase leitet den Ergebnistyp aus dem
// Spaltentext ab. Ohne Literal-Typ kennt TypeScript die Felder nicht mehr.
export const PROFILE_PUBLIC_COLUMNS =
  'id, email, full_name, role, avatar_url, is_active, color, timezone, google_calendar_id, google_oauth_connected, default_call_link, created_at, updated_at' as const
