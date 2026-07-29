# HK Call-Cockpit — Skripte, Kette & Betrieb

Stand: Juli 2026. Dieses Dokument beschreibt die Skript-Integration
(Korthauer-Struktur, 4 Pfeiler × Opener/Setter/Closer) und wie die
Gesamtkette im Betrieb läuft.

## Die Kette (unverändert, nur verdrahtet)

```
Skript (scripts, Master/Personal)
  → Call in der Session (SessionClient + ScriptPanel)
    → Pfeiler-Wahl schreibt entry_angle am Lead
      → Notizen (CallNoteForm) + ggf. Slot-Buchung (bookAppointment)
        → productAreaFromEntryAngle(entry_angle) wählt die Mail-Vorlage
          → email_jobs (Versand über runner.ts, gegated) + Radar/KPI
```

## Die 3 Anruf-Pfeiler (Entscheidung HK, Migration 017)

Es gibt genau **drei Gründe, warum wir anrufen** — der Sales-Mitarbeiter
beherrscht EIN Skript-Set:

| Pfeiler | entry_angle (kanonisch) | product_area | Skripte |
|---|---|---|---|
| 🌐 Website (inkl. Lokal/Google/Anfragen) | `Website` | `website_funnel` | HK ▸ Website — Opener/Setter/Closer |
| 📣 Social & Branding (Firmen **oder** Personal, inkl. Content/Recruiting-Sichtbarkeit) | `Social Media` | `social_media_brand_building` | HK ▸ Social & Branding — … |
| 🤖 KI-Integration & Prozesse | `Automationen & CRM` | `ai_integration` | HK ▸ KI-Automation — … |

**Das Ganzheitliche Wachstumssystem ist KEIN Anruf-Grund** — es ist das
Angebots-Bündel, das im Closing entsteht, wenn mehrere Pfeiler zusammen
Sinn ergeben. Die `growth_system`-Mailvorlagen bleiben dafür aktiv;
eigene Wachstumssystem-Skripte sind archiviert (017). Events, Imagefilm,
Recruiting & Co. sind Leistungen, aber keine eigenen Skripte mehr.

Alle 15 Einstiegswinkel werden über `PILLAR_ANGLE` (lib/script-routing.ts)
auf einen der drei Pfeiler gemappt — z. B. findet ein „Personal Brand"-Lead
automatisch das Social-&-Branding-Skript. Persönliche, freigegebene
Versionen haben weiter Vorrang vor den Mastern.

## Farbcode in den Skripten

`full_script` enthält Markup, das ScriptPanel & Skripte-Seite rendern:

| Tag | Bedeutung |
|---|---|
| `[G]…[/G]` | **Gelb** — Icebreaker/Schlüsselsatz, muss genau so sitzen |
| `[J]…[/J]` | **Grün** — Ja-Trigger (Methodenfrage, Negative Close, Terminfrage) → danach still sein |
| `[R]…[/R]` | **Blau, kursiv** — Regie ((lachen), (Pause)) → NICHT vorlesen |
| `[U]…[/U]` | Unterstrichen — einzelnes Wort betonen |
| `[Name]`, `[Tag 1]` … | **Orange** — Platzhalter; `[Name]`/`[ICH]`/`[E-Mail]` ersetzt die App live aus Lead + Login |

## Skript-Aufbau (Korthauer-Beats → DB-Felder)

| Beat | Feld |
|---|---|
| Ziel des Calls | `call_goal` |
| Tonalität | `tone_guidance` |
| Einstieg (Vorbezug + Agenda + lachen) | `opening_line` |
| Recherche/Proof/Pain | `relevance_line` |
| Methodenfrage | `core_question` |
| Mechanismus („Was ist das?") | `mechanism` (Migration 014) |
| Negative Close / Termin / Preis | `transition_line` |
| Qualifizierung | `qualifying_questions_json` |
| Im Call notieren (hält die Kette) | `required_notes_json` |
| Komplett-Skript mit Farbcode | `full_script` |

Gatekeeper, Erstkontakt-Einwände, Closer-Einwände und Follow-up/No-Show
liegen in `objection_library` (rollen-gefiltert, im Call aufklappbar).

## Betrieb / Run-in

1. **Migrationen** liegen in `supabase/migrations/` (014–016), Ausführung
   im Supabase SQL-Editor oder `node scripts/run-migration.mjs <datei>`
   (benötigt `npm i -D pg`). Alle idempotent; 016 archiviert alte Master
   (kein Löschen — Wiederherstellen = `status='approved'` setzen).
2. **Mail-Versand** bleibt gegated: ohne `RESEND_API_KEY`+`EMAIL_FROM`
   und `email_sending_enabled` wird nichts gesendet (nur Previews).
3. **Skript-Review-Workflow:** Team liest die Master unter *Skripte*
   („Vollständiges Skript" aufklappen, farbcodiert) → Feedback (z. B.
   Whisperflow-Transkript) → Master per SQL/Migration aktualisieren →
   persönliche Versionen entstehen über „Eigene Version erstellen"
   (Freigabe durch Admin).
4. **Neue Sales-Mitarbeiter:** Skripte sind rollen-basiert ([ICH] =
   eingeloggter Nutzer) — keine Namen hart verdrahtet.
