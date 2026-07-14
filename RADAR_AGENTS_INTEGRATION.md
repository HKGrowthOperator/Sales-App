# HK Lead Radar — Agenten-Integration (Spec ↔ reales System)

> Brücke zwischen der idealisierten **15-Agent-Spec** (Docs: „HK Agenten Architektur / Prompts / Umsetzung")
> und dem **real gebauten** Lead Radar (Migrationen 008–012, `radar_targets`/`radar_scans`/Promote-RPC, `/radar`-UI, n8n-Webhook).
> Begleitdokument zu [`RADAR_N8N_SETUP.md`](./RADAR_N8N_SETUP.md). Ziel: n8n-Bau ohne Schema-Neubau.

---

## 0. Kernentscheidung (TL;DR)

Die Spec beschreibt **9 Tabellen** (`companies, company_sources, company_snapshots, lead_opportunities, radar_scan_jobs, agent_runs, sales_leads, lead_events, lead_notes`) und einen **Worker, der 15 separate Agenten** durchläuft.

**Das bauen wir NICHT so nach.** Das reale System hat den Großteil bereits — klüger zusammengefasst:

| Spec-Konzept | Reales Äquivalent (existiert) |
|---|---|
| `radar_scan_jobs` | **`radar_scans`** (queued/running/done/failed, found_count/kept_count, n8n_run_id) |
| `companies` + `company_sources` + `lead_opportunities` | **`radar_targets`** (1 Staging-Zeile pro Treffer; Quellen als `sources[]`) |
| `sales_leads` | **`leads`** (die echte CRM-Tabelle aus dem Cockpit) |
| `lead_events` + `lead_notes` | **`call_notes` / `followups` / Automation-Logs** (Cockpit-seitig, [[hk-sales-cockpit]]) |
| „Lead Pool Writer" (DB-Write) | **`radar_targets`-INSERT via Service-Role** (ON CONFLICT dedup_key) |
| „Sales Handoff" (Übergabe) | **`promote_radar_target()` RPC** + menschliches Radar-Review |
| `company_snapshots` | **fehlt** — nur für Agent 15 (Update Watcher) nötig → **Post-MVP** |
| `agent_runs` | **fehlt** — optionale Observability → **Migration 013 (optional)** |

**Zwei Konsequenzen:**
1. Die 15 Agenten sind eine **konzeptionelle Zerlegung** (perfekt für Prompts & Klarheit). Zur **Laufzeit** werden sie zu **wenigen LLM-Calls zusammengefasst** (siehe §3), sonst kostet ein Scan 300+ LLM-Calls.
2. Fast jeder Agent-Output hat schon eine **Spalte** in `radar_targets`. Die Integration ist also primär **Prompt-Engineering im n8n-Workflow**, kein DB-Umbau.

---

## 1. Laufzeit-Topologie (was läuft wo)

```
┌─────────────────────────────────────────────────────────────────┐
│  HK Zentrale (Next.js Cockpit)   — Vercel ODER Terra             │
│  /radar  →  ScanDialog  →  POST /api/radar/scan                  │
│            (legt radar_scans an, status=queued→running,          │
│             feuert n8n-Webhook mit scan_id + Auftrag)            │
└───────────────┬─────────────────────────────────────────────────┘
                │  Webhook (x-radar-secret)
                ▼
┌─────────────────────────────────────────────────────────────────┐
│  n8n auf TERRA  =  „Lead Radar Worker" der Spec                  │
│  ── Phase A (scan-level, 1×) ──  Orchestrator→Search→Web→        │
│                                  Extraction→Dedup                │
│  ── Phase B (pro Kandidat, N×) ─ Fetch→Analyst-Call→             │
│                                  Strategist-Call→QC-Gate         │
│  ── Writer ──  Service-Role-INSERT in radar_targets             │
│  ── Done  ──  radar_scans status=done, found/kept counts        │
│      ↑ ruft LLM-API (OpenAI/Anthropic) + Search-API (Serp/Brave)│
└───────────────┬─────────────────────────────────────────────────┘
                │  Service-Role (bypass RLS)
                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Supabase Postgres (CLOUD)  =  Single Source of Truth           │
│  radar_scans · radar_targets · leads · v_radar_lead_state       │
│  promote_radar_target() RPC                                     │
└───────────────┬─────────────────────────────────────────────────┘
                │  menschliches Review im Cockpit
                ▼
        /radar  →  Promote-Button  →  leads  →  Sales App
```

**Merksatz:** Supabase = Wahrheit · n8n = Recherche-Laufzeit · Cockpit = Auslöser + Review + Sales. Der „Worker" aus der Spec **ist** der n8n-Workflow.

---

## 2. Agent → Spalte: das vollständige Mapping

Jeder der 15 Agenten schreibt seinen Output in **bestehende** `radar_targets`/`radar_scans`-Spalten. Nichts Neues nötig (Ausnahmen markiert).

| # | Agent | Output landet in | Anmerkung |
|---|---|---|---|
| 1 | Scan Orchestrator | *ephemeral* (lebt in n8n) | optional: Plan in `radar_scans.search_plan jsonb` ablegen (neu, Debug) |
| 2 | Search Strategy | *ephemeral* | Queries nur intern |
| 3 | Web Research | *ephemeral* (Kandidatenliste) | schreibt noch nichts |
| 4 | Company Extraction | *Filter* | Müll raus, bevor teure Phase B startet |
| 5 | Deduplication | *Filter* gegen `v_radar_lead_state` (Leads) + `dedup_key`-Unique (Targets) | beides existiert |
| 6 | Website Audit | `website_present, website_score(1–10), website_analysis` | granulare Booleans (has_ssl…) → **in `website_analysis`-Text gefaltet** |
| 7 | Online Presence | `instagram_present, social_score, social_analysis, post_frequency, posts_reels, has_stories, follower_count` | |
| 8 | Contact Enrichment | `phone, email, address, decision_maker_name/role/reachability/note, missing_data[]` | |
| 9 | Pain Detection | `pain_summary, detected_weakness` | `pain_category`-Enum → in Text gefaltet (kein eigenes Feld nötig) |
| 10 | Offer Matching | `recommended_offer, product_areas[], recommended_module_keys[]` | module_keys referenzieren `offer_modules.key` |
| 11 | Lead Scoring | `lead_score_num(0–100), overall_score(A/B/C/No-Fit), priority, soul_fit_score, soul_fit_reason, confidence` | overall_score abgeleitet: ≥80=A, 60–79=B, 40–59=C, <40=No-Fit |
| 12 | Quality Control | **`status`-Gate** + ggf. `dismissed_reason` | approval_level → status (siehe §4) |
| 13 | Lead Pool Writer | **der eine `radar_targets`-INSERT** (Service-Role) | `status='scored'`, `scan_id`, `scan_source='n8n'`, `scanned_at=now()`, `dedup_key` |
| 14 | Sales Handoff | `opener_pitch, setter_context, closer_context` **+ später `promote_radar_target()`** | Vorberechnung beim Scan; finale Übergabe = RPC beim Promoten |
| 15 | Update Watcher | **braucht `company_snapshots`** | **Post-MVP**, eigener n8n-Cron (siehe §6) |

**Folgerung:** Agenten 6–11 + 14 füllen Spalten, die **alle schon da sind**. Agent 12 ist ein Status-Gate. Agent 13 ist der Insert. Agenten 1–5 sind Planung/Filter ohne DB-Write.

---

## 3. Der smarte Teil: 15 Agenten → wenige Calls (Cost-Collapse)

**Naiv** = 15 LLM-Calls × 20 Kandidaten ≈ **300 Calls/Scan**. In n8n als Node-Graph mit Loops/Sub-Workflows ein Albtraum und teuer.

**Schlau:** Die 15 Agenten sind die **Prompt-/Klarheits-Ebene**, NICHT die Call-Ebene. Zur Laufzeit gruppieren:

### Phase A — scan-level (läuft 1× pro Scan)
| Schritt | Realer Call | Agenten drin |
|---|---|---|
| A1 Plan + Queries | **1 LLM-Call** | Orchestrator + Search Strategy zusammen |
| A2 Suche | **Search-API** (kein LLM) | — |
| A3 Kandidaten säubern | **1 LLM-Call** | Web Research + Company Extraction |
| A4 Dedup | **DB-Query** (kein LLM) | Deduplication (gegen `v_radar_lead_state` + Targets) |

→ Phase A ≈ **2 LLM-Calls + 1 Such-API + 1 DB-Query**, ergibt **N deduplizierte Kandidaten**.

### Phase B — pro Kandidat (läuft N×, nur für überlebende Kandidaten)
| Schritt | Realer Call | Agenten drin |
|---|---|---|
| B1 Evidenz holen | **Fetch** (Website-HTML, Impressum, Insta/FB) — kein LLM | — |
| B2 **Analyst** | **1 LLM-Call** | Website Audit + Online Presence + Contact Enrichment (extrahiert die **Fakten**spalten) |
| B3 **Strategist** | **1 LLM-Call** | Pain Detection + Offer Matching + Lead Scoring + Sales-Handoff-Pitches + QC-Urteil (die **Bewertungs**spalten + Gate) |

→ Phase B ≈ **2 LLM-Calls + 1 Fetch pro Kandidat**.

**Bilanz:** 20 Kandidaten ≈ 2 (A) + 20×2 (B) = **~42 LLM-Calls statt 300**. Gleiche Output-Spalten, ~7× günstiger, deutlich weniger Fehlerquellen.

> **Warum die Trennung Analyst ↔ Strategist sinnvoll bleibt** (statt 1 Call): Analyst arbeitet **nur auf gefetchter Evidenz** (Anti-Halluzination, „erfinde keine visuellen Fakten"), Strategist **bewertet** auf dieser sauberen Faktenbasis. Genau die Anti-Erfindungs-Grenze, die die Spec fordert — als Call-Grenze umgesetzt.

> **Kosten-Variante (Default, siehe §11):** B2 Analyst wird **fast komplett zu Code** (Regex/HTTP-Checks auf Terra, gratis) — dann bleibt **1 LLM-Call pro Kandidat** (B3 Strategist). Damit sinkt ein Scan auf **~2 (A) + ~20 (B) ≈ 22 Calls** auf dem **billigsten Modell mit Prompt-Caching** → Cent-Bereich pro Scan.

> **Eskalation, falls n8n-Node-Graph zu sperrig wird:** identischer Webhook-Vertrag, aber Phase B läuft in einem **kleinen Node-Worker auf Terra** (Express-Endpoint, vom selben Webhook gefüttert). Schreibvertrag in `radar_targets` bleibt 1:1. Erst wechseln, wenn n8n-Loops/Sub-Workflows nerven — nicht vorab.

---

## 4. Quality Control → Status-Gate (Agent 12)

QC-`approval_level` mappt auf das vorhandene `radar_status`-Enum + `overall_score`:

| QC-Urteil | `radar_targets.status` | Sichtbar im Review? | Anmerkung |
|---|---|---|---|
| `sales_ready` | `scored` + `overall_score`=A/B | ja, oben | Promote-Kandidat |
| `review` | `scored` + `overall_score`=C | ja | „Review Needed" |
| `reject` | `dismissed` + `dismissed_reason` | nein (gefiltert) | gar nicht erst einfügen ODER als dismissed protokollieren |

**Reihenfolge der Radar-UI** (bereits per Blip-Größe/Sortierung): A (High Priority) → B (Sales Ready) → C (Review) → No-Fit → dismissed. Deckt sich mit der Spec-Sortierung „High Priority / Sales Ready / Review / Later / Rejected / Archived".

**Sales-Readiness-Regel** (Spec) ist erfüllt, wenn: Kontakt vorhanden (`phone|email`), klarer Pain (`pain_summary` + `detected_weakness`), Angebot (`recommended_offer`), Opener-Angle (`opener_pitch`), keine Dublette (Dedup bestanden), `confidence` hoch genug, Quelle (`sources[]` nicht leer). Der Strategist-Call (B3) prüft genau diese Liste, bevor er `sales_ready` vergibt.

---

## 5. Sales Handoff = bereits gebaut (Agent 14)

Die Spec trennt „Sales Handoff Agent". Real ist das **zweigeteilt und schon vorhanden**:

1. **Scan-Zeit (n8n, automatisch):** Strategist (B3) füllt `opener_pitch / setter_context / closer_context` direkt in `radar_targets`.
2. **Promote-Zeit (Mensch + RPC):** Admin sichtet im `/radar`-Review, klickt Promote → `promote_radar_target(uuid)` erzeugt atomar+dedup-sicher den `leads`-Eintrag und **kopiert die Pitch-Felder** nach `leads.opener_pitch/setter_context/closer_context/radar_analysis`. Ab da übernimmt das Sales-Cockpit ([[hk-sales-cockpit]]).

→ **Kein neuer Handoff-Agent nötig.** „Radar Review" der Spec = der menschliche Promote-Schritt. `next_action: call|enrich_more|review` der Spec = Admin-Entscheidung Promote/Dismiss/Liegenlassen.

---

## 6. Update Watcher (Agent 15) — bewusst Post-MVP

Braucht als Einziges echte **Historie** → die fehlende `company_snapshots`. Plan, wenn MVP läuft:
- **Migration 013** `radar_target_snapshots` (target_id FK, snapshot jsonb, captured_at) — Zustände über Zeit.
- **Eigener n8n-Cron** (z. B. wöchentlich) der `status='promoted'`/aktive Targets neu fetcht, gegen letzten Snapshot diff't und bei relevanter Änderung (Website offline, neuer Pain, Score-Sprung) eine Notiz/Flag setzt.
- Erst bauen, wenn der Scan-Pfad steht. Nicht im MVP.

---

## 7. Was wirklich neu gebaut werden muss (minimal)

| Element | Pflicht? | Wo |
|---|---|---|
| **n8n-Workflow** (Phase A+B, §3) mit den 15 Prompts als Nodes | **JA** (Kern) | Terra |
| **LLM-API-Key** (OpenAI/Anthropic) + Search-API-Key (SerpAPI/Brave) | **JA** (Blocker) | n8n-Credentials |
| `radar_scans.search_plan jsonb` (Orchestrator-Plan speichern) | optional, Debug | Migration 013 |
| `agent_runs` / `radar_agent_runs` (Observability: agent, model, tokens, latency, status) | optional, empfohlen | Migration 013 |
| `company_snapshots` / `radar_target_snapshots` | Post-MVP (Agent 15) | Migration 014 |
| `GET /api/radar/scans/:id` (Scan-Status-Polling in UI) | empfohlen | App-Route |
| Scan-Historie-/Fortschritts-Liste in `/radar` | empfohlen | UI |
| `v_radar_lead_state`-Badges am Blip („schon Lead / Opt-out / Termin") | nice-to-have | UI |

**Approve/Reject/Push-to-Sales** der Spec-API existieren funktional schon (RPC + REST in der UI) — keine separaten Routen nötig.

---

## 8. Prompt-Quelle

Die **wörtlichen System-Prompts + JSON-Schemas** aller Agenten stehen im Doc „HK Agent Prompts" und verdichtet im Memory `project_hk_radar_agents.md`. Beim n8n-Bau:
- A1-Node bekommt **Orchestrator+Search-Strategy**-Prompt (kombiniert), Output = Plan+Queries-JSON.
- A3-Node bekommt **Web-Research+Extraction**-Prompt, Output = bereinigte `candidates[]`.
- B2-Analyst-Node bekommt **Website-Audit + Online-Presence + Contact**-Prompts (kombiniert), Output = Faktenspalten.
- B3-Strategist-Node bekommt **Pain + Offer + Scoring + Handoff + QC**-Prompts (kombiniert), Output = Bewertungsspalten + Gate.
- Jeder Node: **Structured Output / JSON-Schema-Validierung + Retry** (Spec-Anforderung), Grundregel „erfinde keine Fakten, fehlend = null/unknown" als gemeinsamer System-Header.

---

## 9. MVP-Baureihenfolge

1. **API-Key besorgen** (OpenAI ODER Anthropic, pay-per-use) + Search-API-Key. → entblockt alles.
2. **n8n Phase A** bauen & isoliert testen (Plan→Queries→Suche→saubere Kandidaten als JSON-Ausgabe, noch kein DB-Write).
3. **n8n Phase B** bauen & an 2–3 Kandidaten testen (Fetch→Analyst→Strategist→QC), Output gegen `radar_targets`-Spalten prüfen.
4. **Writer-Node** scharf schalten: Service-Role-INSERT mit `ON CONFLICT (dedup_key) DO NOTHING`, dann `radar_scans` auf `done` + Counts.
5. `N8N_RADAR_WEBHOOK_URL` (+ Secret) ins Cockpit-`.env` → echter Scan aus `/radar`.
6. End-to-End: Scan starten → Targets erscheinen → Promote → Lead im Cockpit.
7. **Dann erst:** Scan-Historie-UI, agent_runs-Logging, Update Watcher.

---

## 10. Kosten so niedrig wie möglich (Leitlinie)

Terra ist selfhosted → **Rechnen/Fetchen/Geocoden = gratis**. Es kostet nur **LLM** und **Such-API**. Beide drücken wir, nach Hebel sortiert:

### Discovery: kostenlose Geodaten statt bezahlter Suche (größter Hebel)
- **OpenStreetMap Overpass API = gratis**, perfekt für *lokale* Unternehmen: liefert pro Region+Kategorie Name, Adresse, oft Website/Telefon/Öffnungszeiten. Das ersetzt für die reine Entdeckung die teure Such-API fast vollständig. (Overpass-Query nach `amenity`/`shop`/`craft` im Umkreis.)
- **Bezahlte Suche nur für Lücken** (z. B. fehlende Website finden). Dann **Brave Search API** (2.000 Anfragen/Monat **gratis**) oder **Google CSE** (100/Tag gratis) statt SerpAPI (~$50/mo). Bei dem Volumen reicht der Free-Tier dauerhaft.
- **Search-Strategy-Agent eng halten:** 3–5 Queries pro Scan, nicht 20.

### So wenig LLM wie möglich
- **Mechanische „Agenten" → Code, nicht LLM** (laufen gratis auf Terra): Company Extraction (Ketten/Behörden/Schulen per Namens-/Domain-Regeln raus), Deduplication (DB), Contact Enrichment (Regex für Telefon/E-Mail/Impressum), Website-Audit-**Booleans** (HTTP-Status = reachable, `https` = SSL, Regex „Impressum"/`<meta viewport>`/Copyright-Jahr = veraltet-Heuristik). **Der LLM sieht das nie.**
- **Regelbasiertes Reject-Gate VOR jedem LLM-Call:** kein Kontakt / außerhalb Region / offensichtliche Kette → gar nicht erst an den Strategist. Spart die teuersten Calls an den schlechtesten Leads.
- **Ergebnis:** der einzige Pflicht-LLM-Call pro Kandidat ist **B3 Strategist** (Pain/Offer/Score/Pitch/QC). Optional ein winziger LLM-Read nur für „wirkt veraltet", wenn die Heuristik unsicher ist.

### Den verbleibenden LLM-Call billig machen
- **Billigstes Modell:** Claude **Haiku 4.5** *oder* GPT-4o-mini / 4.1-nano. Größeres Modell nur, wenn die Qualität es nachweislich braucht — und dann nur für den Strategist, nie für Extraktion.
- **Prompt-Caching** (Anthropic: −90 % auf gecachte Tokens; OpenAI: automatisch): Grundregel + JSON-Schema + Offer-Modul-Liste sind über **alle** Kandidaten identisch → als gecachten System-Prefix einmal zahlen, 20× fast gratis nutzen. Bei Fan-out über viele Kandidaten der zweitgrößte Hebel.
- **Input aggressiv trimmen** (Input-Tokens dominieren die Kosten): HTML → reiner Lesetext (Skripte/Styles/Nav strippen), auf ~2–4k Tokens kappen. Nie rohes HTML an den LLM.
- **Batch-API (−50 %)** optional: ein Scan ist nicht echtzeitkritisch → als Batch-Job (async, bis 24 h) laufen lassen halbiert die LLM-Kosten nochmals. Nur einbauen, wenn die Latenz egal ist.
- **Fan-out kappen:** `desired_count` begrenzt die Kandidatenzahl; teurer Pfad nur für Kandidaten, die das Code-Gate überleben.

### Wiederverwendung
- **Fetches cachen** (Terra-lokal, gratis): erneute Scans & der spätere Update Watcher fetchen nicht doppelt.
- **Geocoding:** bereits gratis via Nominatim (`/api/radar/geocode`); idealerweise liefert Overpass die Koordinaten gleich mit → gar kein Geocode-Schritt nötig.

### Grobe Hausnummer
Discovery via Overpass (gratis) + 1 billiger, gecachter Strategist-Call pro Kandidat: ein 20-Lead-Scan landet im **niedrigen Cent-Bereich** an LLM-Kosten, Such-API im Free-Tier = **0 €**. Hosting = der ohnehin laufende Terra-Server.

---

## 11. Env-Checkliste

**Cockpit (`.env.local` / Vercel):**
- `N8N_RADAR_WEBHOOK_URL` — n8n-Webhook auf Terra
- `N8N_RADAR_WEBHOOK_SECRET` — geteiltes Secret (Header `x-radar-secret`)

**n8n auf Terra (Credentials):**
- `OPENAI_API_KEY` **oder** `ANTHROPIC_API_KEY` — Researcher-LLM (⚠️ Abo ≠ API!)
- `SERPAPI_KEY` / `BRAVE_API_KEY` / Google-CSE — Web-Suche
- Supabase **Service-Role-Key** + URL — schreibt `radar_targets`/`radar_scans` (bypass RLS)

---

*Stand: Juni 2026. Basis: reale Migrationen 008–012 + RADAR_N8N_SETUP.md. Spec-Quelle: 3 User-Docs „HK Agenten …". Begleitend: Memory `project_hk_radar_agents.md`, `project_hk_sales_cockpit.md`, `project_hk_terra_server.md`.*
