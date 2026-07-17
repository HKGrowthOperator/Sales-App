-- ============================================================
-- 016 — HK-Pfeiler-Skripte (Korthauer-Struktur) als Master
-- ------------------------------------------------------------
-- 1) Alte Opener-Master archivieren (Backup, kein Löschen).
--    Setter-/Closer-Master nur dort archivieren, wo ein neues
--    Pfeiler-Skript denselben Winkel belegt.
-- 2) 4 Pfeiler × 3 Phasen als neue Master (status approved):
--    Website / Social & Branding / KI-Automation / Wachstumssystem
--    × Opener / Setter / Closer.
--    full_script enthält Farbcode-Markup:
--    [G]…[/G]=Schlüsselsatz (gelb) · [J]…[/J]=Ja-Trigger (grün)
--    [R]…[/R]=Regie, nicht vorlesen (blau) · [U]…[/U]=betonen.
-- 3) Gatekeeper-/Einwand-/Follow-up-Bausteine in objection_library.
-- Idempotent über Titel-Guards (WHERE NOT EXISTS).
-- ============================================================

-- ── 1) Alte Master archivieren ───────────────────────────────
update public.scripts set status = 'archived'
where script_type = 'master' and status = 'approved' and role = 'Opener'
  and title not like 'HK ▸%';

update public.scripts set status = 'archived'
where script_type = 'master' and status = 'approved' and role in ('Setter','Closer')
  and entry_angle in ('Website','Social Media','Automationen & CRM','Komplettangebot')
  and title not like 'HK ▸%';

-- ── 2) Pfeiler-Skripte einfügen ──────────────────────────────
-- Hinweis Platzhalter: [Name]=Kunde, [ICH]=Anrufer (App ersetzt live),
-- [E-Mail], [Tag]/[Uhrzeit], [Preis] bleiben sichtbar orange.

-- ============ 🌐 WEBSITE ============
insert into public.scripts
  (role, entry_angle, situation, title, script_type, status, is_active, version,
   call_goal, tone_guidance, positioning, method_name,
   opening_line, relevance_line, core_question, mechanism, transition_line,
   qualifying_questions_json, required_notes_json, full_script)
select 'Opener','Website','website','HK ▸ Website — Opener','master','approved',true,1,
  'Aufmachen + Interesse gewinnen. KEIN Termin-Talk, KEIN Preis. Bei Interesse an Setter übergeben.',
  'Selbstbewusst, führend, nicht bittend. Nach der Methodenfrage und dem Negative Close: still sein.',
  'Nicht „Wir bauen Websites." Sondern: Wir bauen digitale Vertrauensseiten, die Interessenten verstehen lassen, warum sie genau bei Ihnen anfragen sollten — inkl. lokaler Auffindbarkeit.',
  'Conversion-Website-Analyse',
  'Moin/Servus/Hallo Herr/Frau [Name], [ICH] hier von HK Growth. Wir haben vor einiger Zeit schon einmal wegen Ihrer digitalen Außenwirkung gesprochen — damals war einfach ein bisschen viel los. Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, Sie als Kunden zu gewinnen. (lachen) — also natürlich nicht genau heute. Aber ich hab mir Ihren Auftritt nochmal ganz genau angeschaut.',
  'Mir sind zwei, drei Parallelen zu einem unserer Kunden aufgefallen, der mit uns in wenigen Wochen deutlich mehr Anfragen über die Seite bekommen hat. Viele verlieren online keine Anfragen, weil sie schlecht sind — sondern weil in den ersten Sekunden nicht klar wird, warum man genau bei Ihnen anfragen soll.',
  'Haben Sie schon einmal etwas von einer Conversion-Website-Analyse gehört?',
  'Dabei schauen wir nicht, ob die Seite schön aussieht — sondern ob sie Vertrauen aufbaut, Ihr Angebot klar macht, Besucher sauber zur Anfrage führt und ob Sie regional überhaupt gefunden werden.',
  'Wäre es die absolut schlechteste Idee, wenn ich Ihnen einmal kostenlos zeige, welche Punkte auf Ihrer Seite gerade Anfragen kosten — und wo Sie regional gefunden werden könnten?',
  '[]'::jsonb,
  '["Interesse ja/nein + Reaktion auf Methodenfrage","Konkreter Aufhänger (was ist an der Website aufgefallen)"]'::jsonb,
  $s$[G]Wir haben vor einiger Zeit schon einmal wegen Ihrer digitalen Außenwirkung gesprochen — damals war einfach ein bisschen viel los.[/G]

Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, [U]Sie als Kunden zu gewinnen[/U]. [R](lachen)[/R] — also natürlich nicht genau heute. Aber ich hab mir Ihren Auftritt nochmal [U]ganz genau[/U] angeschaut.

[G]Und mir sind zwei, drei Parallelen zu einem unserer Kunden aufgefallen, der mit uns in wenigen Wochen deutlich mehr Anfragen über die Seite bekommen hat.[/G] [R](kurze Pause)[/R]

Viele verlieren online keine Anfragen, weil sie schlecht sind — sondern weil in den ersten Sekunden nicht klar wird, [U]warum man genau bei Ihnen anfragen soll[/U].

[J]Haben Sie schon einmal etwas von einer Conversion-Website-Analyse gehört?[/J] [R](still sein, antworten lassen)[/R]

WENN „WAS IST DAS?": Dabei schauen wir nicht, ob die Seite schön aussieht — sondern ob sie Vertrauen aufbaut, Ihr Angebot klar macht, Besucher sauber zur Anfrage führt und ob Sie regional überhaupt gefunden werden.

[J]Wäre es die absolut schlechteste Idee, wenn ich Ihnen einmal [U]kostenlos[/U] zeige, welche Punkte auf Ihrer Seite gerade Anfragen kosten — und wo Sie regional gefunden werden könnten?[/J]$s$
where not exists (select 1 from public.scripts where title = 'HK ▸ Website — Opener');

insert into public.scripts
  (role, entry_angle, situation, title, script_type, status, is_active, version,
   call_goal, tone_guidance, positioning, method_name,
   opening_line, relevance_line, core_question, mechanism, transition_line,
   qualifying_questions_json, required_notes_json, full_script)
select 'Setter','Website','qualifizierung','HK ▸ Website — Setter','master','approved',true,1,
  'Qualifizieren + festen, No-Show-sicheren Termin für die kostenlose Website-Analyse setzen. Kein Preis.',
  'Der Kunde nennt seinen Bedarf selbst — Fragen stellen, zuhören, notieren. Termin über Alternativfragen.',
  'Der Termin ist eine kostenlose Analyse durch den Experten — kein Verkaufsgespräch.',
  'Conversion-Website-Analyse',
  'Super, dann machen wir es konkret. Damit die Analyse für Sie auch wirklich etwas bringt, kurz zwei, drei Fragen.',
  'Genau das schauen wir uns einmal konkret an Ihrem Beispiel an — schwarz auf weiß, wo Sie gerade Anfragen liegen lassen. Bevor Ihre Mitbewerber digital deutlich aktiver werden.',
  'Wie wichtig ist Ihnen das Thema auf einer Skala von 1 bis 10?',
  'Der Experte schaut sich Website, Google-Profil und den Weg bis zur Anfrage vorher an und zeigt im Termin konkret, wo Anfragen verloren gehen.',
  'Schauen Sie kurz in den Kalender — ich hab meinen direkt offen: Passt eher Anfang oder Ende nächster Woche? … Eher vormittags oder nachmittags? … Ich könnte [Tag 1] um [Uhrzeit 1] oder [Tag 2] um [Uhrzeit 2] anbieten. Was passt besser?',
  '["Bekommen Sie über Website oder Google aktuell regelmäßig Anfragen?","Was soll die Seite vor allem besser können — mehr Anfragen, hochwertiger wirken, oder regional besser gefunden werden?","Was stört Sie selbst am meisten daran?","Wie wichtig ist Ihnen das Thema auf einer Skala von 1 bis 10? (unter 7: Was würde bis zur 9 fehlen?)"]'::jsonb,
  '["Bedarf in Kundenworten (Ziel + Störfaktor)","Skala-Wert 1–10","Wer entscheidet mit","Termin + E-Mail bestätigt","Anti-No-Show-Frage gestellt"]'::jsonb,
  $s$KURZ-QUALIFIZIERUNG [R](Kunde nennt Bedarf selbst)[/R]
1. Bekommen Sie über Website oder Google aktuell regelmäßig Anfragen?
2. Was soll die Seite vor allem besser können — [U]mehr Anfragen[/U], hochwertiger wirken, oder regional besser gefunden werden?
3. Was stört Sie [U]selbst[/U] am meisten daran?
4. Skala 1–10: Wie wichtig ist das Thema? [R](unter 7 → „Was würde bis zur 9 fehlen?")[/R]

WARUM JETZT: Genau das schauen wir uns konkret an Ihrem Beispiel an — [U]schwarz auf weiß[/U], wo Sie gerade Anfragen liegen lassen. Bevor Ihre Mitbewerber digital deutlich aktiver werden.

WENN „SCHICKEN SIE ERST INFOS": Kann ich machen — nur bringt eine allgemeine Mail erfahrungsgemäß wenig, weil ich Ihnen ja [U]konkret an Ihrem Beispiel[/U] zeigen wollte, was mir aufgefallen ist. [J]Lassen Sie uns die 20 Minuten direkt festmachen — passt eher morgen oder übermorgen?[/J]

TERMIN (Alternativfragen): Schauen Sie kurz in den Kalender — ich hab meinen direkt offen. [J]Passt eher Anfang oder Ende nächster Woche?[/J] [R](antworten lassen)[/R] [J]Eher vormittags oder nachmittags?[/J] Ich könnte [Tag 1] um [Uhrzeit 1] oder [Tag 2] um [Uhrzeit 2] anbieten. [J]Was passt besser?[/J]

BESTÄTIGUNG + ANTI-NO-SHOW: Perfekt. Die Bestätigung sende ich an [E-Mail], richtig?
Zwei kurze Fragen noch. Erstens: Gibt es jemanden, den Sie bei so einem Thema gerne direkt dabeihätten — jemand, der mitentscheidet, oder aus der Familie?
[G]Und ehrlich, aus Erfahrung: Ist das relevant genug, dass Sie sich die 20 Minuten wirklich nehmen — oder wäre es nur ein Termin, damit ich Ruhe gebe?[/G] [R](bestätigen lassen)[/R]
Perfekt, dann bis [Tag 1] um [Uhrzeit 1]. Vielen Dank für Ihr Vertrauen und einen schönen Tag.$s$
where not exists (select 1 from public.scripts where title = 'HK ▸ Website — Setter');

insert into public.scripts
  (role, entry_angle, situation, title, script_type, status, is_active, version,
   call_goal, tone_guidance, positioning, method_name,
   opening_line, relevance_line, core_question, mechanism, transition_line,
   qualifying_questions_json, required_notes_json, full_script)
select 'Closer','Website','call_start','HK ▸ Website — Closer','master','approved',true,1,
  'Analyse zeigen → Bedarf → Lösung → Preis (erst jetzt!) → Abschluss. Zeigen, nicht verkaufen.',
  'Ehrlich, ruhig, Experte. Einen Punkt schenken, den der Kunde sofort selbst umsetzen kann. Nach dem Preis: still sein.',
  'Preis-Logik: Bedarf → Aufwand → Preis. Kein fixes Paket, Preis erst nach der Bedarfsklärung.',
  'Conversion-Website-Analyse',
  'Kurz vorweg: Das ist kein Verkaufsgespräch. Ich zeige Ihnen ehrlich, was ich an Ihrer Seite anders machen würde — was Sie danach damit tun, entscheiden Sie frei. Passt das?',
  'Was schätzen Sie: Wie viele Anfragen pro Monat gehen verloren, weil die Seite noch nicht überzeugt? Bei Ihrem Auftragswert sind das über ein Jahr schnell eine große Summe — Geld, das liegen bleibt.',
  'Was soll die Website vor allem leisten — mehr Anfragen, mehr Vertrauen, regional besser gefunden werden? Und was stört Sie selbst am meisten?',
  'Die 5 Hebel: 1. Erster Eindruck (klare Aussage nach oben) · 2. Weg zur Anfrage (sichtbare Handlungsführung) · 3. Vertrauen (Bewertungen, Gesichter, Referenzen) · 4. Mobil & Tempo · 5. Google/regional (Profil + Texte ausrichten). Umsetzung heute: schnelle Frameworks, KI-Texte, Online-Terminbuchung, Tracking — steht in Tagen, nicht Monaten.',
  'Den Preis nenne ich bewusst erst jetzt, wo wir Ihren Bedarf kennen — nicht ins Blaue. Für den Umfang liegen wir bei [Preis]. — Wenn es passt: Start [Datum], Onboarding kommt direkt, in [X] Wochen live. Machen wir es so?',
  '["Was soll die Website vor allem leisten — Anfragen, Vertrauen, regionale Auffindbarkeit?","Was stört Sie selbst am meisten?","Wie viele Anfragen pro Monat gehen aktuell verloren (Schätzung)?"]'::jsonb,
  '["Bestätigter Bedarf (Hebel 1–3)","Verlust-Anker (Zahl)","Vereinbarter Umfang + Preis","Startdatum + nächste Schritte"]'::jsonb,
  $s$REFRAME: [G]Kurz vorweg: Das ist kein Verkaufsgespräch. Ich zeige Ihnen ehrlich, was ich an Ihrer Seite anders machen würde — was Sie danach damit tun, entscheiden Sie frei.[/G] Passt das? [R](bestätigen lassen)[/R]

KONTEXT: Was soll die Website vor allem leisten — mehr Anfragen, mehr Vertrauen, regional besser gefunden werden? Und was stört Sie selbst am meisten?

ANALYSE — DIE 5 HEBEL:
1. [U]Erster Eindruck:[/U] oben wird nicht klar, was Sie für wen machen und warum Sie → klare Aussage nach oben.
2. [U]Weg zur Anfrage:[/U] nächster Schritt zu versteckt → sichtbare Handlungsführung.
3. [U]Vertrauen:[/U] Bewertungen, Gesichter, Referenzen fehlen → Vertrauens-Elemente.
4. [U]Mobil & Tempo:[/U] auf dem Handy langsam/verschoben → schlanker, schneller.
5. [U]Google/regional:[/U] bei „Leistung + Ort" weit unten → Profil + Texte ausrichten.
[R](Regel: einen Punkt schenken, den der Kunde sofort selbst umsetzen kann — beweist „kein Pitch")[/R]

MODERNE TOOLS: Schnelle Frameworks, KI-gestützte Texte, Online-Terminbuchung, sauberes Tracking. [U]Sowas steht in Tagen, nicht Monaten.[/U]

LÜCKE RECHNEN [R](Anker VOR dem Preis)[/R]: Was schätzen Sie: Wie viele Anfragen pro Monat gehen verloren, weil die Seite noch nicht überzeugt? … Bei Ihrem Auftragswert sind das über ein Jahr schnell [große Zahl] — [U]Geld, das liegen bleibt[/U].

LÖSUNG — NUR WAS NÖTIG IST: Auf Basis der Analyse setze ich genau die Bausteine an, die den Hebel bringen — nicht mehr: [Schritt 1 → 2 → 3], live in [X] Wochen.

PREIS: [G]Den Preis nenne ich bewusst erst jetzt, wo wir Ihren Bedarf kennen — nicht ins Blaue.[/G] Für den Umfang liegen wir bei [Preis]. [R](Preis nennen — dann still sein)[/R]

ABSCHLUSS: [J]Wenn es für Sie passt: Start [Datum], Onboarding kommt direkt, in [X] Wochen live. Machen wir es so?[/J]$s$
where not exists (select 1 from public.scripts where title = 'HK ▸ Website — Closer');

-- ============ 📣 SOCIAL & BRANDING ============
insert into public.scripts
  (role, entry_angle, situation, title, script_type, status, is_active, version,
   call_goal, tone_guidance, positioning, method_name,
   opening_line, relevance_line, core_question, mechanism, transition_line,
   qualifying_questions_json, required_notes_json, full_script)
select 'Opener','Social Media','social_media','HK ▸ Social & Branding — Opener','master','approved',true,1,
  'Aufmachen mit starkem Pain (Vergleichbarkeit). Gabelung merken: Firma stärken → Firmen-Branding · Person ist Vertrauensfaktor → Personal-Branding. Gleicher Call.',
  'Frech-charmant, hoher Status. Der Pain (Vergleichbarkeit → Preisdruck) muss sitzen.',
  'Nicht „Wir posten für Sie." Sondern: Wir machen Ihr Unternehmen in Ihrer Region zur klar vertrauenswürdigeren und hochwertigeren Wahl.',
  'Regionale Marken-Dominanz',
  'Moin/Servus/Hallo Herr/Frau [Name], [ICH] hier von HK Growth. Wir haben vor einiger Zeit schon mal wegen Ihrer digitalen Außenwirkung gesprochen — damals war einfach ein bisschen zu viel los. Deshalb hab ich es mir heute nochmal auf die Agenda geschrieben, Sie als Kunden zu gewinnen. (lachen) — also natürlich nicht genau heute. Aber ich hab mir Ihren Betrieb nochmal ganz genau angeschaut.',
  'Ihr Unternehmen wirkt fachlich stark. Aber wenn man Sie online mit zwei, drei Anbietern aus Ihrer Region vergleicht, wird in den ersten Sekunden nicht klar genug, warum ausgerechnet Sie. Genau da verlieren Unternehmer Geld — weil Interessenten vergleichen, bevor sie anrufen.',
  'Haben Sie schon mal etwas von regionaler Marken-Dominanz gehört?',
  'Eine Möglichkeit, mit der Unternehmen in ihrer Region nicht mehr als irgendein Anbieter wahrgenommen werden, sondern als die deutlich vertrauenswürdigere und hochwertigere Wahl. Nicht über ein neues Logo — sondern darüber, dass der komplette Auftritt sofort klar macht: Warum Ihnen vertrauen? Warum hochwertiger? Warum bei Ihnen anfragen, obwohl es drei andere gibt?',
  'Wäre es die absolut schlechteste Idee, wenn ich Ihnen einmal kostenlos zeige, wie wir das bei dem anderen Unternehmen aufgebaut haben — und wir prüfen, ob das auch für Ihren Betrieb funktioniert?',
  '[]'::jsonb,
  '["Gabelung: Firmen- oder Personal-Branding rausgehört?","Reaktion auf den Vergleichbarkeits-Pain"]'::jsonb,
  $s$[G]Wir haben vor einiger Zeit schon mal wegen Ihrer digitalen Außenwirkung gesprochen — damals war einfach ein bisschen zu viel los.[/G]

Deshalb hab ich es mir heute nochmal auf die Agenda geschrieben, [U]Sie als Kunden zu gewinnen[/U]. [R](lachen)[/R] — also natürlich nicht genau heute. Aber ich hab mir Ihren Betrieb nochmal [U]ganz genau[/U] angeschaut.

[G]Mir sind zwei, drei Parallelen zu einem unserer Kunden aufgefallen, bei dem wir durch einen klareren Auftritt in wenigen Wochen mehrere hochwertigere Anfragen erzeugen konnten.[/G] [R](kurze Pause)[/R]

DER PAIN: Das Spannende bei Ihnen: Ihr Unternehmen wirkt fachlich stark. Aber wenn man Sie online mit zwei, drei Anbietern aus Ihrer Region vergleicht, wird in den ersten Sekunden [U]nicht klar genug, warum ausgerechnet Sie[/U]. Und genau da verlieren Unternehmer Geld — nicht weil sie schlecht arbeiten, sondern weil Interessenten [U]vergleichen, bevor sie anrufen[/U]. Ist der Unterschied nicht sichtbar, entscheidet der Kunde über den Preis, fragt gar nicht erst an — oder geht zu dem, der professioneller wirkt.

[J]Haben Sie schon mal etwas von regionaler Marken-Dominanz gehört?[/J] [R](antworten lassen)[/R]

WENN „WAS IST DAS?": Eine Möglichkeit, mit der Unternehmen in ihrer Region nicht mehr als irgendein Anbieter wahrgenommen werden, sondern als die [U]deutlich vertrauenswürdigere und hochwertigere Wahl[/U]. Nicht über ein neues Logo — sondern darüber, dass der komplette Auftritt sofort klar macht: Warum Ihnen vertrauen? Warum wirken Sie hochwertiger? Warum bei Ihnen anfragen, obwohl es drei andere gibt?

WENN „WAS IST IHNEN BEI UNS AUFGEFALLEN?": Gute Frage, ich mach es kurz — drei Sachen. Erstens: Ihr Betrieb wirkt solide, aber online noch nicht so stark, wie er in der Realität ist. Zweitens: Im Vergleich wird nicht schnell genug klar, warum ein Kunde ausgerechnet bei Ihnen anfragen sollte. Drittens: Ihr Auftritt erklärt, [U]was[/U] Sie machen — aber zu wenig, [U]warum Sie die bessere Wahl sind[/U]. Deshalb wollte ich Ihnen das sauber zeigen, statt es am Telefon halb zu erklären.

[J]Wäre es die absolut schlechteste Idee, wenn ich Ihnen einmal [U]kostenlos[/U] zeige, wie wir das bei dem anderen Unternehmen aufgebaut haben — und wir prüfen, ob das auch für Ihren Betrieb funktioniert?[/J]$s$
where not exists (select 1 from public.scripts where title = 'HK ▸ Social & Branding — Opener');

insert into public.scripts
  (role, entry_angle, situation, title, script_type, status, is_active, version,
   call_goal, tone_guidance, positioning, method_name,
   opening_line, relevance_line, core_question, mechanism, transition_line,
   qualifying_questions_json, required_notes_json, full_script)
select 'Setter','Social Media','qualifizierung','HK ▸ Social & Branding — Setter','master','approved',true,1,
  'Qualifizieren + Gabelung (Firmen/Personal) raushören + Termin für die kostenlose Marken-Analyse setzen.',
  'Zuhören, Gabelung notieren. Termin über Alternativfragen, Anti-No-Show Pflicht.',
  'Der Termin zeigt auch, wie die Konkurrenz aktuell wirkt — echter Mehrwert, kein Pitch.',
  'Regionale Marken-Dominanz',
  'Super. Damit die Analyse für Sie wirklich etwas bringt, kurz ein paar Fragen.',
  'Bei Ihnen geht es nicht darum, irgendwas schön zu machen — sondern Ihre echte Qualität nach außen so klar zu zeigen, dass Kunden schneller verstehen, warum sie Ihnen vertrauen sollten. Wir schauen uns auch an, wie Ihre Konkurrenz aktuell wirkt.',
  'Wie wichtig ist es Ihnen auf einer Skala von 1 bis 10, in Ihrer Region als die klar vertrauenswürdigere Wahl gesehen zu werden?',
  'Der Experte vergleicht Ihren Auftritt mit dem Wettbewerb in der Region und zeigt, wo Sie am schnellsten unverwechselbar werden.',
  'Schauen Sie kurz in den Kalender: Passt eher Anfang oder Ende nächster Woche? … Eher vormittags oder nachmittags? … Ich könnte [Tag 1] um [Uhrzeit 1] oder [Tag 2] um [Uhrzeit 2] anbieten. Was passt besser?',
  '["Wenn ein Kunde Sie und zwei Wettbewerber online vergleicht: Wird sofort klar, warum er sich für Sie entscheiden sollte?","Kommen Ihre besten Kunden eher über Empfehlung, online oder Bestandskontakte?","Was ist Ihnen am wichtigsten: Hochwertigkeit, Vertrauen, mehr Anfragen oder weniger Preisdruck?","(Gabelung:) Bauen Kunden eher wegen der Firma Vertrauen auf — oder auch wegen Ihnen als Person?","Skala 1–10: Wie wichtig ist regionale Marken-Dominanz?"]'::jsonb,
  '["Gabelung Firmen-/Personal-Branding","Bedarf in Kundenworten","Skala-Wert","Wer entscheidet mit","Termin + E-Mail bestätigt","Anti-No-Show gestellt"]'::jsonb,
  $s$KURZ-QUALIFIZIERUNG:
1. Wenn ein Kunde Sie und zwei Wettbewerber online vergleicht: Wird sofort klar, warum er sich für [U]Sie[/U] entscheiden sollte?
2. Kommen Ihre besten Kunden eher über Empfehlung, online oder Bestandskontakte?
3. Was ist Ihnen am wichtigsten: Hochwertigkeit, Vertrauen, mehr Anfragen oder [U]weniger Preisdruck[/U]?
4. [R](Gabelung:)[/R] Bauen Kunden eher wegen der Firma Vertrauen auf — oder auch wegen [U]Ihnen als Person[/U]?
5. Skala 1–10: Wie wichtig ist es, in Ihrer Region als die klar vertrauenswürdigere Wahl gesehen zu werden?

WARUM JETZT: Bei Ihnen geht es nicht darum, irgendwas schön zu machen — sondern Ihre [U]echte Qualität[/U] nach außen so klar zu zeigen, dass Kunden schneller verstehen, warum sie Ihnen vertrauen sollten. Wir schauen uns auch an, [U]wie Ihre Konkurrenz gerade wirkt[/U].

WENN „SCHICKEN SIE ERST INFOS": Kann ich machen — nur bringt eine allgemeine Mail wenig, weil ich es Ihnen [U]konkret an Ihrem Beispiel[/U] zeigen wollte. [J]Lassen Sie uns die 20 Minuten direkt festmachen — eher morgen oder übermorgen?[/J]

TERMIN: [J]Passt eher Anfang oder Ende nächster Woche?[/J] … [J]Eher vormittags oder nachmittags?[/J] … Ich könnte [Tag 1] um [Uhrzeit 1] oder [Tag 2] um [Uhrzeit 2] anbieten. [J]Was passt besser?[/J]

BESTÄTIGUNG + ANTI-NO-SHOW: Die Bestätigung sende ich an [E-Mail], richtig? Gibt es jemanden, den Sie dabeihaben möchten — zweiter Geschäftsführer, Marketing, jemand aus der Familie?
[G]Und ehrlich, aus Erfahrung: relevant genug für die 20 Minuten — oder eher ein Höflichkeitstermin?[/G]
Perfekt, dann bis [Tag 1] um [Uhrzeit 1].$s$
where not exists (select 1 from public.scripts where title = 'HK ▸ Social & Branding — Setter');

insert into public.scripts
  (role, entry_angle, situation, title, script_type, status, is_active, version,
   call_goal, tone_guidance, positioning, method_name,
   opening_line, relevance_line, core_question, mechanism, transition_line,
   qualifying_questions_json, required_notes_json, full_script)
select 'Closer','Social Media','call_start','HK ▸ Social & Branding — Closer','master','approved',true,1,
  'Marken-Analyse zeigen → Bedarf → Lösung (Drehtag-System) → Preis → Abschluss.',
  'Zeigen statt verkaufen. Anker vor dem Preis: Was kostet Preisdruck durch Vergleichbarkeit? Nach dem Preis still sein.',
  'Preis-Logik: Bedarf → Aufwand → Preis. Produktion läuft über Content/Drehtag — ein Drehtag = Wochen an Content.',
  'Regionale Marken-Dominanz',
  'Kurz vorweg: kein Verkaufsgespräch. Ich zeige Ihnen ehrlich, wie Ihre Marke im Vergleich zum Wettbewerb wirkt und wo Sie am schnellsten unverwechselbar werden. Passt das?',
  'Was kostet es Sie, dass Sie über den Preis verglichen werden statt über Vertrauen? Schon wenige Prozent mehr durchsetzbarer Preis oder ein paar Wunschkunden im Jahr ergeben eine große Summe.',
  'Was soll Ihre Außenwirkung vor allem bewirken — hochwertigere Kunden, weniger Preisdruck, bessere Bewerber? Und wofür sollen Menschen Sie in einem Satz kennen?',
  'Die 5 Hebel: 1. Positionierung (spitze Kernbotschaft) · 2. Wettbewerbs-Vergleich (warum Sie?) · 3. Vertrauen & Gesicht (Menschen folgen Menschen) · 4. Wiedererkennbarkeit & Konsistenz · 5. Regelmäßigkeit. Umsetzung: Content-System — ein Drehtag = Wochen an Content, KI-gestützte Produktion, gezielte Distribution.',
  'Den Preis nenne ich erst jetzt, wo wir den Bedarf kennen: [Preis]. — Wenn es passt: Start [Datum], erster Drehtag [Datum], in [X] Wochen sichtbar. Machen wir es so?',
  '["Was soll die Außenwirkung bewirken — hochwertigere Kunden, weniger Preisdruck, Bewerber?","Wofür sollen Menschen Sie in einem Satz kennen?","Was kostet der aktuelle Preisdruck (Schätzung)?"]'::jsonb,
  '["Gabelung bestätigt (Firmen/Personal)","Bestätigter Bedarf (Hebel)","Anker-Zahl","Umfang + Preis","Startdatum + Drehtag-Termin"]'::jsonb,
  $s$REFRAME: [G]Kurz vorweg: kein Verkaufsgespräch. Ich zeige Ihnen ehrlich, wie Ihre Marke im Vergleich zum Wettbewerb wirkt und wo Sie am schnellsten unverwechselbar werden.[/G] Passt das? [R](bestätigen lassen)[/R]

KONTEXT: Was soll Ihre Außenwirkung vor allem bewirken — hochwertigere Kunden, weniger Preisdruck, bessere Bewerber? Und: Wofür sollen Menschen Sie [U]in einem Satz[/U] kennen?

ANALYSE — DIE 5 HEBEL:
1. [U]Positionierung:[/U] Wofür stehen Sie in einem Satz? Aktuell austauschbar → spitze Kernbotschaft.
2. [U]Wettbewerbs-Vergleich:[/U] neben zwei Anbietern — warum Sie? Wird nicht hart genug sichtbar.
3. [U]Vertrauen & Gesicht:[/U] Menschen folgen Menschen → Sie/Ihr Team, Referenzen, Bewertungen sichtbar.
4. [U]Wiedererkennbarkeit:[/U] Website, Social, Google einheitlich und einprägsam.
5. [U]Regelmäßigkeit:[/U] ohne Rhythmus kein Vertrauensaufbau → planbarer Content statt „ab und zu".

MODERNE TOOLS: Ein Content-System, das aus [U]einem Drehtag[/U] Wochen an Content macht — KI-gestützte Produktion, gezielte Distribution.

LÜCKE RECHNEN [R](Anker VOR dem Preis)[/R]: Was kostet es Sie, dass Sie über den [U]Preis[/U] verglichen werden statt über Vertrauen? Schon [X] % mehr durchsetzbarer Preis oder [X] Wunschkunden im Jahr ergeben [große Zahl].

LÖSUNG: [Positionierung → Content-Drehtag → Distribution/Rhythmus] — in [X] Wochen sichtbar.

PREIS: [G]Den Preis nenne ich erst jetzt, wo wir den Bedarf kennen.[/G] Für den Umfang liegen wir bei [Preis]. [R](dann still sein)[/R]

ABSCHLUSS: [J]Wenn es passt: Start [Datum], erster Drehtag [Datum], in [X] Wochen sichtbar. Machen wir es so?[/J]$s$
where not exists (select 1 from public.scripts where title = 'HK ▸ Social & Branding — Closer');

-- ============ 🤖 KI-AUTOMATION ============
insert into public.scripts
  (role, entry_angle, situation, title, script_type, status, is_active, version,
   call_goal, tone_guidance, positioning, method_name,
   opening_line, relevance_line, core_question, mechanism, transition_line,
   qualifying_questions_json, required_notes_json, full_script)
select 'Opener','Automationen & CRM','ki_automation','HK ▸ KI-Automation — Opener','master','approved',true,1,
  'Aufmachen + Interesse gewinnen. Pain: liegengebliebene Anfragen, manuelles Chaos.',
  'Nüchtern-konkret. Der Pain ist Zeit + verpuffter Umsatz.',
  'Nicht „Wir bauen Automationen." Sondern: Wir sorgen dafür, dass Anfragen, Kontakte, Termine und Nachverfolgung nicht mehr manuell im Chaos verschwinden.',
  'Digitales Prozess-Wachstums-System',
  'Moin/Servus/Hallo Herr/Frau [Name], [ICH] hier von HK Growth. Wir haben vor knapp zwei Monaten schon einmal miteinander gesprochen — damals war einfach ein bisschen zu viel los. Deshalb hab ich es mir heute nochmal auf die Agenda geschrieben, Sie als Kunden zu gewinnen. (lachen) — also natürlich nicht genau heute. Aber ich hab mir Ihren Betrieb und Ihre digitale Struktur nochmal ganz genau angeschaut.',
  'Mir sind zwei, drei Parallelen zu einem unserer Kunden aufgefallen, der mit uns sein digitales Wachstum auf die nächste Stufe bringen konnte. Viele Unternehmen bekommen Anfragen — aber dann fehlt ein sauberes System für Nachverfolgung, Terminierung, Angebote, Rechnungen oder Wiedervorlage. Da bleibt Umsatz liegen, ohne dass man es merkt.',
  'Haben Sie schon einmal etwas von einem digitalen Prozess-Wachstums-System gehört?',
  'Dabei verbinden wir Kontaktwege, Formulare, CRM, Automationen, E-Mails, Erinnerungen und interne Abläufe — inklusive KI — so, dass weniger liegen bleibt und mehr aus bestehenden Kontakten entsteht.',
  'Wäre es die absolut schlechteste Idee, wenn ich Ihnen einmal kostenlos zeige, wo Unternehmen typischerweise Anfragen verlieren und wie das bei Ihnen sauberer laufen könnte?',
  '[]'::jsonb,
  '["Wo läuft heute am meisten manuell (CRM? Excel? WhatsApp?)","Reaktion auf Methodenfrage"]'::jsonb,
  $s$[G]Wir haben vor knapp zwei Monaten schon einmal miteinander gesprochen — damals war einfach ein bisschen zu viel los.[/G]

Deshalb hab ich es mir heute nochmal auf die Agenda geschrieben, [U]Sie als Kunden zu gewinnen[/U]. [R](lachen)[/R] — also natürlich nicht genau heute. Aber ich hab mir Ihren Betrieb und Ihre digitale Struktur nochmal [U]ganz genau[/U] angeschaut.

[G]Mir sind zwei, drei Parallelen zu einem unserer Kunden aufgefallen, der mit uns in den letzten zwei Monaten sein digitales Wachstum auf die nächste Stufe bringen konnte.[/G] [R](kurze Pause)[/R]

Viele Unternehmen [U]bekommen[/U] Anfragen, Kontakte, Bewerbungen — aber dann fehlt ein sauberes System für Nachverfolgung, Terminierung, Angebote, Rechnungen oder Wiedervorlage. Da bleibt Umsatz liegen, ohne dass man es merkt.

[J]Haben Sie schon einmal etwas von einem digitalen Prozess-Wachstums-System gehört?[/J] [R](antworten lassen)[/R]

WENN „WAS IST DAS?": Dabei verbinden wir Kontaktwege, Formulare, CRM, Automationen, E-Mails, Erinnerungen und interne Abläufe — inklusive KI — so, dass [U]weniger liegen bleibt[/U] und mehr aus bestehenden Kontakten entsteht.

[J]Wäre es die absolut schlechteste Idee, wenn ich Ihnen einmal [U]kostenlos[/U] zeige, wo Unternehmen typischerweise Anfragen verlieren — und wie das bei Ihnen sauberer laufen könnte?[/J]$s$
where not exists (select 1 from public.scripts where title = 'HK ▸ KI-Automation — Opener');

insert into public.scripts
  (role, entry_angle, situation, title, script_type, status, is_active, version,
   call_goal, tone_guidance, positioning, method_name,
   opening_line, relevance_line, core_question, mechanism, transition_line,
   qualifying_questions_json, required_notes_json, full_script)
select 'Setter','Automationen & CRM','qualifizierung','HK ▸ KI-Automation — Setter','master','approved',true,1,
  'Qualifizieren + Termin für die kostenlose Automations-Analyse setzen. Exklusivität nur, wenn wahr.',
  'Konkret nach Abläufen fragen. Die Antwort auf Frage 4 ist der spätere Anker im Closer — sauber notieren.',
  'Der Termin zeigt konkret, welche Abläufe automatisierbar sind — kein Verkaufsgespräch.',
  'Digitales Prozess-Wachstums-System',
  'Super. Damit der Experte gezielt draufschauen kann, kurz ein paar Fragen.',
  'Ich spreche das bewusst zuerst mit Ihnen und nicht mit zehn Betrieben aus Ihrer Branche gleichzeitig — wenn es passt, wäre es sinnvoll, dass Sie vorne dran sind, bevor Ihre Mitbewerber ihre Abläufe digital sauberer aufstellen.',
  'Wie wichtig ist mehr Struktur auf einer Skala von 1 bis 10?',
  'Der Experte schaut sich vorab an, welche Abläufe bei Ihnen am meisten Zeit fressen und was heute automatisierbar wäre.',
  'Passt eher Anfang oder Ende nächster Woche? … Vormittags oder nachmittags? … Ich könnte [Tag 1] um [Uhrzeit 1] oder [Tag 2] um [Uhrzeit 2] anbieten. Was passt besser?',
  '["Was passiert aktuell, wenn eine neue Anfrage reinkommt?","Gibt es ein CRM — oder läuft vieles über E-Mail, WhatsApp und Excel?","Gibt es Termine, Angebote oder Rechnungen, die manchmal liegen bleiben?","Was kostet es Sie ungefähr, wenn eine gute Anfrage nicht sauber bearbeitet wird?","Skala 1–10: Wie wichtig ist mehr Struktur gerade?"]'::jsonb,
  '["Ist-Ablauf bei neuer Anfrage","CRM ja/nein + Tools","Was bleibt liegen","Kosten-Schätzung (Anker für Closer!)","Skala-Wert","Termin + E-Mail bestätigt","Anti-No-Show gestellt"]'::jsonb,
  $s$KURZ-QUALIFIZIERUNG:
1. Was passiert aktuell, wenn eine neue Anfrage reinkommt?
2. Gibt es ein CRM — oder läuft vieles über E-Mail, WhatsApp und Excel?
3. Gibt es Termine, Angebote oder Rechnungen, die manchmal [U]liegen bleiben[/U]?
4. Was kostet es Sie ungefähr, wenn eine gute Anfrage nicht sauber bearbeitet wird? [R](Antwort notieren — Anker für den Closer)[/R]
5. Skala 1–10: Wie wichtig ist mehr Struktur gerade?

WARUM JETZT: Ich spreche das bewusst zuerst mit Ihnen und nicht mit zehn Betrieben aus Ihrer Branche gleichzeitig — wenn es passt, wäre es sinnvoll, dass Sie [U]vorne dran[/U] sind, bevor Ihre Mitbewerber ihre Abläufe digital sauberer aufstellen.

WENN „SCHICKEN SIE ERST INFOS": Kann ich machen — nur bringt eine allgemeine Mail wenig, weil ich es [U]konkret an Ihren Abläufen[/U] zeigen wollte. [J]Lassen Sie uns die 20 Minuten direkt festmachen — eher morgen oder übermorgen?[/J]

TERMIN: [J]Passt eher Anfang oder Ende nächster Woche?[/J] … [J]Vormittags oder nachmittags?[/J] … [Tag 1] um [Uhrzeit 1] oder [Tag 2] um [Uhrzeit 2]. [J]Was passt besser?[/J]

BESTÄTIGUNG + ANTI-NO-SHOW: Die Bestätigung sende ich an [E-Mail], richtig? Gibt es jemanden, den Sie dabeihaben möchten — Geschäftsführung, IT, jemand aus der Familie?
[G]Und ehrlich, aus Erfahrung: relevant genug für die 20 Minuten — oder eher ein Höflichkeitstermin?[/G]
Perfekt, dann bis [Tag 1] um [Uhrzeit 1].$s$
where not exists (select 1 from public.scripts where title = 'HK ▸ KI-Automation — Setter');

insert into public.scripts
  (role, entry_angle, situation, title, script_type, status, is_active, version,
   call_goal, tone_guidance, positioning, method_name,
   opening_line, relevance_line, core_question, mechanism, transition_line,
   qualifying_questions_json, required_notes_json, full_script)
select 'Closer','Automationen & CRM','call_start','HK ▸ KI-Automation — Closer','master','approved',true,1,
  'Automations-Analyse → Zeit/Geld-Anker → Lösung → Preis → Abschluss.',
  'Rechnen statt behaupten: Stunden × Kosten + verlorene Anfragen = Anker. Nach dem Preis still sein.',
  'Preis-Logik: Bedarf → Aufwand → Preis. Kein Systemwechsel — eine Schicht Automatisierung obendrauf.',
  'Digitales Prozess-Wachstums-System',
  'Kurz vorweg: kein Verkaufsgespräch. Ich zeige Ihnen ehrlich, welche Abläufe bei Ihnen am meisten Zeit fressen und was davon heute automatisierbar wäre. Passt das?',
  'Rechnen wir kurz: X Stunden pro Woche Routine mal Stundenkosten plus verlorene Anfragen pro Monat — über ein Jahr eine große Summe, die aktuell verpufft.',
  'Was würde am meisten helfen — Zeit im Team freispielen, schneller reagieren, oder mehr aus bestehenden Anfragen machen? Und welcher Ablauf nervt Sie selbst am meisten?',
  'Die 5 Hebel: 1. Anfrage-Handling (Sofort-Reaktion, kein Lead bleibt liegen) · 2. Termine/Angebote/Rechnungen automatisch · 3. Wiederkehrende Handarbeit · 4. KI-Assistent (FAQ, Vorqualifizierung, rund um die Uhr) · 5. Reporting ohne Excel. Umsetzung: KI-Agenten + Workflow-Automationen an bestehende Tools angebunden — kein Systemwechsel, das meiste in Tagen live.',
  'Den Preis nenne ich erst jetzt, wo wir den Bedarf kennen: [Preis]. — Wenn es passt: Start [Datum], in [X] Wochen läuft die erste Automation. Machen wir es so?',
  '["Was würde am meisten helfen — Zeit, Reaktionsgeschwindigkeit, mehr aus Anfragen?","Welcher Ablauf nervt am meisten?","Stunden/Woche Routine + verlorene Anfragen (für den Anker)"]'::jsonb,
  '["Priorisierte Abläufe 1–3","Anker-Rechnung (Zahl)","Umfang + Preis","Startdatum + erste Automation"]'::jsonb,
  $s$REFRAME: [G]Kurz vorweg: kein Verkaufsgespräch. Ich zeige Ihnen ehrlich, welche Abläufe bei Ihnen am meisten Zeit fressen und was davon heute automatisierbar wäre.[/G] Passt das? [R](bestätigen lassen)[/R]

KONTEXT: Was würde am meisten helfen — Zeit im Team freispielen, schneller reagieren, oder mehr aus bestehenden Anfragen machen? Und welcher Ablauf nervt Sie [U]selbst[/U] am meisten?

ANALYSE — DIE 5 HEBEL:
1. [U]Anfrage-Handling:[/U] automatische Sofort-Reaktion → kein Lead bleibt liegen.
2. [U]Termine, Angebote, Rechnungen:[/U] Buchung + Erinnerungen automatisch.
3. [U]Wiederkehrende Handarbeit:[/U] Nachfassen, Datenpflege, Wiedervorlage → einmal aufsetzen, läuft.
4. [U]KI-Assistent:[/U] FAQ, Erstauskunft, Vorqualifizierung — rund um die Uhr.
5. [U]Reporting:[/U] Anfragen/Umsatz im Blick ohne Excel-Bastelei.

MODERNE TOOLS: KI-Agenten und Workflow-Automationen, an Ihre bestehenden Tools angebunden — [U]kein Systemwechsel[/U], eine Schicht obendrauf. Das meiste ist in Tagen live.

LÜCKE RECHNEN [R](Anker VOR dem Preis — Zahl aus dem Setter-Kontext nutzen)[/R]: Rechnen wir kurz: [X] Stunden/Woche Routine × Stundenkosten + [X] verlorene Anfragen/Monat → über ein Jahr [große Zahl]. [U]Das verpufft aktuell.[/U]

LÖSUNG — NUR WAS NÖTIG IST: Genau die Automationen, die den Hebel bringen: [Ablauf 1 → 2 → 3], das meiste in [X] Wochen live.

PREIS: [G]Den Preis nenne ich erst jetzt, wo wir den Bedarf kennen.[/G] Für den Umfang liegen wir bei [Preis]. [R](dann still sein)[/R]

ABSCHLUSS: [J]Wenn es passt: Start [Datum], in [X] Wochen läuft die erste Automation. Machen wir es so?[/J]$s$
where not exists (select 1 from public.scripts where title = 'HK ▸ KI-Automation — Closer');

-- ============ 📈 WACHSTUMSSYSTEM ============
insert into public.scripts
  (role, entry_angle, situation, title, script_type, status, is_active, version,
   call_goal, tone_guidance, positioning, method_name,
   opening_line, relevance_line, core_question, mechanism, transition_line,
   qualifying_questions_json, required_notes_json, full_script)
select 'Opener','Komplettangebot','komplettangebot','HK ▸ Wachstumssystem — Opener','master','approved',true,1,
  'Das Zusammenspiel verkaufen — für Kunden, die schon Einzelnes tun, aber ohne System.',
  'Strategisch, ruhig, groß denkend. Pain: Einzelmaßnahmen verpuffen.',
  'Nicht „Wir machen alles." Sondern: Wir verbinden Sichtbarkeit, Vertrauen, Content, Website, Anfragen und Nachverfolgung zu einem digitalen Wachstumssystem.',
  'HK Growth System',
  'Moin/Servus/Hallo Herr/Frau [Name], [ICH] hier von HK Growth. Wir haben vor einiger Zeit schon einmal wegen Ihrer digitalen Außenwirkung gesprochen — damals war einfach ein bisschen viel los. Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, Sie als Kunden zu gewinnen. (lachen) — also natürlich nicht genau heute. Aber ich hab mir Ihren Betrieb ganz genau angeschaut: Website, Social Media, Google, Content und den Weg bis zur Anfrage.',
  'Bei Ihnen ist nicht ein einzelner Punkt interessant — sondern das Zusammenspiel. Viele haben eine Website, posten gelegentlich, haben Werbung probiert. Aber es fehlt ein System, das Aufmerksamkeit, Vertrauen, Anfrage und Nachverfolgung sauber verbindet — deshalb verpufft die Energie in Einzelmaßnahmen.',
  'Haben Sie schon einmal etwas von digitaler Wachstumsnachverfolgung gehört?',
  'Dabei schauen wir, wo Ihr Unternehmen digital gerade Aufmerksamkeit verliert, wo Vertrauen nicht stark genug aufgebaut wird, wo Anfragen nicht entstehen — und wo Kontakte nicht sauber nachverfolgt werden.',
  'Wäre es die absolut schlechteste Idee, wenn ich Ihnen einmal kostenlos zeige, welche Hebel bei Ihnen am stärksten sind — und ob sich daraus ein digitales Wachstumssystem bauen lässt?',
  '[]'::jsonb,
  '["Welche Einzelmaßnahmen laufen schon","Reaktion auf System-Gedanken"]'::jsonb,
  $s$[G]Wir haben vor einiger Zeit schon einmal wegen Ihrer digitalen Außenwirkung gesprochen — damals war einfach ein bisschen viel los.[/G]

Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, [U]Sie als Kunden zu gewinnen[/U]. [R](lachen)[/R] — also natürlich nicht genau heute. Aber ich hab mir Ihren Betrieb nochmal [U]ganz genau[/U] angeschaut: Website, Social Media, Google, Content und den Weg bis zur Anfrage.

[G]Und dabei ist mir aufgefallen: Bei Ihnen ist nicht ein einzelner Punkt interessant — sondern das [U]Zusammenspiel[/U].[/G] [R](kurze Pause)[/R]

Viele Unternehmen haben eine Website, posten gelegentlich, bekommen hier und da eine Anfrage, haben vielleicht Werbung probiert. Aber es fehlt [U]ein System[/U], das Aufmerksamkeit, Vertrauen, Anfrage und Nachverfolgung sauber verbindet — deshalb verpufft die Energie in Einzelmaßnahmen.

[J]Haben Sie schon einmal etwas von digitaler Wachstumsnachverfolgung gehört?[/J] [R](antworten lassen)[/R]

WENN „WAS IST DAS?": Dabei schauen wir, wo Ihr Unternehmen digital gerade Aufmerksamkeit verliert, wo Vertrauen nicht stark genug aufgebaut wird, wo Anfragen nicht entstehen — und wo Kontakte nicht sauber nachverfolgt werden.

[J]Wäre es die absolut schlechteste Idee, wenn ich Ihnen einmal [U]kostenlos[/U] zeige, welche Hebel bei Ihnen am stärksten sind — und ob sich daraus ein digitales Wachstumssystem bauen lässt?[/J]$s$
where not exists (select 1 from public.scripts where title = 'HK ▸ Wachstumssystem — Opener');

insert into public.scripts
  (role, entry_angle, situation, title, script_type, status, is_active, version,
   call_goal, tone_guidance, positioning, method_name,
   opening_line, relevance_line, core_question, mechanism, transition_line,
   qualifying_questions_json, required_notes_json, full_script)
select 'Setter','Komplettangebot','qualifizierung','HK ▸ Wachstumssystem — Setter','master','approved',true,1,
  'Engpass + Historie qualifizieren, Termin setzen (30–45 Min., größerer Scope). Entscheider direkt einladen.',
  'Größerer Rahmen als Einzelpfeiler: nach Historie und Fehlern fragen. Entscheider-Frage ist Pflicht.',
  'Der Termin prüft gemeinsam, welche Hebel wirklich Sinn ergeben — keine Einzelleistungs-Empfehlung.',
  'HK Growth System',
  'Super. Damit das Gespräch für Sie wirklich Sinn ergibt, kurz ein paar Fragen.',
  'Basierend auf dem, was Sie sagen, sehe ich genug Ansatzpunkte, dass sich ein kurzes Gespräch lohnt — wir prüfen gemeinsam, welche Hebel bei Ihnen wirklich Sinn ergeben.',
  'Skala 1–10: Wie wichtig ist planbares Wachstum gerade?',
  'Der Wachstums-Stratege schaut sich vorab das Zusammenspiel Ihrer Kanäle an und identifiziert den Hebel, der aktuell am meisten blockiert.',
  'Passt eher Anfang oder Ende nächster Woche? … Vormittags oder nachmittags? … Ich könnte [Tag 1] um [Uhrzeit 1] oder [Tag 2] um [Uhrzeit 2] anbieten. Was passt besser?',
  '["Wenn Sie an Wachstum denken: eher Kunden, Bewerber, Sichtbarkeit, Marke, Prozesse — oder alles zusammen?","Was ist aktuell der größte Engpass?","Was haben Sie schon probiert — was hat funktioniert, was nicht?","Welche Fehler dürfen wir auf keinen Fall wiederholen?","Wer müsste bei einer Entscheidung mit im Gespräch sein?","Skala 1–10: Wie wichtig ist planbares Wachstum gerade?"]'::jsonb,
  '["Größter Engpass","Historie (was lief, was nicht)","No-Go-Fehler","Entscheider + direkt eingeladen","Skala-Wert","Termin (30–45 Min.) + E-Mail bestätigt","Anti-No-Show gestellt"]'::jsonb,
  $s$KURZ-QUALIFIZIERUNG:
1. Wenn Sie an Wachstum denken: eher Kunden, Bewerber, Sichtbarkeit, Marke, Prozesse — [U]oder alles zusammen[/U]?
2. Was ist aktuell der größte Engpass?
3. Was haben Sie schon probiert — was hat funktioniert, was nicht?
4. Welche Fehler dürfen wir auf keinen Fall wiederholen?
5. Wer müsste bei einer Entscheidung mit im Gespräch sein? [R](wichtig — direkt zum Termin einladen)[/R]
6. Skala 1–10: Wie wichtig ist planbares Wachstum gerade?

WARUM JETZT: Basierend auf dem, was Sie sagen, sehe ich [U]genug Ansatzpunkte[/U], dass sich ein kurzes Gespräch lohnt — wir prüfen gemeinsam, welche Hebel bei Ihnen wirklich Sinn ergeben.

WENN „SCHICKEN SIE ERST INFOS": Kann ich machen — nur bringt eine allgemeine Mail wenig, weil das Zusammenspiel [U]an Ihrem Beispiel[/U] entscheidend ist. [J]Lassen Sie uns den Termin direkt festmachen — eher morgen oder übermorgen?[/J]

TERMIN [R](30–45 Min. wegen größerem Scope)[/R]: [J]Passt eher Anfang oder Ende nächster Woche?[/J] … [J]Vormittags oder nachmittags?[/J] … [Tag 1] um [Uhrzeit 1] oder [Tag 2] um [Uhrzeit 2]. [J]Was passt besser?[/J]

BESTÄTIGUNG + ANTI-NO-SHOW: Die Bestätigung sende ich an [E-Mail], richtig? Wen von den Entscheidern holen wir direkt mit dazu?
[G]Und ehrlich, aus Erfahrung: relevant genug, dass wir uns die Zeit sauber nehmen — oder eher ein Höflichkeitstermin?[/G]
Perfekt, dann bis [Tag 1] um [Uhrzeit 1].$s$
where not exists (select 1 from public.scripts where title = 'HK ▸ Wachstumssystem — Setter');

insert into public.scripts
  (role, entry_angle, situation, title, script_type, status, is_active, version,
   call_goal, tone_guidance, positioning, method_name,
   opening_line, relevance_line, core_question, mechanism, transition_line,
   qualifying_questions_json, required_notes_json, full_script)
select 'Closer','Komplettangebot','call_start','HK ▸ Wachstumssystem — Closer','master','approved',true,1,
  'System-Analyse → der eine blockierende Hebel → Roadmap in Stufen → Preis → Abschluss. (Gründer-Level)',
  'Groß denken, klein starten: Roadmap in Stufen, Start beim größten Hebel. Nach dem Preis still sein.',
  'Preis-Logik: Bedarf → Aufwand → Preis, für den ersten sinnvollen Umfang. Recruiting/Ads bei Bedarf später.',
  'HK Growth System',
  'Kurz vorweg: kein Verkaufsgespräch. Ich schaue mir das Zusammenspiel Ihrer Kanäle an und zeige ehrlich, wo es gerade am meisten blockiert. Passt das?',
  'Was haben Sie in den letzten 12 Monaten in Einzelmaßnahmen gesteckt, ohne dass ein System daraus wurde? Plus das Wachstum, das ohne planbaren Anfragefluss liegen bleibt.',
  'Wo wollen Sie in 12 Monaten stehen — und was müsste an Anfragen/Umsatz passieren, damit das aufgeht? Wo hakt es aktuell am meisten?',
  'Der Trichter (5 Stufen): 1. Positionierung (Fundament) · 2. Sichtbarkeit (Content/Social) · 3. Conversion (Website) · 4. Nachfrage (Reichweite/Ads) · 5. Nachverfolgung (CRM + Automationen). Die fünf müssen als EIN System laufen — deshalb ziehen Einzelmaßnahmen nicht. Durchgängiges Tracking + KI in jeder Stufe.',
  'Den Preis nenne ich erst jetzt, wo Bedarf und Roadmap stehen. Für den ersten sinnvollen Umfang liegen wir bei [Preis]. — Wenn es passt: Wir starten [Datum] mit [Stufe 1], in [X] Wochen sehen Sie die ersten Ergebnisse. Machen wir es so?',
  '["Wo wollen Sie in 12 Monaten stehen?","Was müsste an Anfragen/Umsatz passieren?","Wo hakt es am meisten?","Was wurde in 12 Monaten in Einzelmaßnahmen investiert (Anker)?"]'::jsonb,
  '["Der eine blockierende Hebel","Roadmap-Stufen","Anker-Zahl","Erster Umfang + Preis","Startdatum + Stufe 1"]'::jsonb,
  $s$REFRAME: [G]Kurz vorweg: kein Verkaufsgespräch. Ich schaue mir das Zusammenspiel Ihrer Kanäle an und zeige ehrlich, wo es gerade am meisten blockiert.[/G] Passt das? [R](bestätigen lassen)[/R]

KONTEXT: Wo wollen Sie in 12 Monaten stehen — und was müsste an Anfragen/Umsatz passieren, damit das aufgeht? Wo hakt es aktuell am meisten?

ANALYSE — DER TRICHTER (5 STUFEN):
1. [U]Positionierung[/U] (Fundament): klar, warum Sie — sonst wirkt alles darüber schwächer.
2. [U]Sichtbarkeit:[/U] Content/Social bringt die richtigen Leute in den Trichter.
3. [U]Conversion:[/U] die Website macht aus Aufmerksamkeit Anfragen.
4. [U]Nachfrage:[/U] gezielte Reichweite/Ads füllen planbar nach.
5. [U]Nachverfolgung:[/U] CRM + Automationen — kein Lead geht verloren.
Der Punkt: Diese fünf müssen als [U]ein System[/U] laufen — deshalb ziehen Einzelmaßnahmen nicht. Bei Ihnen blockiert aktuell vor allem [der eine Hebel].

MODERNE TOOLS: Durchgängiges Tracking von der ersten Sichtbarkeit bis zur Anfrage, KI in jeder Stufe — Sie sehen [U]schwarz auf weiß[/U], welcher Euro welche Anfrage bringt.

LÜCKE RECHNEN [R](Anker VOR dem Preis)[/R]: Was haben Sie in den letzten 12 Monaten in Einzelmaßnahmen gesteckt, ohne dass ein System daraus wurde? Plus das Wachstum, das ohne planbaren Anfragefluss liegen bleibt → [große Zahl].

LÖSUNG — ROADMAP IN STUFEN: Stufe 1: [größter Hebel], dann [nächste Bausteine] — bei Bedarf später Recruiting oder Ads. Wir starten dort, wo [U]am schnellsten Wirkung[/U] entsteht.

PREIS: [G]Den Preis nenne ich erst jetzt, wo Bedarf und Roadmap stehen.[/G] Für den ersten sinnvollen Umfang liegen wir bei [Preis]. [R](dann still sein)[/R]

ABSCHLUSS: [J]Wenn es passt: Wir starten [Datum] mit [Stufe 1] — in [X] Wochen sehen Sie die ersten Ergebnisse. Machen wir es so?[/J]$s$
where not exists (select 1 from public.scripts where title = 'HK ▸ Wachstumssystem — Closer');

-- ── 3) Geteilte Bausteine → objection_library ────────────────
-- Gatekeeper (Opener), Erstkontakt-Einwände (Opener), Closer-Einwände, Follow-up.
insert into public.objection_library (key, role, entry_angle, objection_label, response, psychology_note, sort_order, is_active)
select * from (values
  -- Gatekeeper (Opener)
  ('gk_direkt','Opener',null,'Gatekeeper: Direkter Einstieg','Hallo, [ICH] von HK Growth. Verbinden Sie mich einmal bitte direkt mit Herrn/Frau [Name]. Dankeschön.','Selbstverständlichkeit signalisieren — keine Rechtfertigung.',10,true),
  ('gk_worum','Opener',null,'Gatekeeper: „Worum geht es?"','Es geht um die digitale Außenwirkung und darum, wie Ihr Unternehmen online von Kunden oder Bewerbern wahrgenommen wird. Wenn Sie mich direkt durchstellen, erkläre ich es kurz persönlich — ich bleibe in der Leitung. Dankeschön.','Thema groß genug für den Chef, zu spezifisch für den Gatekeeper.',11,true),
  ('gk_nichtda','Opener',null,'Gatekeeper: Entscheider nicht da','Ach, Herr/Frau [Name] ist gerade nicht im Haus. Wann erreiche ich ihn/sie am besten — eher in einer Stunde oder später am Nachmittag?','Alternativfrage statt Rückrufbitte — wir rufen an, nicht umgekehrt.',12,true),
  ('gk_blockt','Opener',null,'Gatekeeper blockt','Ich verstehe. Ich weiß nur nicht, inwieweit ich das mit Ihnen besprechen darf, weil es um die digitale Strategie des Unternehmens geht. Wenn Herr/Frau [Name] wirklich nicht zu sprechen ist, melde ich mich später. Wenn er/sie im Haus ist, stellen Sie mich bitte kurz durch. Dankeschön.','Diskretion als Grund — wertschätzend, aber bestimmt.',13,true),
  ('gk_mail','Opener',null,'Gatekeeper: „Schicken Sie eine E-Mail"','Kann ich machen — nur ist das schwer in einer allgemeinen Mail zu erklären, weil es um konkrete Punkte bei Ihrem Auftritt geht. Richten Sie bitte aus, dass [ICH] von HK Growth angerufen hat, wegen der digitalen Außenwirkung. Meine Nummer: [Nummer].','Mail-Falle vermeiden, Rückruf-Anker setzen.',14,true),
  -- Erstkontakt-Einwände (Opener)
  ('ow_kein_interesse','Opener',null,'„Kein Interesse."','Verstehe ich. Darf ich kurz fragen: Kein Interesse, weil das Thema grundsätzlich nicht relevant ist — oder weil gerade der Zeitpunkt schlecht ist? (Bei Zeitpunkt:) Dann macht ein kurzer Termin mehr Sinn als ein Telefonat zwischen Tür und Angel. 20 Minuten, danach wissen Sie, ob es relevant ist. Passt eher Anfang oder Ende nächster Woche?','Einwand isolieren: grundsätzlich vs. Timing.',20,true),
  ('ow_mail','Opener',null,'„Schicken Sie was per Mail."','Kann ich machen — nur bringt eine allgemeine Mail wenig, weil ich Ihnen ja konkret zeigen wollte, was mir aufgefallen ist. Lassen Sie uns vorher 20 Minuten reinschauen. Eher morgen oder übermorgen?','Mail = höfliches Nein. Termin direkt anbieten.',21,true),
  ('ow_agentur','Opener',null,'„Wir haben schon eine Agentur."','Perfekt, dann sind Grundlagen da. Es geht nicht darum, jemanden zu ersetzen — ich zeige Ihnen, wo aus unserer Sicht noch Potenzial liegt. Wäre es die schlechteste Idee, das einmal 20 Minuten neutral zu prüfen?','Nicht gegen die Agentur — zweiter unabhängiger Blick.',22,true),
  ('ow_social','Opener',null,'„Wir machen schon Social Media."','Sehr gut. Dann ist die Frage nicht ob, sondern ob daraus planbar Vertrauen, Anfragen oder Markenwirkung entsteht. Ich zeige Ihnen, wo Ihr Auftritt gut ist und wo Potenzial liegt.','Von Aktivität auf Ergebnis reframen.',23,true),
  ('ow_budget','Opener',null,'„Aktuell kein Budget."','Verstehe ich. Genau deshalb erst kostenlos prüfen, welcher Hebel Sinn macht, bevor man Geld verbrennt. Der Termin ist kein Verkaufsgespräch — ein kurzer Wachstumscheck.','Kostenlos + kein Verkauf = Budget irrelevant für Schritt 1.',24,true),
  ('ow_zeit','Opener',null,'„Keine Zeit."','Verstehe ich. Genau deshalb erkläre ich jetzt nichts 30 Minuten am Telefon. Fester 20-Minuten-Termin — eher morgen oder übermorgen?','Zeitmangel bestätigt den Terminvorschlag.',25,true),
  ('ow_brauchen_nicht','Opener',null,'„Wir brauchen sowas nicht."','Kann sein — genau das würde ich kurz prüfen. Mein Eindruck: Ihr Unternehmen wirkt fachlich stärker, als es online sichtbar wird. Wenn ich falsch liege, haben Sie nach 20 Minuten die Gewissheit.','Prüfen statt diskutieren — Gewissheits-Angebot.',26,true),
  -- Closer-Einwände
  ('cl_zu_teuer','Closer',null,'„Zu teuer."','Verstehe ich. Verglichen womit — mit dem Preis, oder mit dem, was Sie die aktuelle Situation jeden Monat kostet? Genau das haben wir ja gerade ausgerechnet.','Reframe auf Opportunitätskosten (Anker nutzen).',30,true),
  ('cl_ueberlegen','Closer',null,'„Ich muss überlegen."','Völlig legitim. Damit ich Sie richtig unterstütze: Überlegen Sie das Ob oder das Wie? Beim Wie kann ich Ihnen sofort Klarheit geben.','Echten Einwand isolieren, dann gezielt beantworten.',31,true),
  ('cl_partner','Closer',null,'„Ich muss das mit … besprechen."','Absolut richtig. Was wäre für ihn/sie der wichtigste Punkt? Am besten holen wir ihn/sie kurz dazu — wann sitzen Sie beide vor dem Kalender?','Entscheider einbinden statt Botschafter-Prinzip.',32,true),
  ('cl_keine_zeit','Closer',null,'„Keine Zeit für die Umsetzung."','Genau deshalb übernehmen wir das — Ihr Aufwand ist ein kurzes Onboarding, den Rest machen wir.','Zeitmangel ist das Argument FÜR die Zusammenarbeit.',33,true),
  ('cl_verbrannt','Closer',null,'„Wir sind schon mal verbrannt worden (Agentur)."','Und genau deshalb haben wir das anders aufgebaut: Sie haben gesehen, was wir tun würden, bevor Sie einen Euro zahlen. Das Risiko liegt bis hierhin komplett bei uns.','Risiko-Umkehr über die kostenlose Analyse.',34,true),
  ('cl_budget','Closer',null,'„Gerade kein Budget."','Verstehe. Wenn das Budget da wäre — wäre es dann ein Ja? (Wenn ja → Start terminieren/staffeln; wenn nein → echten Einwand suchen.)','Budget-Test trennt Vorwand von echtem Einwand.',35,true),
  ('cl_angebot_mail','Closer',null,'„Schicken Sie mir das Angebot per Mail."','Bekommen Sie schriftlich. Lassen Sie uns nur die offenen Fragen jetzt klären, damit im Angebot nichts steht, was nicht passt. Was ist der eine Punkt, der Sie noch zögern lässt?','Angebot ja — aber offene Punkte sofort klären.',36,true),
  ('cl_garantie','Closer',null,'„Was, wenn es nicht funktioniert?"','Fair. Deshalb starten wir mit dem Baustein, der am schnellsten messbar ist — Sie sehen nach [X] Wochen schwarz auf weiß, ob die Richtung stimmt.','Messbarkeit statt Versprechen.',37,true),
  -- Follow-up / No-Show (alle Rollen → role null)
  ('fu_noshow',null,null,'No-Show: Reaktivierung (gleicher Tag)','Moin Herr/Frau [Name], [ICH] von HK Growth. Wir waren gerade verabredet — ich vermute, bei Ihnen ist etwas dazwischengekommen. (Pause, kein Vorwurf.) Kein Problem. Ich habe Ihre Unterlagen ja schon vorbereitet — die Punkte liegen hier fertig. Passt es stattdessen morgen oder übermorgen? (Zweites No-Show: nicht jagen — Wiedervorlage 4–6 Wochen.)','Hoher Status: vorbereitete Unterlagen statt Vorwurf.',40,true),
  ('fu_wiedervorlage',null,null,'Wiedervorlage: „damals war viel los" (4–8 Wochen)','Moin Herr/Frau [Name], [ICH] von HK Growth. Wir hatten vor ein paar Wochen telefoniert — damals war bei Ihnen einfach viel los. Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, das Thema mit Ihnen zu Ende zu bringen. Inzwischen ist mir bei Ihrem Auftritt noch ein Punkt aufgefallen … (→ zurück in den Opener des Pfeilers).','DAS ist der ehrliche Vorbezug für den nächsten Anlauf.',41,true),
  ('fu_ueberlegen',null,null,'Follow-up nach „muss überlegen" (2–3 Tage)','Moin Herr/Frau [Name], [ICH] hier. Sie wollten das noch durchdenken — ich halte Wort und melde mich wie besprochen. Wo stehen Sie — eher beim Ob oder schon beim Wie? (Dann gezielt den einen Punkt lösen, nicht neu pitchen.)','Wort halten = Vertrauen. Einwand isolieren, nicht neu pitchen.',42,true)
) as v(key, role, entry_angle, objection_label, response, psychology_note, sort_order, is_active)
where not exists (select 1 from public.objection_library ol where ol.key = v.key);
