-- ============================================================
-- 014 — Wachstumssystem als eigener product_area + scripts.mechanism
-- ------------------------------------------------------------
-- 1) Erweitert alle product_area-CHECK-Constraints (013) um
--    'growth_system' (DROP + ADD, bestehende Werte bleiben gültig).
-- 2) Ergänzt die Spalte scripts.mechanism (Korthauer-Beat
--    „Mechanismus erklären, ohne zu viel zu erklären").
-- Defensiv: läuft auch, wenn einzelne Tabellen/Constraints fehlen.
-- ============================================================

-- 1) product_area-CHECKs um growth_system erweitern
do $$
declare
  t record;
  c record;
begin
  for t in
    select table_name from information_schema.tables
    where table_schema = 'public'
      and table_name in ('email_templates', 'email_jobs', 'meeting_links')
  loop
    -- alle CHECK-Constraints der Tabelle finden, die product_area einschränken
    for c in
      select con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
      where nsp.nspname = 'public'
        and rel.relname = t.table_name
        and con.contype = 'c'
        and pg_get_constraintdef(con.oid) ilike '%product_area%'
    loop
      execute format('alter table public.%I drop constraint %I', t.table_name, c.conname);
    end loop;

    -- nur neu anlegen, wenn die Spalte existiert
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t.table_name and column_name = 'product_area'
    ) then
      execute format(
        'alter table public.%I add constraint %I check (product_area is null or product_area in
           (''ai_integration'', ''social_media_brand_building'', ''website_funnel'', ''growth_system'', ''custom''))',
        t.table_name, t.table_name || '_product_area_check'
      );
    end if;
  end loop;
end $$;

-- 2) scripts.mechanism (Korthauer: Mechanismus / Methode kurz erklären)
alter table public.scripts add column if not exists mechanism text;

comment on column public.scripts.mechanism is
  'Korthauer-Beat: Mechanismus erklaeren ohne zu viel zu erklaeren (nach der Methodenfrage).';
