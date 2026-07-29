-- ============================================================
-- 019 — HK-Stimme (Gold-Template von Nick) für alle 9 Skripte
-- ------------------------------------------------------------
-- Vorlage: das von HK gelieferte KI-Automation-Skript. Übernommen:
--  · Gruß „Moin/Servus/Hallo Herr/Frau [Name], [ICH] hier." (kein
--    Firmenname am Anfang; Firmenname nur in der Verabschiedung)
--  · Pfeiler-spezifischer Vorbezug („…wegen Automationen und Prozessen…")
--  · Konkreter Proof mit echter Zahl (KI: 80 Std./Monat) + weiche Form
--  · Methodenname als „Framework" (KI: Automation Framework)
--  · Inline-Einwandbehandlung direkt nach der Methodenfrage
--  · Mechanismus „…die es so noch gar nicht lange auf dem Markt gibt"
--  · Negative Close mit „kostenloser Wachstumsanalyse"
--  · Termin MÖGLICHST AUF MORGEN, feste Zeiten (12/15 Uhr), sonst nächste Woche
--  · Qualifizierung als Vorbereitung aufs Gespräch gerahmt
--  · Zusammenfassen + Konkurrenz-Blick
--  · Weitere Entscheider (Prokurist/Personalleiter/Ehefrau/Mutter…)
--  · Anti-No-Show charmant („kein Mitleidstermin … fleißigen Vertriebler
--    wie mich abzuwimmeln")
--  · Verabschiedung „…im Namen von HK Growth"
--  · Tonalitäts-Beispielsätze + Kurzversion
-- Farbcode: [G]=Schlüsselsatz · [J]=Ja-Trigger · [R]=Regie/Ton · [U]=betonen
-- ============================================================

-- ╔══════════════════ 🤖 KI-INTEGRATION ══════════════════╗
update public.scripts set
  method_name = 'Automation Framework',
  opening_line = 'Moin / Servus / Hallo Herr/Frau [Name], [ICH] hier. Wir haben vor knapp zwei Monaten schon einmal wegen Automationen und Prozessen miteinander gesprochen — damals war zu dem Zeitpunkt einfach ein bisschen zu viel los. Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, Sie als Kunden zu gewinnen. (lachen) — also natürlich nicht genau heute.',
  full_script = $s$EINSTIEG [R](fester Gruß — kein Firmenname am Anfang)[/R]
[G]Moin / Servus / Hallo Herr/Frau [Name], [ICH] hier.[/G]
[G]Wir haben vor knapp zwei Monaten schon einmal wegen Automationen und Prozessen miteinander gesprochen — damals war zu dem Zeitpunkt einfach ein bisschen zu viel los.[/G]
[R](Vorbezug nur, wenn wahr — sonst: „Ich hatte mir Ihren Betrieb notiert, weil mir Ihre Abläufe aufgefallen sind.")[/R]

AGENDA
Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, [U]Sie als Kunden zu gewinnen[/U]. [R](lachen)[/R] — also natürlich nicht genau heute. Aber ich hab mir Ihren Betrieb noch einmal ganz genau angeschaut.

PROOF [R](echte Zahl schlägt jedes Versprechen — sonst die weiche Form darunter)[/R]
[G]Und mir sind da zwei, drei Parallelen zu einem unserer Kunden aufgefallen, der mit uns in den letzten vier Wochen [U]80 Stunden im Monat[/U] einsparen konnte.[/G] [R](kurze Pause — Zahl wirken lassen)[/R]
[R](Weiche Form ohne belegbare Zahl: „…bei dem vorher gute Anfragen einfach liegen geblieben sind — und heute läuft die komplette Nachverfolgung automatisch.")[/R]

METHODENFRAGE
[J]Deshalb meine Frage an Sie: Haben Sie schon einmal etwas von dem Automation Framework gehört?[/J] [R](STILL SEIN — antworten lassen)[/R]

WENN „BRAUCHEN WIR NICHT" [R](Einwand → kurz kontern → zurück ins Script)[/R]
Verstehe ich — die meisten sagen das, bevor sie gesehen haben, was heute überhaupt möglich ist. Genau deshalb zeige ich es Ihnen ja einmal kostenlos und unverbindlich. Wenn nichts Relevantes dabei ist, haben Sie 20 Minuten investiert, mehr nicht. [R](→ weiter zum Mechanismus / Negative Close)[/R]

WENN „JA / WAS IST DAS?" → MECHANISMUS
Wir haben eine Möglichkeit entwickelt, die es so noch gar nicht lange auf dem Markt gibt. Viele Unternehmen bekommen Anfragen — aber dann fehlt ein sauberes System für Nachverfolgung, Terminierung, Angebote, Rechnungen oder Wiedervorlage. [U]Da bleibt viel Umsatz liegen, ohne dass man es merkt.[/U] Typischerweise merken wir bei Kunden immer wieder, dass Anfragen liegen bleiben oder untergehen.

NEGATIVE CLOSE
[J]Wäre es die absolut schlechteste Idee, wenn ich Ihnen in einer kostenlosen Wachstumsanalyse einmal genau aufzeige, wie wir das geschafft haben — und wir gemeinsam prüfen, ob es auch für Sie relevant ist und funktionieren würde?[/J]

[R](→ Jetzt kommt Ja/Nein zum Termin. JA → weiter im Setter-Skript, Termin möglichst auf morgen. NEIN/Einwand → Einwandbehandlung (Panel), dann zurück.)[/R]

WEITERE EINWÄNDE IM OPENER [R](Kurzform — volle Antworten im Einwand-Panel)[/R]
„Kein Interesse." → Grundsätzlich nicht relevant, oder gerade schlechter Zeitpunkt? [R](isolieren, dann Termin)[/R]
„Haben schon jemanden / eine Agentur." → Perfekt, dann sind Grundlagen da — ein zweiter, neutraler Blick kostet nichts.
„Keine Zeit." → Genau [U]deshalb[/U] rufe ich an. Das Thema ist Zeit.
„Schicken Sie Infos." → Mache ich — nur zeigt eine Mail nicht, was [U]bei Ihnen konkret[/U] auffällt. 20 Minuten, dann wissen Sie es.

TONALITÄT — SO KLINGST DU BEI JEDEM TYP
[R]Ruhiger Entscheider (langsam, Pausen):[/R] „Herr [Name], ich mache es ganz kurz. Ich habe mir Ihre Abläufe von außen angeschaut und glaube, dass da zwei, drei Punkte spannend sein könnten. Ich würde Ihnen das gerne einmal sauber zeigen."
[R]Dominanter Entscheider (direkt, nicht rechtfertigen):[/R] „Herr [Name], ich rufe nicht an, um Ihnen etwas zu verkaufen. Ich sehe bei Ihren Abläufen einen konkreten Hebel und würde Ihnen den gerne zeigen. Danach entscheiden Sie selbst."
[R]Gestresster Entscheider (knapp, Termin statt Pitch):[/R] „Ich merke, es ist gerade ungünstig — und genau [U]das[/U] ist das Thema. Lassen Sie uns 20 Minuten fest eintragen. Morgen oder übermorgen?"
[R]Skeptischer Entscheider (nicht diskutieren, prüfen lassen):[/R] „Kann gut sein, dass es für Sie nicht passt. Dann wissen wir das nach 20 Minuten. Ich möchte Ihnen nur zeigen, was mir aufgefallen ist."

NICHT WIE EINE AGENTUR KLINGEN
[R]Schwach: „Wir machen KI." · „Wir bauen Automationen."[/R]
[U]Stark:[/U] „Wir sorgen dafür, dass keine Anfrage mehr verloren geht." · „Wir holen die Stunden zurück, die Ihr Team an Routine verliert."

KURZVERSION ZUM AUSWENDIGLERNEN
Moin/Servus/Hallo Herr/Frau [Name], [ICH] hier. Wir haben vor knapp zwei Monaten wegen Automationen und Prozessen gesprochen — damals war viel los.
Deshalb hab ich mir heute vorgenommen, Sie als Kunden zu gewinnen. [R](lachen)[/R] — nicht genau heute, aber ich hab mir Ihren Betrieb angeschaut.
Ein Kunde hat mit uns in vier Wochen 80 Stunden im Monat eingespart.
[J]Haben Sie schon mal vom Automation Framework gehört?[/J]
Viele bekommen Anfragen — aber danach bleibt Umsatz liegen, weil nichts sauber nachverfolgt wird.
[J]Wäre es die schlechteste Idee, wenn ich Ihnen in einer kostenlosen Wachstumsanalyse zeige, wie wir das geschafft haben?[/J]
[R](→ Termin, möglichst morgen — weiter im Setter.)[/R]$s$
where title = 'HK ▸ KI-Automation — Opener';

update public.scripts set
  qualifying_questions_json = '["Wie wichtig ist Ihnen das Thema Zeit- und Umsatz-Optimierung auf einer Skala von 1 bis 10?","Wie viele immer wiederkehrende Prozesse haben Sie aktuell in Ihrem Unternehmen?","Wie viele davon sind schon so automatisiert, dass sie Ihnen aktuell Zeit und Geld einbringen?","Abgesehen von den Abläufen und einem transparenten Prozess — was ist Ihnen sonst besonders wichtig? Welche Fehler haben andere gemacht, die wir nicht wiederholen dürfen?","Wie viele Mitarbeiter beschäftigen Sie momentan? (für passende Referenzen)"]'::jsonb,
  required_notes_json = '["Zielzeitpunkt Termin (morgen? 12/15 Uhr / vor-nachmittags)","Skala 1–10 Zeit-/Umsatz-Optimierung","Anzahl wiederkehrender Prozesse","Was davon schon automatisiert","No-Gos / Fehler anderer","Mitarbeiterzahl","Wer kommt zum Folgegespräch dazu","E-Mail bestätigt","Anti-No-Show gestellt"]'::jsonb,
  full_script = $s$ABLAUF [R](Termin möglichst auf morgen → Qualifizieren (als Vorbereitung) → Zusammenfassen + Konkurrenz → Bestätigung → weitere Entscheider → Anti-No-Show → Verabschiedung)[/R]

TERMIN — MÖGLICHST AUF MORGEN [R](feste Zeiten anbieten, Alternativfragen)[/R]
Super. [J]Wann passt es Ihnen besser — eher um 12 oder um 15 Uhr?[/J] [R](morgen anpeilen)[/R]
[J]Also eher vormittags oder nachmittags?[/J]
[R](Klappt morgen nicht: „Schauen Sie mal ganz kurz in Ihren Kalender, wann es nächste Woche passt — eher Anfang oder eher Ende der Woche?")[/R]

QUALIFIZIERUNG [R](als Vorbereitung aufs Gespräch gerahmt — der Kunde nennt seinen Bedarf selbst)[/R]
Ich hab noch zwei, drei Fragen an Sie, damit wir uns bestmöglich auf unseren Termin vorbereiten können:
1. [J]Wie wichtig ist Ihnen das Thema Zeit- und Umsatz-Optimierung auf einer Skala von 1 bis 10?[/J]
2. Wie viele immer wiederkehrende Prozesse haben Sie aktuell in Ihrem Unternehmen?
3. Und wie viele davon sind bei Ihnen schon so automatisiert, dass sie Ihnen aktuell Zeit und Geld einbringen?

[G]Und damit das Folgegespräch für Sie auch wirklich Sinn ergibt und Sie nicht Ihre Zeit verschwenden, gestatten Sie mir noch eine kurze Frage:[/G] Abgesehen von den tatsächlichen Abläufen und einem transparenten Prozess — was ist Ihnen darüber hinaus besonders wichtig? Beziehungsweise: welche Fehler haben andere schon gemacht, die wir auf keinen Fall wiederholen dürfen?

Und damit ich Ihnen im Folgegespräch die passenden Referenzen mitbringen kann — wie viele Mitarbeiter beschäftigen Sie momentan?

ZUSAMMENFASSEN + KONKURRENZ-BLICK
[G]Okay — basierend auf dem, was Sie mir gesagt haben, kann ich Ihnen versichern: Das ist nichts, was ich so noch nicht gehört oder gesehen habe.[/G] Damit ich Ihnen das Ganze einmal konkret an einem Beispiel aufzeigen und [U]schwarz auf weiß[/U] beweisen kann, schauen wir uns auch ganz genau an, was Ihre Konkurrenten gerade so treiben.

BESTÄTIGUNG
Alles klar. Die Bestätigung für den Termin sende ich dann an [E-Mail], richtig? Perfekt.

WEITERE ENTSCHEIDER
Zwei letzte Fragen habe ich allerdings noch. Die erste entsteht aus der Erfahrung heraus: Gibt es irgendjemanden in Ihrem Unternehmen, den Sie zum Folgegespräch hinzuziehen würden? Einen Prokuristen, einen Personalleiter — oder Ihre Ehefrau, Ihre Mutter, irgendwen anderen?

ANTI-NO-SHOW [R](charmant, mit Augenzwinkern — bestätigen lassen)[/R]
[G]Und abschließend — ich will das gar nicht verallgemeinern, es ist bei mir mittlerweile einfach eine Routinefrage geworden: Mir ist nur wichtig, dass das kein Mitleidstermin ist, den ein Geschäftsführer nur macht, um einen fleißigen Vertriebler wie mich abzuwimmeln.[/G]

VERABSCHIEDUNG
Sehr schön. Dann bis zum [Datum] um [Uhrzeit]. Wir freuen uns auf Sie, und ich bedanke mich recht herzlich im Namen von HK Growth.

TONALITÄT — SO SETZT DU DEN TERMIN
[R]Ruhig:[/R] „Schauen wir in Ruhe drauf — 20 Minuten, ohne Druck. Lieber morgen oder eher nächste Woche?"
[R]Dominant:[/R] „Mein Vorschlag: morgen um 12. Danach wissen Sie, was es bei Ihnen bringt."
[R]Gestresst:[/R] „Genau weil keine Zeit ist — das ist das Thema. Morgen um 12 oder 15 Uhr?"
[R]Skeptisch:[/R] „Wenn sich nichts lohnt, wissen Sie es nach 20 Minuten — auch ein Ergebnis."

KURZVERSION ZUM AUSWENDIGLERNEN
Super — wann passt es morgen besser, 12 oder 15 Uhr? Vor- oder nachmittags?
Zwei, drei Fragen zur Vorbereitung: Skala 1–10 Zeit/Umsatz? Wie viele wiederkehrende Prozesse? Wie viele davon schon automatisiert? Und: welche Fehler dürfen wir nicht wiederholen? Wie viele Mitarbeiter?
Okay — das kenne ich alles, das zeige ich Ihnen konkret, inkl. Blick auf Ihre Konkurrenz.
Bestätigung an [E-Mail]? Wen nehmen Sie zum Folgegespräch dazu?
Und: kein Mitleidstermin, um mich abzuwimmeln, oder? [R](lächeln)[/R]
Sehr schön — bis [Datum] [Uhrzeit]. Wir freuen uns auf Sie, im Namen von HK Growth.$s$
where title = 'HK ▸ KI-Automation — Setter';

update public.scripts set
  method_name = 'Automation Framework',
  full_script = $s$ABLAUF [R](Einstieg → Reframe → Kontext → Analyse → Bedarf → Anker (Setter-Zahl!) → Lösung → Preis → Einwände → Abschluss → sonst Follow-up fixieren)[/R]

EINSTIEG IM TERMIN [R](fester Gruß, kein Firmenname, warm)[/R]
[G]Moin / Servus / Hallo Herr/Frau [Name], [ICH] hier — schön, dass es klappt.[/G] Mein Kollege hat mir erzählt, dass bei Ihnen vor allem [Chaos-Feld + Anker-Zahl aus Setter-Notizen] Thema ist — genau da steigen wir ein. [R](Rückbezug — kein Neustart)[/R]

REFRAME
[G]Kurz vorweg: Das ist kein Verkaufsgespräch. Ich zeige Ihnen ehrlich, welche Abläufe bei Ihnen am meisten Zeit fressen und was davon heute automatisierbar wäre. Was Sie danach damit machen, entscheiden Sie völlig frei.[/G] Passt das? [R](bestätigen lassen)[/R]

KONTEXT SCHÄRFEN
Was würde Ihnen am meisten helfen — Zeit im Team freispielen, schneller auf Anfragen reagieren, oder mehr aus den Anfragen machen, die schon reinkommen? Und welcher Ablauf nervt Sie [U]selbst[/U] am meisten?

DIE ANALYSE — 5 HEBEL [R](an SEINEN Abläufen konkret machen — Setter-Notizen sind die Landkarte)[/R]
1. [U]Anfrage-Handling:[/U] automatische Sofort-Reaktion → kein Lead bleibt liegen, kein Wettbewerber ist schneller.
2. [U]Termine, Angebote, Rechnungen:[/U] Buchung, Angebote, Rechnungslauf, Erinnerungen automatisch.
3. [U]Wiederkehrende Handarbeit:[/U] Nachfassen, Datenpflege, Wiedervorlage → einmal aufgesetzt, läuft.
4. [U]KI-Assistent:[/U] FAQ, Erstauskunft, Vorqualifizierung — rund um die Uhr, auch samstagabends.
5. [U]Reporting:[/U] Anfragen und Umsatz auf einen Blick, ohne Excel-Bastelei.

MODERNE UMSETZUNG
KI-Agenten und Workflow-Automationen, angebunden an Ihre [U]bestehenden[/U] Tools — kein Systemwechsel, keine Umstellung fürs Team. Das meiste ist in Tagen live.

BEDARF BESTÄTIGEN
Was ich bei Ihnen sehe: Vor allem [Ablauf 1–3] wären dran. Deckt sich das mit Ihrem Eindruck? [R](Ja abholen)[/R]

LÜCKE RECHNEN [R](Anker VOR dem Preis — die Setter-Zahl verwenden!)[/R]
Rechnen wir kurz — Sie hatten meinem Kollegen gesagt, eine nicht sauber bearbeitete Anfrage kostet Sie etwa [Setter-Zahl]: [X] Stunden pro Woche Routine × Stundenkosten + [X] verlorene Anfragen im Monat → über ein Jahr [U][große Zahl][/U]. [G]Das ist der Betrag, der aktuell einfach verpufft.[/G] [R](stehen lassen)[/R]

LÖSUNG — NUR WAS NÖTIG IST
Auf Basis der Analyse setze ich genau die Automationen an, die den Hebel bringen: [Ablauf 1 → 2 → 3]. Die erste läuft in [X] Wochen — Sie merken den Unterschied im Alltag sofort.

PREIS [R](erst jetzt — dann still sein)[/R]
[G]Den Preis nenne ich erst jetzt, wo wir Ihren Bedarf kennen — nicht ins Blaue.[/G] Für den Umfang liegen wir bei [Preis]. [R](Preis nennen — dann schweigen)[/R]

EINWÄNDE [R](verstehen → isolieren → reframen)[/R]
„Zu teuer." → Verglichen womit — mit dem Preis, oder mit den [große Zahl], die aktuell [U]jedes Jahr[/U] verpuffen? Die Rechnung haben wir gerade gemacht.
„Das macht unsere IT selbst." → Perfekt, dann gibt es Grundlagen. Die Frage ist Kapazität und KI-Erfahrung — genau da springen wir ein, Ihre IT behält die Hoheit.
„Ich muss überlegen." → Das [U]Ob[/U] oder das [U]Wie[/U]? Beim Wie gebe ich Ihnen sofort Klarheit.
„Ich muss das mit … besprechen." → Richtig. Was wäre für ihn/sie der wichtigste Punkt? Am besten direkt dazuholen.
„Keine Zeit für die Umstellung." → Genau deshalb übernehmen wir das — Ihr Aufwand ist ein kurzes Onboarding, kein Systemwechsel.
„Datenschutz / unsere Daten?" → Alles läuft in Ihren bestehenden Systemen, DSGVO-konform — nichts verlässt Ihre Kontrolle.
„Gerade kein Budget." → Wenn das Budget da wäre — wäre es ein Ja? [R](isolieren; ggf. kleinsten Hebel starten)[/R]
„Was, wenn es nicht funktioniert?" → Deshalb starten wir mit der am schnellsten messbaren Automation — nach [X] Wochen sehen Sie schwarz auf weiß, was sie spart.

ABSCHLUSS
[J]Wenn es passt: Start [Datum], Onboarding kommt direkt, in [X] Wochen läuft die erste Automation. Machen wir es so?[/J] [R](still sein)[/R]

WENN HEUTE KEIN ABSCHLUSS
Dann fixieren wir den nächsten Schritt: Ich melde mich [Tag] um [Uhrzeit] — bis dahin wissen Sie, ob es beim Ob oder Wie hakt. Einverstanden?

TONALITÄT — SO SCHLIESST DU
[R]Ruhig:[/R] Pause nach dem Preis aushalten, dann: „Was geht Ihnen gerade durch den Kopf?"
[R]Dominant:[/R] „Aus meiner Sicht rechnet es sich klar. Ihre Entscheidung."
[R]Gestresst:[/R] „Ihr Aufwand: ein kurzes Onboarding. Den Rest machen wir."
[R]Skeptisch:[/R] „Nach [X] Wochen sehen Sie schwarz auf weiß, was die erste Automation spart."

VERABSCHIEDUNG (bei Abschluss)
Sehr schön. Wir freuen uns auf die Zusammenarbeit — ich bedanke mich recht herzlich im Namen von HK Growth.$s$
where title = 'HK ▸ KI-Automation — Closer';

-- ╔══════════════════ 🌐 WEBSITE ══════════════════╗
update public.scripts set
  opening_line = 'Moin / Servus / Hallo Herr/Frau [Name], [ICH] hier. Wir haben vor knapp zwei Monaten schon einmal wegen Ihrer Website und Online-Präsenz miteinander gesprochen — damals war zu dem Zeitpunkt einfach ein bisschen zu viel los. Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, Sie als Kunden zu gewinnen. (lachen) — also natürlich nicht genau heute.',
  full_script = $s$EINSTIEG [R](fester Gruß — kein Firmenname am Anfang)[/R]
[G]Moin / Servus / Hallo Herr/Frau [Name], [ICH] hier.[/G]
[G]Wir haben vor knapp zwei Monaten schon einmal wegen Ihrer Website und Online-Präsenz miteinander gesprochen — damals war zu dem Zeitpunkt einfach ein bisschen zu viel los.[/G]
[R](Nur wenn wahr — sonst: „Ich hatte mir Ihren Betrieb notiert, weil mir Ihr Auftritt aufgefallen ist.")[/R]

AGENDA
Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, [U]Sie als Kunden zu gewinnen[/U]. [R](lachen)[/R] — also natürlich nicht genau heute. Aber ich hab mir Ihre Website und Ihren Google-Auftritt noch einmal ganz genau angeschaut — aus Sicht von jemandem, der bei Ihnen anfragen will.

PROOF [R](echte Zahl — sonst weiche Form)[/R]
[G]Und mir sind da zwei, drei Parallelen zu einem unserer Kunden aufgefallen, der mit uns in den letzten [Zeitraum] über seine neue Seite [konkretes Ergebnis, z. B. „14 qualifizierte Anfragen"] bekommen hat.[/G] [R](kurze Pause)[/R]
[R](Weiche Form: „…bei dem wir aus einer Seite, die nur informiert hat, einen echten Anfrage-Weg gebaut haben — die Anfragen kamen deutlich schneller, als er erwartet hat.")[/R]

METHODENFRAGE
[J]Deshalb meine Frage an Sie: Haben Sie schon einmal etwas von einer Conversion-Website-Analyse gehört?[/J] [R](STILL SEIN — antworten lassen)[/R]

WENN „BRAUCHEN WIR NICHT / HABEN SCHON EINE SEITE" [R](Einwand → kontern → zurück ins Script)[/R]
Davon gehe ich aus — die Frage ist nicht, [U]ob[/U] Sie eine Website haben, sondern ob sie genug Anfragen bringt. Genau das zeige ich Ihnen einmal kostenlos. Wenn nichts Brauchbares dabei ist, haben Sie 20 Minuten investiert, mehr nicht. [R](→ weiter zum Mechanismus / Negative Close)[/R]

WENN „JA / WAS IST DAS?" → MECHANISMUS
Wir haben eine Möglichkeit entwickelt, mit der Unternehmen nicht einfach „eine neue Website" bekommen, sondern gezielt sichtbar machen, warum ein Interessent genau [U]ihnen[/U] vertrauen sollte — und daraus planbar Anfragen entstehen. Typischerweise merken wir bei Kunden immer wieder: Interessenten sind kaufbereit, aber die Seite überzeugt sie in den ersten Sekunden nicht — [U]und dann gehen sie zum Wettbewerber[/U].

NEGATIVE CLOSE
[J]Wäre es die absolut schlechteste Idee, wenn ich Ihnen in einer kostenlosen Website-Analyse einmal genau aufzeige, wo Ihre Seite gerade Anfragen kostet — und wir gemeinsam prüfen, ob es auch für Sie relevant ist?[/J]

[R](→ Ja/Nein zum Termin. JA → weiter im Setter, Termin möglichst morgen. NEIN/Einwand → Panel, dann zurück.)[/R]

WEITERE EINWÄNDE IM OPENER [R](Kurzform)[/R]
„Kein Interesse." → Grundsätzlich, oder gerade schlechter Zeitpunkt? [R](isolieren)[/R]
„Haben schon eine Agentur." → Perfekt, dann sind Grundlagen da — ein zweiter, neutraler Blick kostet nichts.
„Keine Zeit." → Genau deshalb 20 Minuten fest statt zwischen Tür und Angel.
„Schicken Sie Infos." → Eine Mail zeigt nicht, was [U]bei Ihnen[/U] konkret auffällt.

TONALITÄT — SO KLINGST DU BEI JEDEM TYP
[R]Ruhig:[/R] „Herr [Name], ich mache es ganz kurz. Ich habe mir Ihre Seite angeschaut und glaube, dass da zwei, drei Punkte spannend sein könnten. Ich würde Ihnen das gerne einmal sauber zeigen."
[R]Dominant:[/R] „Ich rufe nicht an, um etwas zu verkaufen. Ich sehe bei Ihrer Website einen konkreten Hebel und zeige Ihnen den. Danach entscheiden Sie selbst."
[R]Gestresst:[/R] „Ich merke, es ist ungünstig — genau deshalb nicht zwischen Tür und Angel. 20 Minuten fest. Morgen oder übermorgen?"
[R]Skeptisch:[/R] „Kann sein, dass es nicht passt. Dann wissen wir das nach 20 Minuten. Ich zeige Ihnen nur, was mir aufgefallen ist."

NICHT WIE EINE AGENTUR KLINGEN
[R]Schwach: „Wir bauen Websites." · „Wir machen Webdesign."[/R]
[U]Stark:[/U] „Wir bauen digitale Vertrauensseiten." · „Wir prüfen, wo Ihre Seite gerade Anfragen verliert."

KURZVERSION ZUM AUSWENDIGLERNEN
Moin/Servus/Hallo Herr/Frau [Name], [ICH] hier. Wir haben vor knapp zwei Monaten wegen Ihrer Website gesprochen — damals war viel los.
Deshalb hab ich mir heute vorgenommen, Sie als Kunden zu gewinnen. [R](lachen)[/R] — nicht genau heute, aber ich hab mir Ihre Seite angeschaut.
Ein Kunde hat über seine neue Seite [konkretes Ergebnis] bekommen.
[J]Haben Sie schon mal von einer Conversion-Website-Analyse gehört?[/J]
Kaufbereite Interessenten, die die Seite nicht überzeugt, gehen zum Wettbewerber.
[J]Wäre es die schlechteste Idee, wenn ich Ihnen kostenlos zeige, wo Ihre Seite Anfragen kostet?[/J]
[R](→ Termin, möglichst morgen — weiter im Setter.)[/R]$s$
where title = 'HK ▸ Website — Opener';

update public.scripts set
  qualifying_questions_json = '["Wie wichtig ist Ihnen mehr Sichtbarkeit und mehr Anfragen über die Website auf einer Skala von 1 bis 10?","Bekommen Sie aktuell regelmäßig Anfragen über Website oder Google?","Wann wurde die Seite zuletzt strategisch überarbeitet — nicht nur optisch?","Abgesehen von mehr Anfragen: Was ist Ihnen sonst besonders wichtig? Welche Fehler haben frühere Webdesigner gemacht, die wir nicht wiederholen dürfen?","Wie viele Mitarbeiter beschäftigen Sie momentan? (für passende Referenzen)"]'::jsonb,
  required_notes_json = '["Zielzeitpunkt Termin (morgen? 12/15 Uhr / vor-nachmittags)","Skala 1–10","Anfragen heute über Web/Google","No-Gos / frühere Agentur-Fehler","Mitarbeiterzahl","Wer kommt dazu","E-Mail bestätigt","Anti-No-Show gestellt"]'::jsonb,
  full_script = $s$ABLAUF [R](Termin möglichst auf morgen → Qualifizieren (als Vorbereitung) → Zusammenfassen + Konkurrenz → Bestätigung → weitere Entscheider → Anti-No-Show → Verabschiedung)[/R]

TERMIN — MÖGLICHST AUF MORGEN
Super. [J]Wann passt es Ihnen besser — eher um 12 oder um 15 Uhr?[/J] [R](morgen anpeilen)[/R]
[J]Also eher vormittags oder nachmittags?[/J]
[R](Klappt morgen nicht: „Schauen Sie kurz in Ihren Kalender, wann es nächste Woche passt — eher Anfang oder Ende der Woche?")[/R]

QUALIFIZIERUNG [R](als Vorbereitung aufs Gespräch gerahmt)[/R]
Ich hab noch zwei, drei Fragen an Sie, damit wir uns bestmöglich auf unseren Termin vorbereiten können:
1. [J]Wie wichtig ist Ihnen mehr Sichtbarkeit und mehr Anfragen über die Website auf einer Skala von 1 bis 10?[/J]
2. Bekommen Sie aktuell regelmäßig Anfragen über Website oder Google?
3. Wann wurde die Seite zuletzt [U]strategisch[/U] überarbeitet — nicht nur optisch?

[G]Und damit das Folgegespräch für Sie auch wirklich Sinn ergibt und Sie nicht Ihre Zeit verschwenden, gestatten Sie mir noch eine kurze Frage:[/G] Abgesehen von mehr Anfragen — was ist Ihnen sonst besonders wichtig? Beziehungsweise: welche Fehler haben frühere Webdesigner oder Agenturen gemacht, die wir auf keinen Fall wiederholen dürfen?

Und damit ich Ihnen die passenden Referenzen mitbringen kann — wie viele Mitarbeiter beschäftigen Sie momentan?

ZUSAMMENFASSEN + KONKURRENZ-BLICK
[G]Okay — basierend auf dem, was Sie mir gesagt haben, kann ich Ihnen versichern: Das ist nichts, was ich so noch nicht gesehen habe.[/G] Damit ich Ihnen das Ganze konkret an einem Beispiel aufzeigen und [U]schwarz auf weiß[/U] beweisen kann, schauen wir uns auch genau an, wie Ihre Konkurrenten online gerade auftreten.

BESTÄTIGUNG
Alles klar. Die Bestätigung sende ich dann an [E-Mail], richtig? Perfekt.

WEITERE ENTSCHEIDER
Zwei letzte Fragen habe ich noch. Die erste aus Erfahrung: Gibt es jemanden in Ihrem Unternehmen, den Sie zum Folgegespräch hinzuziehen würden? Einen zweiten Geschäftsführer, jemanden aus dem Marketing — oder Ihre Ehefrau, Ihre Mutter, irgendwen anderen, der mitentscheidet?

ANTI-NO-SHOW [R](charmant — bestätigen lassen)[/R]
[G]Und abschließend — ich will das gar nicht verallgemeinern, es ist bei mir mittlerweile einfach eine Routinefrage geworden: Mir ist nur wichtig, dass das kein Mitleidstermin ist, den ein Geschäftsführer nur macht, um einen fleißigen Vertriebler wie mich abzuwimmeln.[/G]

VERABSCHIEDUNG
Sehr schön. Dann bis zum [Datum] um [Uhrzeit]. Wir freuen uns auf Sie, und ich bedanke mich recht herzlich im Namen von HK Growth.

TONALITÄT — SO SETZT DU DEN TERMIN
[R]Ruhig:[/R] „Schauen wir es in Ruhe an — 20 Minuten. Lieber morgen oder nächste Woche?"
[R]Dominant:[/R] „Mein Vorschlag: morgen um 12. Danach wissen Sie, ob es relevant ist."
[R]Gestresst:[/R] „Genau weil viel los ist — fester Termin. Morgen 12 oder 15 Uhr?"
[R]Skeptisch:[/R] „Wenn nichts Brauchbares dabei ist, haben Sie 20 Minuten und Gewissheit."

KURZVERSION ZUM AUSWENDIGLERNEN
Super — morgen 12 oder 15 Uhr? Vor- oder nachmittags?
Zur Vorbereitung: Skala 1–10? Anfragen über Web/Google? Wann zuletzt strategisch überarbeitet? Welche Fehler dürfen wir nicht wiederholen? Wie viele Mitarbeiter?
Okay — das kenne ich, das zeige ich konkret, inkl. Blick auf Ihre Konkurrenz.
Bestätigung an [E-Mail]? Wen nehmen Sie dazu?
Und: kein Mitleidstermin, um mich abzuwimmeln, oder? [R](lächeln)[/R]
Sehr schön — bis [Datum] [Uhrzeit]. Wir freuen uns auf Sie, im Namen von HK Growth.$s$
where title = 'HK ▸ Website — Setter';

-- Website Closer: nur Gruß/Voice angleichen (Analyse-Inhalt bleibt aus 018 stark)
update public.scripts set
  full_script = replace(replace(full_script,
    'Moin Herr/Frau [Name], [ICH] hier — schön, dass es klappt.',
    'Moin / Servus / Hallo Herr/Frau [Name], [ICH] hier — schön, dass es klappt.'),
    'Vielen Dank für Ihr Vertrauen und einen schönen Tag.',
    'Wir freuen uns auf die Zusammenarbeit — ich bedanke mich recht herzlich im Namen von HK Growth.')
where title = 'HK ▸ Website — Closer';

-- ╔══════════════════ 📣 SOCIAL & BRANDING ══════════════════╗
update public.scripts set
  opening_line = 'Moin / Servus / Hallo Herr/Frau [Name], [ICH] hier. Wir haben vor knapp zwei Monaten schon einmal wegen Ihrer Außenwirkung und Ihrem Auftritt miteinander gesprochen — damals war zu dem Zeitpunkt einfach ein bisschen zu viel los. Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, Sie als Kunden zu gewinnen. (lachen) — also natürlich nicht genau heute.',
  full_script = $s$EINSTIEG [R](fester Gruß — kein Firmenname am Anfang)[/R]
[G]Moin / Servus / Hallo Herr/Frau [Name], [ICH] hier.[/G]
[G]Wir haben vor knapp zwei Monaten schon einmal wegen Ihrer Außenwirkung und Ihrem Auftritt miteinander gesprochen — damals war zu dem Zeitpunkt einfach ein bisschen zu viel los.[/G]
[R](Nur wenn wahr — sonst: „Ich hatte mir Ihren Betrieb notiert, weil mir Ihre Außenwirkung aufgefallen ist.")[/R]

AGENDA
Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, [U]Sie als Kunden zu gewinnen[/U]. [R](lachen)[/R] — also natürlich nicht genau heute. Aber ich hab mir Ihren Auftritt noch einmal ganz genau angeschaut.

PROOF [R](echte Zahl — sonst weiche Form)[/R]
[G]Und mir sind da zwei, drei Parallelen zu einem unserer Kunden aufgefallen, der durch einen klareren Auftritt in den letzten [Zeitraum] [konkretes Ergebnis, z. B. „acht hochwertigere Anfragen statt Preisvergleicher"] bekommen hat.[/G] [R](kurze Pause)[/R]
[R](Weiche Form: „…bei dem wir aus einem austauschbaren Auftritt die klar vertrauenswürdigere Wahl in seiner Region gemacht haben.")[/R]

DER PAIN [R](Herzstück — nicht abkürzen)[/R]
Das Spannende bei Ihnen: Ihr Unternehmen wirkt fachlich stark. Aber wenn man Sie online mit zwei, drei Anbietern aus Ihrer Region vergleicht, wird nicht klar genug, [U]warum ausgerechnet Sie[/U]. Und genau da verlieren Unternehmer Geld — weil Interessenten heute [U]vergleichen, bevor sie überhaupt anrufen[/U].

METHODENFRAGE
[J]Deshalb meine Frage an Sie: Haben Sie schon einmal etwas von regionaler Marken-Dominanz gehört?[/J] [R](STILL SEIN — antworten lassen)[/R]

WENN „BRAUCHEN WIR KEIN BRANDING" [R](Einwand → kontern → zurück ins Script)[/R]
Verstehe ich — es geht auch nicht um Branding im klassischen Sinne, kein Logo, keine Farben, kein Agenturzeug. Es geht um die Frage: Wenn ein Kunde Sie und zwei Wettbewerber vergleicht, gewinnt Ihr Auftritt sofort Vertrauen — oder wirken alle ähnlich? Genau das zeige ich Ihnen einmal kostenlos. [R](→ weiter zum Mechanismus / Negative Close)[/R]

WENN „JA / WAS IST DAS?" → MECHANISMUS
Wir haben eine Möglichkeit entwickelt, mit der Unternehmen in ihrer Region nicht mehr als irgendein Anbieter wahrgenommen werden, sondern als die [U]deutlich vertrauenswürdigere und hochwertigere Wahl[/U] — nicht über ein Logo, sondern über den kompletten Auftritt. Typischerweise merken wir bei Kunden immer wieder: Sie sind fachlich top, aber online verwechselbar — und dann entscheidet der Preis.

NEGATIVE CLOSE
[J]Wäre es die absolut schlechteste Idee, wenn ich Ihnen in einer kostenlosen Marken-Analyse einmal genau aufzeige, wie wir das bei dem anderen Unternehmen aufgebaut haben — und wir gemeinsam prüfen, ob es auch für Sie relevant ist?[/J]

[R](→ Ja/Nein zum Termin. JA → weiter im Setter, Termin möglichst morgen. NEIN/Einwand → Panel, dann zurück.)[/R]

WEITERE EINWÄNDE IM OPENER [R](Kurzform — volle Antworten im Panel)[/R]
„Wir bekommen genug Anfragen." → Die Frage ist nicht ob, sondern welche [U]Qualität[/U] — Preisvergleicher oder Wunschkunden?
„Kommen über Empfehlung." → Dann ist der Auftritt noch wichtiger: Empfehlung → googeln → in Sekunden entscheidet sich, ob das Vertrauen bestätigt wird.
„Haben schon eine Website." → Die Frage ist, ob Ihr Auftritt [U]verkauft[/U], warum Sie die bessere Wahl sind.

TONALITÄT — SO KLINGST DU BEI JEDEM TYP
[R]Ruhig:[/R] „Herr [Name], ich mache es ganz kurz. Ich habe mir Ihren Auftritt angeschaut und glaube, da könnten zwei, drei Punkte spannend sein. Ich zeige Ihnen das gerne einmal sauber."
[R]Dominant:[/R] „Ich rufe nicht an, um etwas zu verkaufen. Ich sehe bei Ihrem Auftritt einen konkreten Hebel und zeige Ihnen den. Danach entscheiden Sie selbst."
[R]Gestresst:[/R] „Ich merke, es ist ungünstig — genau deshalb 20 Minuten fest statt zwischen Tür und Angel. Morgen oder übermorgen?"
[R]Skeptisch:[/R] „Kann sein, dass es nicht passt. Dann wissen wir das nach 20 Minuten."

NICHT WIE EINE AGENTUR KLINGEN
[R]Schwach: „Wir machen Social Media." · „Wir posten für Sie."[/R]
[U]Stark:[/U] „Wir machen sichtbar, warum Menschen Ihnen vertrauen sollten." · „Wir machen Sie zur klar vertrauenswürdigeren Wahl in Ihrer Region."

KURZVERSION ZUM AUSWENDIGLERNEN
Moin/Servus/Hallo Herr/Frau [Name], [ICH] hier. Wir haben vor knapp zwei Monaten wegen Ihres Auftritts gesprochen — damals war viel los.
Deshalb hab ich mir heute vorgenommen, Sie als Kunden zu gewinnen. [R](lachen)[/R] — nicht genau heute, aber ich hab mir Ihren Auftritt angeschaut.
Ein Kunde hat durch einen klareren Auftritt [konkretes Ergebnis] bekommen.
Fachlich top, aber im Vergleich verwechselbar — und verglichen wird, bevor angerufen wird.
[J]Haben Sie schon mal von regionaler Marken-Dominanz gehört?[/J]
[J]Wäre es die schlechteste Idee, wenn ich Ihnen kostenlos zeige, wie wir das aufgebaut haben?[/J]
[R](→ Termin, möglichst morgen — weiter im Setter.)[/R]$s$
where title = 'HK ▸ Social & Branding — Opener';

update public.scripts set
  qualifying_questions_json = '["Wie wichtig ist es Ihnen auf einer Skala von 1 bis 10, in Ihrer Region als die klar vertrauenswürdigere Wahl gesehen zu werden?","Wenn ein Kunde Sie und zwei Wettbewerber vergleicht: Wird sofort klar, warum Sie?","Kommen Ihre besten Kunden eher über Empfehlung, online oder Bestandskontakte?","Bauen Kunden eher wegen der Firma Vertrauen auf — oder auch wegen Ihnen als Person? (Gabelung) Und was möchten Sie auf keinen Fall — zu laut, zu künstlich?","Wie viele Mitarbeiter beschäftigen Sie momentan? (für passende Referenzen)"]'::jsonb,
  required_notes_json = '["Zielzeitpunkt Termin (morgen? 12/15 Uhr / vor-nachmittags)","Gabelung Firmen-/Personal-Branding + No-Gos","Skala 1–10","Anfragen-Qualität heute","Mitarbeiterzahl","Wer kommt dazu","E-Mail bestätigt","Anti-No-Show gestellt"]'::jsonb,
  full_script = $s$ABLAUF [R](Termin möglichst auf morgen → Qualifizieren mit Gabelung → Zusammenfassen + Konkurrenz → Bestätigung → weitere Entscheider → Anti-No-Show → Verabschiedung)[/R]

TERMIN — MÖGLICHST AUF MORGEN
Super. [J]Wann passt es Ihnen besser — eher um 12 oder um 15 Uhr?[/J] [R](morgen anpeilen)[/R]
[J]Also eher vormittags oder nachmittags?[/J]
[R](Klappt morgen nicht: „Schauen Sie kurz in Ihren Kalender, wann es nächste Woche passt — eher Anfang oder Ende der Woche?")[/R]

QUALIFIZIERUNG [R](als Vorbereitung gerahmt — Frage 4 ist die Gabelung!)[/R]
Ich hab noch zwei, drei Fragen an Sie, damit wir uns bestmöglich auf unseren Termin vorbereiten können:
1. [J]Wie wichtig ist es Ihnen auf einer Skala von 1 bis 10, in Ihrer Region als die klar vertrauenswürdigere Wahl gesehen zu werden?[/J]
2. Wenn ein Kunde Sie und zwei Wettbewerber online vergleicht: Wird sofort klar, warum ausgerechnet [U]Sie[/U]?
3. Kommen Ihre besten Kunden eher über Empfehlung, online oder über bestehende Kontakte?
4. [R](Gabelung:)[/R] Bauen Kunden eher wegen der Firma Vertrauen auf — oder auch wegen [U]Ihnen als Person[/U]? Und was möchten Sie auf keinen Fall — zu laut, zu künstlich, zu influencer-mäßig? [R](Firmen- vs. Personal + No-Gos notieren)[/R]

[G]Und damit das Folgegespräch für Sie auch wirklich Sinn ergibt und Sie nicht Ihre Zeit verschwenden, gestatten Sie mir noch eine kurze Frage:[/G] Welche Fehler haben andere Dienstleister schon gemacht, die wir auf keinen Fall wiederholen dürfen?

Und damit ich Ihnen die passenden Referenzen mitbringen kann — wie viele Mitarbeiter beschäftigen Sie momentan?

ZUSAMMENFASSEN + KONKURRENZ-BLICK
[G]Okay — basierend auf dem, was Sie mir gesagt haben, kann ich Ihnen versichern: Das ist nichts, was ich so noch nicht gesehen habe.[/G] Damit ich Ihnen das konkret an einem Beispiel aufzeigen und [U]schwarz auf weiß[/U] beweisen kann, schauen wir uns auch ganz genau an, wie Ihre Konkurrenten gerade nach außen wirken.

BESTÄTIGUNG
Alles klar. Die Bestätigung sende ich dann an [E-Mail], richtig? Perfekt.

WEITERE ENTSCHEIDER
Zwei letzte Fragen habe ich noch. Die erste aus Erfahrung: Gibt es jemanden, den Sie zum Folgegespräch hinzuziehen würden? Einen zweiten Geschäftsführer, jemanden aus dem Marketing — oder Ihre Ehefrau, Ihre Mutter, irgendwen anderen?

ANTI-NO-SHOW [R](charmant — bestätigen lassen)[/R]
[G]Und abschließend — ich will das gar nicht verallgemeinern, es ist bei mir mittlerweile einfach eine Routinefrage geworden: Mir ist nur wichtig, dass das kein Mitleidstermin ist, den ein Geschäftsführer nur macht, um einen fleißigen Vertriebler wie mich abzuwimmeln.[/G]

VERABSCHIEDUNG
Sehr schön. Dann bis zum [Datum] um [Uhrzeit]. Wir freuen uns auf Sie, und ich bedanke mich recht herzlich im Namen von HK Growth.

TONALITÄT — SO SETZT DU DEN TERMIN
[R]Ruhig:[/R] „Schauen wir es in Ruhe an — lieber morgen oder nächste Woche?"
[R]Dominant:[/R] „Mein Vorschlag: morgen um 12. Danach wissen Sie, ob es relevant ist."
[R]Gestresst:[/R] „Genau weil viel los ist — fester Termin. Morgen 12 oder 15 Uhr?"
[R]Skeptisch:[/R] „Wenn nichts Brauchbares dabei ist, haben Sie 20 Minuten und Gewissheit."

KURZVERSION ZUM AUSWENDIGLERNEN
Super — morgen 12 oder 15 Uhr? Vor- oder nachmittags?
Zur Vorbereitung: Skala 1–10? Warum Sie im Vergleich? Empfehlung oder online? Firma oder Person? [R](Gabelung!)[/R] Welche Fehler nicht wiederholen? Wie viele Mitarbeiter?
Okay — das kenne ich, das zeige ich konkret, inkl. Blick auf Ihre Konkurrenz.
Bestätigung an [E-Mail]? Wen nehmen Sie dazu?
Und: kein Mitleidstermin, um mich abzuwimmeln, oder? [R](lächeln)[/R]
Sehr schön — bis [Datum] [Uhrzeit]. Wir freuen uns auf Sie, im Namen von HK Growth.$s$
where title = 'HK ▸ Social & Branding — Setter';

update public.scripts set
  full_script = replace(replace(full_script,
    'Moin Herr/Frau [Name], [ICH] hier — schön, dass es klappt.',
    'Moin / Servus / Hallo Herr/Frau [Name], [ICH] hier — schön, dass es klappt.'),
    'Vielen Dank für Ihr Vertrauen und einen schönen Tag.',
    'Wir freuen uns auf die Zusammenarbeit — ich bedanke mich recht herzlich im Namen von HK Growth.')
where title = 'HK ▸ Social & Branding — Closer';
