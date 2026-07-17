-- ============================================================
-- 015 — Mailvorlagen für growth_system (Setter + Closer)
-- ------------------------------------------------------------
-- Bestätigungsmails für den 4. Pfeiler „Ganzheitliches
-- Wachstumssystem" im Stil von 013. Texte = HK Mailsystem
-- (HK-SALES-EXPERT-CALL-BOOKED-SYSTEM-V1 / HK-SALES-CLOSER-BOOKED-SYSTEM-V1).
-- Idempotent über WHERE NOT EXISTS (key + product_area).
-- ============================================================

insert into public.email_templates (key, product_area, subject, body_text, is_active)
select
  'setter_booking_confirmation',
  'growth_system',
  'Ihr kostenfreier Experten-Call zum Wachstumssystem',
  $tpl$Hallo {{contact_first_name}},

vielen Dank für das Gespräch mit {{assigned_opener_name}}.

Ihr kostenfreier strategischer Experten-Call mit {{assigned_setter_name}} ist verbindlich eingetragen:

{{appointment_date}} um {{appointment_time}} Uhr
Dauer: ca. {{appointment_duration}}
Zugang: {{appointment_link}}

Im Call betrachten wir nicht nur eine einzelne Maßnahme. Wir analysieren, wie Positionierung, Social Media, Website, Anfragewege, Vertrieb, Follow-up und Automatisierung in Ihrem Unternehmen aktuell zusammenspielen.

Sie erhalten konkretes Expertenfeedback dazu, an welchen Übergängen Potenzial verloren geht, welcher Engpass derzeit den größten Einfluss auf Wachstum besitzt und welche Reihenfolge der nächsten Schritte fachlich sinnvoll ist.

Der Fokus liegt nicht darauf, möglichst viele Einzelleistungen zu empfehlen. Entscheidend ist, ein System zu entwickeln, in dem Aufmerksamkeit, Vertrauen, Anfrage, Entscheidung und operative Bearbeitung sauber ineinandergreifen.

Hilfreich sind Ihre wichtigsten Angebote, Zielkunden, Website, Social-Media-Kanäle und eine grobe Übersicht Ihres aktuellen Vertriebsprozesses.

Erst nach unserer Einordnung prüfen wir gemeinsam, ob und in welcher Form eine Zusammenarbeit sinnvoll ist.

Beste Grüße

{{assigned_setter_name}}
HK Growth Operator$tpl$,
  true
where not exists (
  select 1 from public.email_templates
  where key = 'setter_booking_confirmation' and product_area = 'growth_system'
);

insert into public.email_templates (key, product_area, subject, body_text, is_active)
select
  'closer_booking_confirmation',
  'growth_system',
  'Ihr Strategiegespräch zum Wachstumssystem',
  $tpl$Hallo {{contact_first_name}},

vielen Dank für den Experten-Call mit {{assigned_setter_name}}.

Auf Grundlage Ihrer Ausgangssituation und der besprochenen Ziele sehen wir einen sinnvollen Ansatz, den wir im nächsten Termin konkret ausarbeiten.

Ihr Strategiegespräch mit {{assigned_closer_name}} findet statt am:

{{appointment_date}} um {{appointment_time}} Uhr
Dauer: ca. {{appointment_duration}}
Zugang: {{appointment_link}}

Im nächsten Termin konkretisieren wir die sinnvolle Reihenfolge aus Positionierung, Social Media, Website, Sales, CRM und Automatisierung.

Im Gespräch betrachten wir außerdem den sinnvollen Leistungsumfang, Verantwortlichkeiten, Voraussetzungen, wirtschaftliche Rahmenbedingungen und die Entscheidung über das weitere Vorgehen.

Damit alle fachlichen und wirtschaftlichen Fragen direkt geklärt werden können, sollten alle Personen teilnehmen, die an der Entscheidung oder späteren Umsetzung beteiligt sind.

Beste Grüße

{{assigned_closer_name}}
HK Growth Operator$tpl$,
  true
where not exists (
  select 1 from public.email_templates
  where key = 'closer_booking_confirmation' and product_area = 'growth_system'
);
