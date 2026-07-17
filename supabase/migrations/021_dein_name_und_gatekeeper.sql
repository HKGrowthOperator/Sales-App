-- ============================================================
-- 021 — [dein Name] statt [ICH] + Gatekeeper „Deliberationsgespräch"
-- ------------------------------------------------------------
-- 1) HK-Standard: Der Sprecher-Platzhalter heißt [dein Name]
--    (wie in der von HK perfektionierten Vorlage). Die App ersetzt
--    ihn weiterhin live durch den eingeloggten Nutzer.
-- 2) Gatekeeper-Frame: Begriffe, die die Zentrale noch nie gehört
--    hat, aber wichtig klingen („Deliberationsgespräch") — nur der
--    Entscheider kann das Thema besprechen.
-- Kein weiterer Text wird verändert (reine replace-Operationen).
-- ============================================================

-- 1) [ICH] → [dein Name] in allen HK-Skripten
update public.scripts set
  full_script     = replace(full_script,     '[ICH]', '[dein Name]'),
  opening_line    = replace(opening_line,    '[ICH]', '[dein Name]'),
  relevance_line  = replace(relevance_line,  '[ICH]', '[dein Name]'),
  mechanism       = replace(mechanism,       '[ICH]', '[dein Name]'),
  transition_line = replace(transition_line, '[ICH]', '[dein Name]')
where title like 'HK ▸%';

-- … und in der Einwand-/Gatekeeper-Library
update public.objection_library set
  response = replace(response, '[ICH]', '[dein Name]');

-- 2) Gatekeeper: wichtig klingend, nie gehört — Deliberationsgespräch
update public.objection_library set
  response = 'Moin, [dein Name] hier. Verbinden Sie mich einmal bitte direkt mit Herrn/Frau [Name] — es geht um ein Deliberationsgespräch. Dankeschön.'
where key = 'gk_direkt';

update public.objection_library set
  response = 'Es geht um ein Deliberationsgespräch zur digitalen Prozessstruktur des Unternehmens — die Details kann ich nur mit Herrn/Frau [Name] persönlich besprechen. Stellen Sie mich bitte einmal kurz durch, ich bleibe so lange in der Leitung. Dankeschön.'
where key = 'gk_worum';

update public.objection_library set
  response = 'Ich verstehe. Nur betrifft das Deliberationsgespräch die interne Prozessstruktur — das darf ich tatsächlich nur mit Herrn/Frau [Name] selbst besprechen. Wenn er/sie gerade wirklich nicht zu sprechen ist, gar kein Problem — dann melde ich mich später. Wenn er/sie im Haus ist, stellen Sie mich bitte einmal kurz durch. Dankeschön.'
where key = 'gk_blockt';

update public.objection_library set
  response = 'Kann ich machen — nur lässt sich ein Deliberationsgespräch schwer in einer allgemeinen Mail zusammenfassen, weil es um konkrete Punkte bei Ihrem Unternehmen geht. Richten Sie Herrn/Frau [Name] bitte aus, dass [dein Name] angerufen hat — Stichwort Deliberationsgespräch. Meine Nummer: [Nummer].'
where key = 'gk_mail';
