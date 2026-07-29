-- ============================================================
-- 015 — growth_system überall erlauben (optional, idempotent)
-- ------------------------------------------------------------
-- HINWEIS: Die Bestätigungsmails für das Wachstumssystem (Setter +
-- Closer) sind fest im Code hinterlegt (lib/email/templates.ts,
-- builtinTemplate → SETTER_BODY/CLOSER_* mit growth_system). Es wird
-- KEINE DB-Zeile benötigt — die reale email_templates-Tabelle wird für
-- den Versand ohnehin über den Code-Fallback bedient.
--
-- Diese Migration erweitert nur alle product_area-CHECK-Constraints um
-- 'growth_system' (inkl. der Audit-Tabelle appointment_email_events),
-- damit growth_system-Buchungen eine saubere Protokoll-Zeile schreiben.
-- Rein optional: Ohne diese Migration funktionieren Skripte, Mails und
-- Buchungen trotzdem (die Audit-Insert ist im Code try/catch-gesichert).
-- Defensiv: läuft auch, wenn einzelne Tabellen/Spalten/Constraints fehlen.
-- ============================================================

do $$
declare
  t text;
  c record;
  tables text[] := array[
    'email_templates', 'email_jobs', 'meeting_links', 'appointment_email_events'
  ];
begin
  foreach t in array tables loop
    -- Tabelle vorhanden?
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      continue;
    end if;

    -- Alle CHECK-Constraints der Tabelle entfernen, die product_area einschränken
    for c in
      select con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
      where nsp.nspname = 'public'
        and rel.relname = t
        and con.contype = 'c'
        and pg_get_constraintdef(con.oid) ilike '%product_area%'
    loop
      execute format('alter table public.%I drop constraint %I', t, c.conname);
    end loop;

    -- Neu anlegen, nur wenn Spalte product_area existiert
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'product_area'
    ) then
      execute format(
        'alter table public.%I add constraint %I check (product_area is null or product_area in
           (''ai_integration'', ''social_media_brand_building'', ''website_funnel'', ''growth_system'', ''custom''))',
        t, t || '_product_area_check'
      );
    end if;
  end loop;
end $$;
