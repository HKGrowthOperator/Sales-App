-- ============================================================
-- 020 — DER HK-OPENER-STANDARD (Vorlage: Nicks KI-Skript, wörtlich)
-- ------------------------------------------------------------
-- Regel: Der von HK gelieferte Text ist eingefroren. Diese Migration
-- legt NUR Farb-/Tonalitäts-Markierungen über den Text und ergänzt
-- die Einwandbehandlung. Kein Satz wurde umformuliert.
-- Einzige technische Anpassungen: Platzhalter vereinheitlicht
-- ([Name], [ICH], [E-Mail], [Datum], [Uhrzeit]) + reine Tippfehler.
-- Website & Social nutzen exakt dasselbe Skelett — getauscht sind nur:
-- Vorbezug-Thema · Proof-Satz · Methodenname · Mechanismus-Absatz ·
-- die 3 Vorbereitungs-Fragen.
-- Setter/Closer werden NICHT angefasst. Keine weiteren Skript-
-- Migrationen ohne expliziten HK-Auftrag.
-- ============================================================

-- ╔═══════════ 🤖 KI-AUTOMATION — DER STANDARD (wörtlich) ═══════════╗
update public.scripts set
  method_name = 'Automation Framework',
  opening_line = 'Moin/Servus/Hallo Herr/Frau [Name], [ICH] hier. Wir haben vor knapp 2 Monaten schon einmal wegen Automationen und Prozessen miteinander gesprochen — damals war zu dem Zeitpunkt einfach ein bisschen zu viel los. Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, Sie als Kunden zu gewinnen. (lachen) also natürlich nicht genau heute.',
  qualifying_questions_json = '["Wie wichtig ist Ihnen das Thema Zeit- und Umsatz-Optimierung von einer Skala von 1 bis 10?","Wie viele immer wiederholende Prozesse haben Sie aktuell in Ihrem Unternehmen?","Wie viele von diesen Prozessen und Automationen haben Sie gerade integriert, die Ihrem Unternehmen aktuell Zeit und Geld einbringen?","Abgesehen von tatsächlichen Einsparungen und transparentem Prozess — was ist Ihnen da noch besonders wichtig? Bzw. welche Fehler haben andere schon gemacht, die wir auf gar keinen Fall wiederholen dürfen?","Wie viele Mitarbeiter beschäftigen Sie momentan? (für passende Referenzen)"]'::jsonb,
  full_script = $s$[G]Moin/Servus/Hallo Herr/Frau [Name], [ICH] hier. Wir haben vor knapp 2 Monaten schon einmal wegen Automationen und Prozessen miteinander gesprochen[/G] — damals war zu dem Zeitpunkt einfach ein bisschen zu viel los. Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, [U]Sie als Kunden zu gewinnen[/U].
[R](lachen)[/R] also natürlich nicht genau heute. Aber ich hab mir Ihren Betrieb noch einmal ganz genau angeschaut und [G]mir sind da zwei, drei Parallelen zu einem unserer Kunden aufgefallen, der mit uns in den letzten 4 Wochen [U]80 Stunden im Monat[/U] einsparen konnte.[/G] [R](kurze Pause — Zahl wirken lassen)[/R]

[J]Deshalb meine Frage an Sie: Haben Sie schon einmal etwas von dem Automation Framework gehört?[/J] [R](still sein — antworten lassen)[/R]

[R]„Wie? Brauchen wir nicht." → EINWANDBEHANDLUNG (unten), dann zurück zum Script. / Bei „ja" oder „nein, was ist das?" → weiter:[/R]

Wir haben eine Möglichkeit entwickelt, die es noch gar nicht so lange auf dem Markt gibt.
Viele Unternehmen bekommen Anfragen, aber dann fehlt ein sauberes System für Nachverfolgung, Terminierung, Angebote, Rechnungen oder Wiedervorlage. [U]Da bleibt viel Umsatz liegen, ohne dass man es merkt.[/U]
Typischerweise merken wir immer wieder bei Kunden, dass Anfragen liegen bleiben oder untergehen.

[J]Wäre es die absolut schlechteste Idee, wenn ich Ihnen in einer kostenlosen Wachstumsanalyse einmal genau aufzeige, wie wir das geschafft haben, und wir einmal gemeinsam prüfen, ob es auch für Sie relevant ist und funktionieren würde?[/J]

[R](dazwischen kommt ja oder nein — zum Termin legen oder weiter per Script)[/R]

[R]wenn ja: versuchen, den Termin auf MORGEN zu legen[/R]
[J]Wann passt es Ihnen besser? Eher um 12 oder um 15 Uhr?[/J]
[J]Dann eher vormittags oder nachmittags?[/J]

Ich hab noch 2 bis 3 Fragen an Sie, damit wir uns bestmöglich auf unseren Termin morgen vorbereiten können:
[J]Wie wichtig ist Ihnen das Thema Zeit- und Umsatz-Optimierung von einer Skala von 1 bis 10?[/J]
Und wie viele immer wiederholende Prozesse haben Sie aktuell in Ihrem Unternehmen?
Und wie viele von diesen sogenannten Prozessen und Automationen haben Sie gerade in Ihrem Unternehmen integriert, die Ihrem Unternehmen aktuell Zeit und Geld einbringen?

[G]Damit das Folgegespräch für Sie auch wirklich Sinn ergibt und Sie nicht Ihre Zeit verschwenden, gestatten Sie mir eine kurze Frage:[/G]
Abgesehen von tatsächlichen Einsparungen und transparentem Prozess — was ist Ihnen da noch besonders wichtig? Beziehungsweise: Welche Fehler haben andere schon gemacht, die wir auf gar keinen Fall wiederholen dürfen?

Damit ich Ihnen auch weitere passende Referenzen in unserem Folgegespräch mitbringen kann: Wie viele Mitarbeiter beschäftigen Sie momentan?

[G]Okay, basierend auf dem, was Sie mir gesagt haben, kann ich Ihnen versichern, dass es nichts ist, was ich so noch nicht gehört/gesehen habe.[/G] Damit ich Ihnen das Ganze einmal konkret an einem Beispiel aufzeigen kann und [U]schwarz auf weiß[/U] beweisen kann, müssen wir uns noch einmal ganz genau anschauen, was Ihre Konkurrenten gerade so treiben.

Schauen Sie mal ganz kurz bitte in Ihren Kalender, wann es nächste Woche passt:
[J]Eher Anfang oder eher Ende der Woche?[/J]

Alles klar.
Die Bestätigung für den Termin sende ich dann an [E-Mail], richtig?

Perfekt.

Zwei letzte Fragen habe ich allerdings noch.
Die erste Frage entsteht aus der Erfahrung heraus: Gibt es irgendjemanden in Ihrem Unternehmen, den Sie zum Folgegespräch hinzuziehen würden? Einen Prokuristen, einen Personalleiter oder Ihre Ehefrau, Ihre Mutter oder irgendwen anders?

[G]Abschließend — ich will das auch nicht verallgemeinern, es ist mittlerweile einfach eine Routinefrage geworden: Für mich ist einfach nur wichtig, dass es kein Mitleidstermin ist, den Geschäftsführer nur machen, um einen fleißigen Vertriebler wie mich abzuwimmeln.[/G] [R](mit einem Lächeln — bestätigen lassen)[/R]

Sehr schön, dann bis zum [Datum] um [Uhrzeit].

Wir freuen uns auf Sie und ich bedanke mich recht herzlich im Namen der HK Growth.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EINWANDBEHANDLUNG [R](kurz kontern → immer zurück zum Script)[/R]
„Brauchen wir nicht." → Verstehe ich — die meisten sagen das, bevor sie gesehen haben, was heute überhaupt möglich ist. Genau deshalb zeige ich es Ihnen ja einmal [U]kostenlos[/U]. Wenn nichts Relevantes dabei ist, haben Sie 20 Minuten investiert, mehr nicht. [R](→ zurück zum Script: Mechanismus)[/R]
„Kein Interesse." → Darf ich kurz fragen: kein Interesse, weil das Thema grundsätzlich nicht relevant ist — oder weil gerade der Zeitpunkt schlecht ist? [R](Zeitpunkt → direkt Termin morgen anbieten)[/R]
„Keine Zeit." → Genau [U]deshalb[/U] rufe ich an — das Thema ist Zeit. 20 Minuten fest statt zwischen Tür und Angel: [J]morgen 12 oder 15 Uhr?[/J]
„Schicken Sie mir was per Mail." → Mache ich gern — nur zeigt eine Mail nicht, was [U]bei Ihnen konkret[/U] auffällt. Lassen Sie uns die 20 Minuten direkt festmachen, die Bestätigung kommt sofort per Mail. [R](→ Termin)[/R]
„Wir haben schon jemanden / unsere IT macht das." → Perfekt, dann sind Grundlagen da. Ein zweiter, neutraler Blick kostet nichts — und Ihre IT behält die Hoheit. [R](→ Negative Close wiederholen)[/R]
„Was kostet das?" → Die Analyse? [U]Nichts.[/U] Alles Weitere hängt davon ab, was bei Ihnen überhaupt sinnvoll ist — genau das klären wir im Termin.$s$
where title = 'HK ▸ KI-Automation — Opener';

-- ╔═══════════ 🌐 WEBSITE — dasselbe Skelett, nur Produkt-Slots getauscht ═══════════╗
update public.scripts set
  method_name = 'Conversion Framework',
  opening_line = 'Moin/Servus/Hallo Herr/Frau [Name], [ICH] hier. Wir haben vor knapp 2 Monaten schon einmal wegen Ihrer Website und Online-Präsenz miteinander gesprochen — damals war zu dem Zeitpunkt einfach ein bisschen zu viel los. Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, Sie als Kunden zu gewinnen. (lachen) also natürlich nicht genau heute.',
  qualifying_questions_json = '["Wie wichtig ist Ihnen das Thema Sichtbarkeit und Anfragen über die Website von einer Skala von 1 bis 10?","Wie viele Anfragen bekommen Sie aktuell über Ihre Website oder Google?","Wann wurde Ihre Website zuletzt wirklich strategisch überarbeitet — nicht nur optisch?","Abgesehen von mehr Anfragen und einem transparenten Prozess — was ist Ihnen da noch besonders wichtig? Bzw. welche Fehler haben andere schon gemacht, die wir auf gar keinen Fall wiederholen dürfen?","Wie viele Mitarbeiter beschäftigen Sie momentan? (für passende Referenzen)"]'::jsonb,
  full_script = $s$[G]Moin/Servus/Hallo Herr/Frau [Name], [ICH] hier. Wir haben vor knapp 2 Monaten schon einmal wegen Ihrer Website und Online-Präsenz miteinander gesprochen[/G] — damals war zu dem Zeitpunkt einfach ein bisschen zu viel los. Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, [U]Sie als Kunden zu gewinnen[/U].
[R](lachen)[/R] also natürlich nicht genau heute. Aber ich hab mir Ihren Betrieb noch einmal ganz genau angeschaut und [G]mir sind da zwei, drei Parallelen zu einem unserer Kunden aufgefallen, der mit uns in den letzten 4 Wochen [U][Zahl] qualifizierte Anfragen[/U] über seine neue Website gewinnen konnte.[/G] [R](kurze Pause — Zahl wirken lassen; nur echte Zahl nennen)[/R]

[J]Deshalb meine Frage an Sie: Haben Sie schon einmal etwas von dem Conversion Framework gehört?[/J] [R](still sein — antworten lassen)[/R]

[R]„Wie? Brauchen wir nicht." → EINWANDBEHANDLUNG (unten), dann zurück zum Script. / Bei „ja" oder „nein, was ist das?" → weiter:[/R]

Wir haben eine Möglichkeit entwickelt, die es noch gar nicht so lange auf dem Markt gibt.
Viele Unternehmen haben eine Website, aber dann fehlt ein sauberer Weg von „Ich suche jemanden" bis „Ich frage an" — die Seite informiert nur, führt aber nicht zur Anfrage. [U]Da bleibt viel Umsatz liegen, ohne dass man es merkt.[/U]
Typischerweise merken wir immer wieder bei Kunden, dass kaufbereite Interessenten abspringen und beim Wettbewerber landen.

[J]Wäre es die absolut schlechteste Idee, wenn ich Ihnen in einer kostenlosen Wachstumsanalyse einmal genau aufzeige, wie wir das geschafft haben, und wir einmal gemeinsam prüfen, ob es auch für Sie relevant ist und funktionieren würde?[/J]

[R](dazwischen kommt ja oder nein — zum Termin legen oder weiter per Script)[/R]

[R]wenn ja: versuchen, den Termin auf MORGEN zu legen[/R]
[J]Wann passt es Ihnen besser? Eher um 12 oder um 15 Uhr?[/J]
[J]Dann eher vormittags oder nachmittags?[/J]

Ich hab noch 2 bis 3 Fragen an Sie, damit wir uns bestmöglich auf unseren Termin morgen vorbereiten können:
[J]Wie wichtig ist Ihnen das Thema Sichtbarkeit und Anfragen über die Website von einer Skala von 1 bis 10?[/J]
Und wie viele Anfragen bekommen Sie aktuell über Ihre Website oder Google?
Und wann wurde Ihre Website zuletzt wirklich strategisch überarbeitet — also nicht nur optisch?

[G]Damit das Folgegespräch für Sie auch wirklich Sinn ergibt und Sie nicht Ihre Zeit verschwenden, gestatten Sie mir eine kurze Frage:[/G]
Abgesehen von mehr Anfragen und einem transparenten Prozess — was ist Ihnen da noch besonders wichtig? Beziehungsweise: Welche Fehler haben andere schon gemacht, die wir auf gar keinen Fall wiederholen dürfen?

Damit ich Ihnen auch weitere passende Referenzen in unserem Folgegespräch mitbringen kann: Wie viele Mitarbeiter beschäftigen Sie momentan?

[G]Okay, basierend auf dem, was Sie mir gesagt haben, kann ich Ihnen versichern, dass es nichts ist, was ich so noch nicht gehört/gesehen habe.[/G] Damit ich Ihnen das Ganze einmal konkret an einem Beispiel aufzeigen kann und [U]schwarz auf weiß[/U] beweisen kann, müssen wir uns noch einmal ganz genau anschauen, was Ihre Konkurrenten gerade so treiben.

Schauen Sie mal ganz kurz bitte in Ihren Kalender, wann es nächste Woche passt:
[J]Eher Anfang oder eher Ende der Woche?[/J]

Alles klar.
Die Bestätigung für den Termin sende ich dann an [E-Mail], richtig?

Perfekt.

Zwei letzte Fragen habe ich allerdings noch.
Die erste Frage entsteht aus der Erfahrung heraus: Gibt es irgendjemanden in Ihrem Unternehmen, den Sie zum Folgegespräch hinzuziehen würden? Einen Prokuristen, einen Personalleiter oder Ihre Ehefrau, Ihre Mutter oder irgendwen anders?

[G]Abschließend — ich will das auch nicht verallgemeinern, es ist mittlerweile einfach eine Routinefrage geworden: Für mich ist einfach nur wichtig, dass es kein Mitleidstermin ist, den Geschäftsführer nur machen, um einen fleißigen Vertriebler wie mich abzuwimmeln.[/G] [R](mit einem Lächeln — bestätigen lassen)[/R]

Sehr schön, dann bis zum [Datum] um [Uhrzeit].

Wir freuen uns auf Sie und ich bedanke mich recht herzlich im Namen der HK Growth.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EINWANDBEHANDLUNG [R](kurz kontern → immer zurück zum Script)[/R]
„Brauchen wir nicht / haben schon eine Website." → Davon gehe ich aus — die Frage ist nicht, [U]ob[/U] Sie eine haben, sondern ob sie genug Anfragen bringt. Genau das zeige ich Ihnen einmal [U]kostenlos[/U]. [R](→ zurück zum Script: Mechanismus)[/R]
„Kein Interesse." → Darf ich kurz fragen: grundsätzlich nicht relevant — oder gerade schlechter Zeitpunkt? [R](Zeitpunkt → direkt Termin morgen anbieten)[/R]
„Keine Zeit." → Genau deshalb 20 Minuten fest statt zwischen Tür und Angel: [J]morgen 12 oder 15 Uhr?[/J]
„Schicken Sie mir was per Mail." → Mache ich gern — nur zeigt eine Mail nicht, was [U]bei Ihrer Seite konkret[/U] auffällt. [R](→ Termin)[/R]
„Wir haben schon eine Agentur." → Perfekt, dann sind Grundlagen da. Ein zweiter, neutraler Blick kostet nichts. [R](→ Negative Close wiederholen)[/R]
„Was kostet das?" → Die Analyse? [U]Nichts.[/U] Alles Weitere hängt davon ab, was bei Ihnen überhaupt sinnvoll ist — genau das klären wir im Termin.$s$
where title = 'HK ▸ Website — Opener';

-- ╔═══════════ 📣 SOCIAL & BRANDING — dasselbe Skelett, nur Produkt-Slots getauscht ═══════════╗
update public.scripts set
  method_name = 'Regionale Marken-Dominanz',
  opening_line = 'Moin/Servus/Hallo Herr/Frau [Name], [ICH] hier. Wir haben vor knapp 2 Monaten schon einmal wegen Ihrer Außenwirkung und Social Media miteinander gesprochen — damals war zu dem Zeitpunkt einfach ein bisschen zu viel los. Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, Sie als Kunden zu gewinnen. (lachen) also natürlich nicht genau heute.',
  qualifying_questions_json = '["Wie wichtig ist es Ihnen von einer Skala von 1 bis 10, in Ihrer Region als die klar vertrauenswürdigere Wahl gesehen zu werden?","Wenn ein Kunde Sie und zwei Wettbewerber online vergleicht: Wird sofort klar, warum ausgerechnet Sie?","Bauen Kunden eher wegen der Firma Vertrauen auf — oder auch wegen Ihnen als Person?","Abgesehen von einem hochwertigeren Auftritt und einem transparenten Prozess — was ist Ihnen da noch besonders wichtig? Bzw. welche Fehler haben andere schon gemacht, die wir auf gar keinen Fall wiederholen dürfen?","Wie viele Mitarbeiter beschäftigen Sie momentan? (für passende Referenzen)"]'::jsonb,
  full_script = $s$[G]Moin/Servus/Hallo Herr/Frau [Name], [ICH] hier. Wir haben vor knapp 2 Monaten schon einmal wegen Ihrer Außenwirkung und Social Media miteinander gesprochen[/G] — damals war zu dem Zeitpunkt einfach ein bisschen zu viel los. Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, [U]Sie als Kunden zu gewinnen[/U].
[R](lachen)[/R] also natürlich nicht genau heute. Aber ich hab mir Ihren Betrieb noch einmal ganz genau angeschaut und [G]mir sind da zwei, drei Parallelen zu einem unserer Kunden aufgefallen, der mit uns in den letzten 4 Wochen [U][Zahl] hochwertige Anfragen[/U] über seinen neuen Auftritt gewinnen konnte — statt Preisvergleicher.[/G] [R](kurze Pause — Zahl wirken lassen; nur echte Zahl nennen)[/R]

[J]Deshalb meine Frage an Sie: Haben Sie schon einmal etwas von regionaler Marken-Dominanz gehört?[/J] [R](still sein — antworten lassen)[/R]

[R]„Wie? Brauchen wir nicht." → EINWANDBEHANDLUNG (unten), dann zurück zum Script. / Bei „ja" oder „nein, was ist das?" → weiter:[/R]

Wir haben eine Möglichkeit entwickelt, die es noch gar nicht so lange auf dem Markt gibt.
Viele Unternehmen sind fachlich richtig gut, aber online wirken sie verwechselbar — und verglichen wird heute, [U]bevor[/U] überhaupt angerufen wird. Wenn der Unterschied nach außen nicht klar ist, entscheidet der Kunde über den Preis. [U]Da bleibt viel Umsatz liegen, ohne dass man es merkt.[/U]
Typischerweise merken wir immer wieder bei Kunden, dass die richtig guten Anfragen beim Anbieter landen, der nach außen professioneller wirkt.

[J]Wäre es die absolut schlechteste Idee, wenn ich Ihnen in einer kostenlosen Wachstumsanalyse einmal genau aufzeige, wie wir das geschafft haben, und wir einmal gemeinsam prüfen, ob es auch für Sie relevant ist und funktionieren würde?[/J]

[R](dazwischen kommt ja oder nein — zum Termin legen oder weiter per Script)[/R]

[R]wenn ja: versuchen, den Termin auf MORGEN zu legen[/R]
[J]Wann passt es Ihnen besser? Eher um 12 oder um 15 Uhr?[/J]
[J]Dann eher vormittags oder nachmittags?[/J]

Ich hab noch 2 bis 3 Fragen an Sie, damit wir uns bestmöglich auf unseren Termin morgen vorbereiten können:
[J]Wie wichtig ist es Ihnen von einer Skala von 1 bis 10, in Ihrer Region als die klar vertrauenswürdigere Wahl gesehen zu werden?[/J]
Und wenn ein Kunde Sie und zwei Wettbewerber online vergleicht: Wird sofort klar, warum ausgerechnet Sie?
Und bauen Kunden eher wegen der Firma Vertrauen auf — oder auch wegen Ihnen als Person? [R](Gabelung notieren: Firmen- oder Personal-Branding)[/R]

[G]Damit das Folgegespräch für Sie auch wirklich Sinn ergibt und Sie nicht Ihre Zeit verschwenden, gestatten Sie mir eine kurze Frage:[/G]
Abgesehen von einem hochwertigeren Auftritt und einem transparenten Prozess — was ist Ihnen da noch besonders wichtig? Beziehungsweise: Welche Fehler haben andere schon gemacht, die wir auf gar keinen Fall wiederholen dürfen?

Damit ich Ihnen auch weitere passende Referenzen in unserem Folgegespräch mitbringen kann: Wie viele Mitarbeiter beschäftigen Sie momentan?

[G]Okay, basierend auf dem, was Sie mir gesagt haben, kann ich Ihnen versichern, dass es nichts ist, was ich so noch nicht gehört/gesehen habe.[/G] Damit ich Ihnen das Ganze einmal konkret an einem Beispiel aufzeigen kann und [U]schwarz auf weiß[/U] beweisen kann, müssen wir uns noch einmal ganz genau anschauen, was Ihre Konkurrenten gerade so treiben.

Schauen Sie mal ganz kurz bitte in Ihren Kalender, wann es nächste Woche passt:
[J]Eher Anfang oder eher Ende der Woche?[/J]

Alles klar.
Die Bestätigung für den Termin sende ich dann an [E-Mail], richtig?

Perfekt.

Zwei letzte Fragen habe ich allerdings noch.
Die erste Frage entsteht aus der Erfahrung heraus: Gibt es irgendjemanden in Ihrem Unternehmen, den Sie zum Folgegespräch hinzuziehen würden? Einen Prokuristen, einen Personalleiter oder Ihre Ehefrau, Ihre Mutter oder irgendwen anders?

[G]Abschließend — ich will das auch nicht verallgemeinern, es ist mittlerweile einfach eine Routinefrage geworden: Für mich ist einfach nur wichtig, dass es kein Mitleidstermin ist, den Geschäftsführer nur machen, um einen fleißigen Vertriebler wie mich abzuwimmeln.[/G] [R](mit einem Lächeln — bestätigen lassen)[/R]

Sehr schön, dann bis zum [Datum] um [Uhrzeit].

Wir freuen uns auf Sie und ich bedanke mich recht herzlich im Namen der HK Growth.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EINWANDBEHANDLUNG [R](kurz kontern → immer zurück zum Script)[/R]
„Brauchen wir kein Branding." → Verstehe ich — es geht auch nicht um Logo oder Farben. Es geht darum: Wenn ein Kunde Sie und zwei Wettbewerber vergleicht — gewinnt Ihr Auftritt sofort Vertrauen, oder wirken alle ähnlich? Genau das zeige ich Ihnen einmal [U]kostenlos[/U]. [R](→ zurück zum Script: Mechanismus)[/R]
„Wir bekommen genug Anfragen." → Sehr gut — dann ist die Frage nicht ob, sondern welche [U]Qualität[/U]: Preisvergleicher oder Wunschkunden? [R](→ Negative Close)[/R]
„Unsere Kunden kommen über Empfehlung." → Perfekt — dann ist der Auftritt noch wichtiger: Empfehlung → googeln → in Sekunden entscheidet sich, ob das Vertrauen bestätigt wird. [R](→ Negative Close)[/R]
„Kein Interesse." → Grundsätzlich nicht relevant — oder gerade schlechter Zeitpunkt? [R](Zeitpunkt → Termin morgen anbieten)[/R]
„Keine Zeit." → Genau deshalb 20 Minuten fest statt zwischen Tür und Angel: [J]morgen 12 oder 15 Uhr?[/J]
„Schicken Sie mir was per Mail." → Mache ich gern — nur zeigt eine Mail nicht, was [U]bei Ihrem Auftritt konkret[/U] auffällt. [R](→ Termin)[/R]
„Was kostet das?" → Die Analyse? [U]Nichts.[/U] Alles Weitere klären wir im Termin.$s$
where title = 'HK ▸ Social & Branding — Opener';
