# Radar → Sales-App: Ingest-Schnittstelle (Entwurf)

> Das **Sales-App-Gegenstück** zur Fusion mit Luis' Radar. Luis' Radar liefert
> sales-ready Leads hierher; die Sales-App dedupt, prüft Opt-out/Bestand und legt
> sie in die Staging-Schicht (`radar_targets`) zur menschlichen Übernahme (Promote).
>
> **Status: ENTWURF.** Endgültiges Schema/Interface wird nach Luis' Antwort
> festgeklopft. Code ist additiv und inaktiv, solange kein Secret gesetzt ist.

---

## Endpunkte (Sales-App, Next.js)

| Methode | Pfad | Zweck |
|---|---|---|
| `POST` | `/api/leads/ingest` | sales-ready Leads liefern (einzeln/Batch) |
| `GET`  | `/api/leads/state?keys=a.de,%2B49…` | Read-Back: CRM-Status je dedup_key |
| `POST` | `/api/leads/state` `{ "keys": [...] }` | Read-Back für große Listen |

**Auth (beide):** Header `x-radar-secret: <SECRET>` (oder `Authorization: Bearer <SECRET>`).
Secret = Env `RADAR_INGEST_SECRET` (Fallback `N8N_RADAR_WEBHOOK_SECRET`). Ohne Secret → `503` (Endpunkt aus).

---

## dedup_key — die EINE Normalisierungsregel (beide Seiten identisch!)

1. **Wenn Website vorhanden** → `dedup_key` = nackte Domain: Host, lowercase, ohne
   Schema/Pfad, ohne führendes `www.`  (`https://www.Foo-Bar.de/x` → `foo-bar.de`).
2. **Sonst wenn Telefon** → E.164: nur Ziffern/`+`; `00`→`+`; führende `0` → `+49`
   (DE-Default, HK ist lokal); gültig bei 8–15 Ziffern  (`0 2261/123-45` → `+49226112345`).
3. **Sonst** → kein Key → Lead wird abgelehnt (`no_dedup_key`).

Domain hat Vorrang vor Telefon. **Die Sales-App rechnet den Key beim Ingest
autoritativ selbst aus** (aus `website`/`phone`); ein mitgelieferter `dedup_key`
wird nur genutzt, wenn weder Website noch Telefon da ist. Das Radar sollte für den
**Read-Back** exakt dieselbe Regel anwenden, damit die Keys matchen.

---

## POST /api/leads/ingest

**Body:** ein Objekt, ein Array, oder `{ "leads": [ ... ] }` (max. 200/Batch).
Felder pro Lead:

```json
{
  "dedup_key": "optional — wird serverseitig aus website/phone neu berechnet",
  "company_name": "PFLICHT",
  "industry": "…", "city": "…",
  "website": "…", "social_url": "…", "google_maps_url": "…",
  "phone": "…", "email": "…", "address": "…",
  "decision_maker": { "name": "…", "role": "…", "reachability": "direkt|zentrale|unbekannt" },
  "scores": {
    "website": 1-10, "social": 1-10, "ai": 1-10, "soul_fit": 1-10,
    "lead_score": 0-100, "overall": "A|B|C|No-Fit",
    "priority": "low|medium|high", "confidence": 0.0-1.0
  },
  "product_areas": ["Website","Social Media","KI-Integration"],
  "recommended_offer": "…",
  "recommended_module_keys": ["website_onepager", "…"],
  "pain_summary": "…", "detected_weakness": "…",
  "opener_pitch": "…", "setter_context": "…", "closer_context": "…",
  "sources": ["url", "…"],
  "sales_readiness": "sales_ready",
  "scanned_at": "ISO-Zeit"
}
```
Robust: Scores werden geclamped (1–10 / 0–100 / 0–1), Enums die nicht passen → `null`
bzw. `unbekannt`, unbekannte `product_areas` werden gefiltert. Pflicht: `company_name`
+ ein berechenbarer `dedup_key`.

**Verarbeitung je Lead:**
1. Read-Back (`v_radar_lead_state`): `do_not_contact` → skip `opt_out`; existiert schon als Lead → skip `already_in_sales`.
2. Bestehendes Target (`radar_targets`): `promoted`/`dismissed`/`duplicate` → skip; sonst Update (`updated`); neu → Insert `status='scored'` (`created`).
3. Geschrieben wird NUR `radar_targets`. Echte `leads` entstehen erst beim menschlichen **Promote**.

**Antwort:**
```json
{
  "ok": true,
  "received": 12,
  "summary": { "created": 8, "updated": 1, "skipped": 2, "rejected": 1 },
  "results": [
    { "dedup_key": "foo.de", "company_name": "Foo", "status": "created", "target_id": "uuid" },
    { "dedup_key": "bar.de", "company_name": "Bar", "status": "skipped", "reason": "opt_out", "lead_status": "Nicht mehr kontaktieren" },
    { "dedup_key": null, "company_name": "Baz", "status": "rejected", "reason": "no_dedup_key (website oder phone nötig)" }
  ]
}
```
`status` ∈ `created | updated | skipped | rejected`. Idempotent: zweimal dieselbe Firma → kein zweiter Eintrag.

---

## Read-Back: /api/leads/state

**GET** `…/api/leads/state?keys=foo.de,bar.de` oder `?dedup_key=foo.de`
**POST** `…/api/leads/state` mit `{ "keys": ["foo.de", "+49226112345"] }`

**Antwort:**
```json
{
  "ok": true,
  "states": [
    { "dedup_key": "foo.de", "known": true, "lead_id": "uuid", "status": "Zu kontaktieren",
      "do_not_contact": false, "is_customer": false, "is_active_deal": false,
      "last_contact_at": null, "appointment_at": null }
  ],
  "unknown": ["bar.de"]
}
```
`unknown` = Firmen, die die Sales-App noch nicht kennt → das Radar darf sie liefern.
Vor dem Liefern abfragen → `do_not_contact` oder bereits Lead ⇒ **nicht liefern**.

---

## Env (Sales-App)

```bash
RADAR_INGEST_SECRET=<geteiltes Secret mit dem Radar>   # Pflicht, sonst Endpunkte aus
# Fallback, falls nicht gesetzt: N8N_RADAR_WEBHOOK_SECRET
# vorhanden: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (für den Write)
```

---

## Was nach Luis' Antwort final entschieden wird

- **HTTP-Ingest (dieser Entwurf) vs. direkter Supabase-Write** durch das Radar.
- Exakte **Feldnamen/-tiefe** (Abgleich mit dem, was das Radar wirklich ausgibt).
- Endgültige **dedup_key-Normalisierung** (muss bitweise identisch sein).
- Ob `recommended_module_keys` auf `offer_modules.key` der Sales-App gemappt wird.

*Implementierung: `app/api/leads/ingest/route.ts`, `app/api/leads/state/route.ts`,
`lib/radar/dedup.ts`, `lib/radar/ingestContract.ts`. Reuse: `radar_targets`,
`v_radar_lead_state`, `promote_radar_target()` (Migrationen 008–011).*
