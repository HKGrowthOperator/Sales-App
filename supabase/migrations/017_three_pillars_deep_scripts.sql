-- ============================================================
-- 017 — Fokus auf 3 Anruf-Pfeiler + Korthauer-Tiefe
-- ------------------------------------------------------------
-- Entscheidung HK: Es gibt genau DREI Gründe, warum angerufen wird:
-- Website · Social Media/Branding · KI-Integration. Alles andere
-- (Events, Imagefilm, Recruiting, Content als eigenes Thema, auch das
-- Wachstumssystem als Anruf-Grund) wird archiviert — der Sales-
-- Mitarbeiter soll EIN Skript-Set beherrschen, nicht zehn.
-- Das Wachstumssystem bleibt als Angebots-Bündel (Mail-Vorlagen/
-- product_area growth_system bleiben aktiv), ist aber kein Skript mehr.
--
-- Außerdem: Die 9 verbleibenden Skripte (3 Pfeiler × Opener/Setter/
-- Closer) werden auf vollen Korthauer-Umfang ausgebaut (alle Beats,
-- alle Verzweigungen, komplette Abschlusssequenzen).
-- Farbcode: [G]=Schlüsselsatz · [J]=Ja-Trigger · [R]=Regie · [U]=betonen.
-- ============================================================

-- ── 1) Aufräumen: alles außer den 3 Pfeilern archivieren ─────
update public.scripts set status = 'archived'
where script_type = 'master' and status = 'approved'
  and title not like 'HK ▸%';

update public.scripts set status = 'archived'
where script_type = 'master' and status = 'approved'
  and title like 'HK ▸ Wachstumssystem%';

-- ── 2) WEBSITE — voller Umfang ───────────────────────────────

update public.scripts set
  call_goal = 'Aufmachen + Interesse gewinnen. KEIN Termin-Talk, KEIN Preis. Ziel: Der Kunde will die kostenlose Analyse sehen.',
  tone_guidance = 'Selbstbewusst, führend, nicht bittend. Ruhiger Entscheider → langsamer, Pausen. Dominant → direkt, nicht rechtfertigen. Gestresst → kurz, sofort zum Punkt. Skeptisch → nicht diskutieren, prüfen lassen.',
  qualifying_questions_json = '[]'::jsonb,
  full_script = $s$EINSTIEG
Moin / Servus / Hallo Herr/Frau [Name], [ICH] hier von HK Growth.

[G]Wir haben vor einiger Zeit schon einmal wegen Ihrer digitalen Außenwirkung gesprochen — damals war einfach ein bisschen viel los.[/G]
[R](Nur sagen, wenn wahr. Sonst: „Ich hatte mir Ihren Betrieb vor einiger Zeit notiert, weil mir Ihr Auftritt aufgefallen ist.")[/R]

Deshalb hab ich mir heute nochmal auf die Agenda geschrieben, [U]Sie als Kunden zu gewinnen[/U]. [R](lachen)[/R] — also natürlich nicht genau heute. Aber ich hab mir Ihre Website und Ihren Google-Auftritt nochmal [U]ganz genau[/U] angeschaut, aus Sicht eines Kunden, der bei Ihnen anfragen will.

[G]Und mir sind zwei, drei Parallelen zu einem unserer Kunden aufgefallen, der mit uns in wenigen Wochen deutlich mehr Anfragen über seine Seite bekommen hat.[/G] [R](kurze Pause — wirken lassen)[/R]

DER PAIN
Das Spannende: Ihr Betrieb wirkt fachlich [U]deutlich stärker[/U], als Ihre Website es aktuell vermittelt. Viele Unternehmen verlieren online keine Anfragen, weil sie schlecht sind — sondern weil in den ersten Sekunden nicht klar wird, [U]warum man genau bei Ihnen anfragen soll[/U]. Oder weil der Weg von „Ich suche jemanden" bis „Ich frage an" zu umständlich ist. Und der Interessent ist dann nicht weg, weil Sie schlechter sind — er ist beim Anbieter, dessen Seite ihn schneller überzeugt hat.

METHODENFRAGE
[J]Deshalb meine Frage an Sie: Haben Sie schon einmal etwas von einer Conversion-Website-Analyse gehört?[/J] [R](still sein — antworten lassen)[/R]

WENN „NEIN / WAS IST DAS?"
Dabei schauen wir uns nicht an, ob eine Website schön aussieht. Wir prüfen, ob sie Vertrauen aufbaut, Ihr Angebot verständlich macht, Besucher sauber zur Anfrage führt — und ob Sie regional überhaupt gefunden werden. Also der komplette Weg: Wie wird jemand auf Sie aufmerksam? Was sieht er dann? Baut das Vertrauen auf? Führt es zur Anfrage? Und wo springen Menschen aktuell ab?

WENN „WAS IST IHNEN DENN BEI UNS AUFGEFALLEN?"
Gute Frage — ich mach's kurz, drei Sachen. [R](nicht alles verraten — der Termin bleibt relevant)[/R]
Erstens: In den ersten Sekunden auf Ihrer Seite wird nicht klar genug, was Sie für wen machen und [U]warum ausgerechnet Sie[/U].
Zweitens: Der Weg bis zur Anfrage ist umständlicher, als er sein müsste — da springen Leute ab, die eigentlich kaufbereit sind.
Drittens: Wenn jemand in Ihrer Region nach Ihrer Leistung sucht, tauchen Sie nicht dort auf, wo Sie stehen müssten.
Kein riesiger Fehler — aber genau da liegt Geld. Deshalb wollte ich Ihnen das sauber zeigen, statt es am Telefon halb zu erklären.

NEGATIVE CLOSE
[J]Wäre es dann die absolut schlechteste Idee, wenn ich Ihnen in einer [U]kostenlosen[/U] Analyse einmal zeige, welche Punkte auf Ihrer Seite gerade Anfragen kosten — und wir gemeinsam prüfen, ob das für Sie überhaupt relevant ist?[/J]

MECHANISMUS + EXKLUSIVITÄT [R](wenn Interesse da ist, kurz — nicht zerreden)[/R]
Wir betrachten Ihre Website nicht als digitale Visitenkarte, sondern als Vertrauens- und Anfragepfad: Jede wichtige Seite muss klar machen, wer Sie sind, was Sie anbieten, warum man Ihnen vertrauen sollte und welcher nächste Schritt sinnvoll ist. Dazu der regionale erste Eindruck — Google-Profil, Bewertungen, Auffindbarkeit.
Ich rufe Sie an, weil ich in Ihrer Region nicht zehn Betriebe aus derselben Branche gleichzeitig anspreche. [U]Wenn es passt, wäre es sinnvoll, dass Sie sich das anschauen, bevor Ihre Mitbewerber digital deutlich aktiver werden.[/U]

PROOF [R](nur echte, belegbare Beispiele nennen — sonst weglassen)[/R]
Bei ähnlichen Betrieben haben wir gesehen, dass nach der Umstellung deutlich mehr und vor allem hochwertigere Anfragen über die Seite kamen — weil der Interessent schon überzeugt ankommt statt preisvergleichend.

WENN ZWISCHENDURCH ABWEHR KOMMT [R](Kurzform — volle Antworten im Einwand-Panel)[/R]
„Kein Interesse" → Grundsätzlich nicht relevant, oder gerade schlechter Zeitpunkt? [R](isolieren, dann Termin)[/R]
„Haben schon jemanden" → Perfekt, dann sind Grundlagen da — ein zweiter, neutraler Blick kostet nichts.
„Schicken Sie was" → Mache ich gern, nur zeigt eine Mail nicht, was [U]bei Ihnen konkret[/U] auffällt. 20 Minuten, dann wissen Sie es.

→ Bei Interesse: direkt weiter in die Qualifizierung (Setter-Phase). Kein Preis, keine Leistungsdetails am Telefon.$s$
where title = 'HK ▸ Website — Opener';

update public.scripts set
  call_goal = 'Qualifizieren + festen, no-show-sicheren Termin für die kostenlose Website-Analyse setzen. Kein Preis, keine Detail-Analyse am Telefon.',
  tone_guidance = 'Beratend, strukturiert. Der Kunde verkauft sich den Termin selbst — Fragen stellen, zuhören, notieren. Termin immer über Alternativfragen, nie „Wann hätten Sie Zeit?".',
  qualifying_questions_json = '["Wann wurde Ihre Website zuletzt wirklich strategisch überarbeitet — nicht nur optisch?","Bekommen Sie über Website oder Google aktuell regelmäßig Anfragen?","Wissen Sie ungefähr, wie viele Besucher auf die Seite kommen?","Was ist die wichtigste Handlung, die ein Besucher machen soll: anrufen, Formular, Termin buchen?","Stellt die Website Ihr Unternehmen so hochwertig dar, wie Sie tatsächlich arbeiten — oder stört Sie selbst etwas daran?","Wie wichtig ist Ihnen das Thema auf einer Skala von 1 bis 10? (unter 7: Was würde bis zur 9 fehlen?)","Gab es mit früheren Webdesignern oder Agenturen Dinge, die nicht gut liefen und die wir nicht wiederholen dürfen?"]'::jsonb,
  required_notes_json = '["Bedarf in Kundenworten (Ziel + größter Störfaktor)","Skala-Wert 1–10 (+ was bis zur 9 fehlt)","Frühere Agentur-Erfahrungen / No-Gos","Wer entscheidet mit (Name/Rolle)","Termin + E-Mail bestätigt","Anti-No-Show-Frage gestellt + Antwort"]'::jsonb,
  full_script = $s$EINSTIEG IN DIE QUALIFIZIERUNG
Super. [G]Damit das Gespräch auch wirklich Sinn für Sie ergibt und Sie nicht Ihre Zeit verschwenden, gestatten Sie mir zwei, drei kurze Fragen.[/G] [R](Korthauer-Rahmung — der Kunde nennt seinen Bedarf selbst und verkauft sich den Termin innerlich)[/R]

QUALIFIZIERUNG [R](zuhören, notieren — die Antworten sind die Munition des Experten)[/R]
1. Wann wurde Ihre Website zuletzt wirklich [U]strategisch[/U] überarbeitet — nicht nur optisch?
2. Bekommen Sie über Website oder Google aktuell regelmäßig Anfragen?
3. Wissen Sie ungefähr, wie viele Besucher auf die Seite kommen?
4. Was ist die wichtigste Handlung, die ein Besucher machen soll — anrufen, Formular ausfüllen, Termin buchen?
5. Stellt die Website Ihr Unternehmen so hochwertig dar, wie Sie tatsächlich arbeiten — oder stört Sie [U]selbst[/U] etwas daran?
6. Wie wichtig ist Ihnen das Thema auf einer Skala von 1 bis 10? [R](unter 7 → „Was würde denn fehlen, damit es eine 9 wird?" — die Antwort ist der echte Bedarf)[/R]
7. Gab es mit früheren Webdesignern oder Agenturen Dinge, die nicht gut liefen? [R](No-Gos notieren — Vertrauensaufbau + Munition für den Closer)[/R]

ZUSAMMENFASSEN + WARUM JETZT
Alles klar. Basierend auf dem, was Sie mir gerade gesagt haben: [G]Das ist nichts, was wir nicht schon in ähnlicher Form gesehen und gelöst haben.[/G] Genau das schauen wir uns einmal konkret an Ihrem Beispiel an — [U]schwarz auf weiß[/U], wo Ihre Seite gerade Anfragen liegen lässt und wie Sie regional stärker gefunden werden. Bevor Ihre Mitbewerber digital deutlich aktiver werden.

WENN „SCHICKEN SIE MIR ERST MAL INFOS"
Kann ich machen — nur bringt eine allgemeine Mail erfahrungsgemäß wenig, weil ich Ihnen ja [U]konkret an Ihrem Beispiel[/U] zeigen wollte, was mir aufgefallen ist. Die Bestätigung mit allen Details bekommen Sie sofort nach dem Gespräch per Mail. [J]Lassen Sie uns die 20 Minuten direkt festmachen — passt eher morgen oder übermorgen?[/J]

TERMINABSCHLUSS [R](Alternativfragen — der Kunde entscheidet WANN, nicht OB)[/R]
Damit der Experte sich Ihre Seite vorher in Ruhe anschauen kann, schauen Sie kurz in den Kalender — ich hab meinen direkt offen:
[J]Passt Ihnen eher Anfang oder Ende nächster Woche?[/J] [R](antworten lassen)[/R]
[J]Eher vormittags oder nachmittags?[/J]
Ich könnte Ihnen [Tag 1] um [Uhrzeit 1] oder [Tag 2] um [Uhrzeit 2] anbieten. [J]Was passt besser?[/J]

BESTÄTIGUNG
Perfekt. Die Bestätigung sende ich Ihnen an [E-Mail], richtig? [R](E-Mail unbedingt verifizieren — steuert die automatische Bestätigungsmail)[/R]

WEITERE ENTSCHEIDER [R](Anti-No-Show Teil 1 — fehlende Entscheider sind der häufigste Deal-Killer)[/R]
Zwei letzte Fragen habe ich noch. Die erste aus Erfahrung: Gibt es jemanden in Ihrem Unternehmen, den Sie bei so einem Thema gerne direkt dabeihätten? Zum Beispiel ein zweiter Geschäftsführer, jemand aus dem Marketing, eine Assistenz — oder jemand aus der Familie, der mitentscheidet?

ANTI-NO-SHOW [R](Teil 2 — Commitment abholen, freundlich aber direkt)[/R]
[G]Und die zweite ist eine reine Routinefrage bei uns: Für mich ist wichtig, dass der Termin jetzt nicht nur gemacht wurde, damit ich am Telefon Ruhe gebe. Ist das Thema für Sie wirklich relevant genug, dass wir uns die 20 Minuten sauber anschauen?[/G] [R](bestätigen lassen — dieses Ja senkt No-Shows massiv)[/R]

VERBINDLICHE VERABSCHIEDUNG
Perfekt. Dann freue ich mich auf [Tag 1] um [Uhrzeit 1]. Wir zeigen Ihnen dann ganz konkret, wo aus unserer Sicht bei Ihrer Website aktuell Potenzial liegt und ob eine Zusammenarbeit Sinn ergibt. Ich bedanke mich für Ihr Vertrauen und wünsche Ihnen einen schönen Tag.$s$
where title = 'HK ▸ Website — Setter';

update public.scripts set
  call_goal = 'Analyse liefern (echter Wert!) → Bedarf bestätigen → Lücke rechnen → Lösung → Preis (erst jetzt!) → Abschluss. Zeigen, nicht verkaufen.',
  tone_guidance = 'Ehrlich, ruhig, Experte. Einen Punkt schenken, den der Kunde sofort selbst umsetzen kann. Nach Preis und Abschlussfrage: STILL SEIN. Wer zuerst spricht, verliert den Frame.',
  qualifying_questions_json = '["Was soll die Website vor allem leisten — mehr Anfragen, mehr Vertrauen, regionale Auffindbarkeit?","Was stört Sie selbst am meisten an der aktuellen Seite?","Wie viele Anfragen pro Monat gehen Ihrer Schätzung nach aktuell verloren?","Was ist ein durchschnittlicher Auftrag bei Ihnen wert? (für die Anker-Rechnung)"]'::jsonb,
  required_notes_json = '["Bestätigter Bedarf (2–3 Hebel)","Anker-Rechnung (verlorene Anfragen × Auftragswert)","Vereinbarter Umfang + genannter Preis","Einwände + wie aufgelöst","Startdatum + nächste Schritte / bei Nicht-Abschluss: fixierter Follow-up"]'::jsonb,
  full_script = $s$REFRAME [R](Druck raus = Offenheit rein. Erst danach in die Analyse.)[/R]
Schön, dass Sie sich die Zeit nehmen. [G]Kurz vorweg, wie das hier läuft: Das ist kein Verkaufsgespräch. Ich zeige Ihnen ehrlich, was ich an Ihrer Seite anders machen würde — konkret. Was Sie danach damit tun, entscheiden Sie völlig frei.[/G] Passt das so für Sie? [R](bestätigen lassen)[/R]

KONTEXT SCHÄRFEN
Bevor ich einsteige, zwei Fragen: Was soll Ihre Website vor allem leisten — mehr Anfragen, mehr Vertrauen, oder regional besser gefunden werden? Und was stört Sie [U]selbst[/U] aktuell am meisten daran? [R](Antworten aufgreifen — die Analyse an SEINEM Ziel aufhängen)[/R]

DIE ANALYSE — 5 HEBEL [R](am Bildschirm zeigen, konkret an seiner Seite. Regel: mindestens einen Punkt schenken, den er sofort selbst umsetzen kann — das beweist „kein Pitch".)[/R]
1. [U]Erster Eindruck (5-Sekunden-Test):[/U] Oben wird nicht sofort klar, was Sie für wen machen und warum Sie → klare Kernaussage + Nutzenversprechen nach oben.
2. [U]Weg zur Anfrage:[/U] Der nächste Schritt ist zu versteckt oder zu umständlich → ein sichtbarer Handlungsschritt oben und am Ende jeder Sektion.
3. [U]Vertrauen:[/U] Bewertungen, Gesichter, echte Projekte fehlen → Google-Bewertungen einbinden, 2–3 Referenzen, Team sichtbar.
4. [U]Mobil & Tempo:[/U] Auf dem Handy langsam oder verschoben — und über 70 % Ihrer Besucher kommen mobil → schlankeres, schnelleres Setup.
5. [U]Google & regional:[/U] Bei „[Leistung] + [Ort]" tauchen Sie zu weit unten auf → Google-Profil und Seitentexte gezielt darauf ausrichten.

MODERNE UMSETZUNG [R](Machbarkeit zeigen, Fragen zulassen)[/R]
Wie man das heute baut: schnelle moderne Frameworks, KI-gestützte Texte, Online-Terminbuchung direkt auf der Seite und sauberes Tracking, damit Sie sehen, woher Anfragen wirklich kommen. [U]Sowas steht heute in Tagen, nicht in Monaten.[/U]

BEDARF BESTÄTIGEN
Was ich bei Ihnen konkret sehe: Vor allem [Hebel 1–3] wären dran. Deckt sich das mit Ihrem Eindruck? [R](Ja abholen — er bestätigt den Bedarf selbst)[/R]

LÜCKE RECHNEN [R](der Anker — IMMER vor dem Preis)[/R]
Lassen Sie uns kurz rechnen: Was schätzen Sie, wie viele Anfragen pro Monat gehen gerade verloren, weil die Seite noch nicht überzeugt? … Sagen wir konservativ [X]. Bei Ihrem durchschnittlichen Auftragswert von [Y] sind das über ein Jahr [U]schnell [große Zahl][/U] — Geld, das aktuell einfach liegen bleibt. [R](Zahl stehen lassen, Pause)[/R]

LÖSUNG — NUR WAS NÖTIG IST
Auf Basis der Analyse setze ich für Sie genau die Bausteine an, die den Hebel bringen — [U]nicht mehr[/U]: [Schritt 1 → Schritt 2 → Schritt 3], live in [X] Wochen. Sie sehen an jedem Punkt, was passiert.

PREIS [R](erst jetzt — Bedarf → Aufwand → Preis. Danach STILL SEIN.)[/R]
[G]Den Preis nenne ich Ihnen bewusst erst jetzt, wo wir Ihren Bedarf kennen — nicht ins Blaue.[/G] Für den Umfang, den wir gerade besprochen haben, liegen wir bei [Preis]. [R](Preis nennen — dann schweigen. Wer zuerst spricht, verliert.)[/R]

EINWÄNDE [R](Muster: verstehen → isolieren → reframen. Nie diskutieren.)[/R]
„Zu teuer." → Verstehe ich. [U]Verglichen womit[/U] — mit dem Preis, oder mit den [große Zahl], die die aktuelle Seite Sie im Jahr kostet? Genau das haben wir ja gerade ausgerechnet.
„Ich muss überlegen." → Völlig legitim. Damit ich Sie richtig unterstütze: Überlegen Sie das [U]Ob[/U] oder das [U]Wie[/U]? [R](Ob → echten Einwand suchen. Wie → sofort Klarheit geben.)[/R]
„Ich muss das mit … besprechen." → Absolut richtig. Was wäre für ihn/sie der wichtigste Punkt? Am besten holen wir ihn/sie kurz dazu — wann sitzen Sie beide vor dem Kalender?
„Keine Zeit für die Umsetzung." → Genau deshalb übernehmen wir das — Ihr Aufwand ist ein kurzes Onboarding, den Rest machen wir.
„Wir sind schon mal verbrannt worden." → Und genau deshalb läuft es bei uns anders: Sie haben [U]gesehen[/U], was wir tun würden, bevor Sie einen Euro zahlen. Das Risiko lag bis hierhin komplett bei uns.
„Gerade kein Budget." → Verstehe. Wenn das Budget da wäre — wäre es dann ein Ja? [R](Ja → Start staffeln/terminieren. Nein → echten Einwand suchen.)[/R]
„Schicken Sie mir das Angebot." → Bekommen Sie schriftlich. Lassen Sie uns nur die offenen Fragen [U]jetzt[/U] klären, damit im Angebot nichts steht, was nicht passt. Was ist der eine Punkt, der Sie noch zögern lässt?
„Was, wenn es nicht funktioniert?" → Fair. Deshalb starten wir mit dem Baustein, der am schnellsten messbar ist — Sie sehen nach [X] Wochen schwarz auf weiß, ob die Richtung stimmt.

ABSCHLUSS
[J]Wenn es für Sie passt, machen wir es so: Start [Datum], das Onboarding kommt direkt im Anschluss, und in [X] Wochen ist die Seite live. Machen wir es so?[/J] [R](still sein)[/R]

WENN HEUTE KEIN ABSCHLUSS [R](nie offen rausgehen — immer fixierter nächster Schritt)[/R]
Verstehe ich. Dann lassen Sie uns den nächsten Schritt festmachen: Ich melde mich [Tag] um [Uhrzeit] — bis dahin wissen Sie, ob es beim Ob oder beim Wie hakt, und genau das klären wir dann. Einverstanden?$s$
where title = 'HK ▸ Website — Closer';

-- ── 3) SOCIAL MEDIA & BRANDING — voller Umfang ───────────────

update public.scripts set
  call_goal = 'Aufmachen mit starkem Pain (Vergleichbarkeit → Preisdruck). Gabelung raushören: Firma stärken → Firmen-Branding · Person ist Vertrauensfaktor → Personal-Branding. Gleicher Call.',
  tone_guidance = 'Frech-charmant, hoher Status. Der Pain muss sitzen: verglichen wird VOR dem Anruf. Bei Skeptikern: nicht diskutieren — prüfen lassen.',
  qualifying_questions_json = '[]'::jsonb,
  full_script = $s$EINSTIEG
Moin / Servus / Hallo Herr/Frau [Name], [ICH] hier von HK Growth.

[G]Wir haben vor einiger Zeit schon mal miteinander gesprochen wegen Ihrer digitalen Außenwirkung — damals war einfach ein bisschen zu viel los.[/G]
[R](Nur wenn wahr — sonst: „Ich hatte mir Ihren Betrieb notiert, weil mir Ihre Außenwirkung aufgefallen ist.")[/R]

Deshalb hab ich es mir heute nochmal auf die Agenda geschrieben, [U]Sie als Kunden zu gewinnen[/U]. [R](lachen)[/R] — also natürlich nicht genau heute. Aber ich hab mir Ihren Betrieb nochmal [U]ganz genau[/U] angeschaut.

[G]Und mir sind zwei, drei Parallelen zu einem unserer Kunden aufgefallen, bei dem wir durch einen klareren Unternehmensauftritt innerhalb weniger Wochen mehrere hochwertigere Anfragen erzeugen konnten.[/G] [R](kurze Pause)[/R]

DER PAIN [R](das Herzstück dieses Openers — nicht abkürzen)[/R]
Das Spannende bei Ihnen: Ihr Unternehmen wirkt fachlich stark. Aber wenn man Sie online mit zwei, drei anderen Anbietern aus Ihrer Region vergleicht, wird in den ersten Sekunden noch nicht klar genug, [U]warum man ausgerechnet Ihnen mehr vertrauen sollte[/U].
Und genau da verlieren viele Unternehmer Geld, ohne es direkt zu merken. Nicht, weil sie schlecht arbeiten — sondern weil Interessenten heute [U]vergleichen, bevor sie überhaupt anrufen[/U]. Wenn der Unterschied nach außen nicht klar ist, entscheidet der Kunde über den Preis, fragt gar nicht erst an, oder geht zu dem Anbieter, der professioneller wirkt.

METHODENFRAGE
[J]Deshalb meine Frage an Sie: Haben Sie schon mal etwas von regionaler Marken-Dominanz gehört?[/J] [R](still sein — antworten lassen)[/R]

WENN „NEIN, WAS IST DAS?"
Wir haben eine Möglichkeit entwickelt, mit der Unternehmen in ihrer Region nicht mehr nur als irgendein weiterer Anbieter wahrgenommen werden, sondern als die [U]deutlich vertrauenswürdigere und hochwertigere Wahl[/U]. Also nicht über ein neues Logo oder schöne Farben — sondern darüber, dass der komplette Außenauftritt sofort klar macht: Warum sollte ein Kunde Ihnen vertrauen? Warum wirken Sie hochwertiger? Warum sollte jemand bei Ihnen anfragen, obwohl es noch drei andere Anbieter gibt?

WENN „WAS IST IHNEN DENN BEI UNS AUFGEFALLEN?"
Gute Frage. Ich mache es kurz — drei Sachen.
Erstens: Ihr Betrieb wirkt grundsätzlich solide, aber online noch nicht so stark, wie er wahrscheinlich in der Realität ist.
Zweitens: Wenn man Sie mit anderen Anbietern aus der Region vergleicht, wird noch nicht schnell genug klar, warum ein Kunde ausgerechnet bei Ihnen anfragen sollte.
Und drittens: Ihr Auftritt erklärt aktuell mehr, [U]was[/U] Sie machen — aber noch zu wenig, [U]warum Sie die bessere Wahl sind[/U].
Das ist kein riesiger Fehler, aber genau da liegt oft Geld. Weil Interessenten nicht erst im Gespräch entscheiden, sondern schon vorher beim ersten Eindruck. Deshalb wollte ich Ihnen das einmal sauber zeigen, statt es am Telefon halb zu erklären.

NEGATIVE CLOSE
[J]Wäre es dann die absolut schlechteste Idee, wenn ich Ihnen in einer [U]kostenlosen[/U] Analyse einmal zeige, wie wir das bei dem anderen Unternehmen aufgebaut haben — und wir gemeinsam prüfen, ob das auch für Ihren Betrieb funktionieren würde?[/J]

EINWAND-VERZWEIGUNGEN [R](die vier Klassiker in diesem Pfeiler)[/R]
„Wir brauchen kein Branding." → Verstehe ich. Dann geht es wahrscheinlich auch nicht um Branding im klassischen Sinne — kein Logo, keine Farben, kein Agenturzeug. Mir geht es um die Frage: Wenn ein Kunde Sie und zwei Wettbewerber online vergleicht, gewinnt Ihr Auftritt dann sofort Vertrauen — oder wirken alle relativ ähnlich? Weil genau da am Ende [U]Preisdruck[/U] entsteht.
„Wir bekommen genug Anfragen." → Sehr gut, dann funktioniert grundsätzlich schon einiges. Die Frage ist dann nicht, [U]ob[/U] Anfragen kommen, sondern welche [U]Qualität[/U] sie haben: viele Preisvergleicher — oder die richtigen Kunden, die schon mit Vertrauen ankommen? Genau das ist bei Branding oft der Hebel: nicht mehr Anfragen, sondern hochwertigere mit weniger Preisdruck.
„Unsere Kunden kommen über Empfehlung." → Perfekt — dann ist der Online-Auftritt sogar noch wichtiger. Der Ablauf ist ja meistens so: Jemand bekommt Ihren Namen empfohlen, googelt Sie, und entscheidet in wenigen Sekunden, ob das Vertrauen bestätigt wird — oder ob er doch noch zwei andere vergleicht. Die Empfehlung erzeugt Interesse. [U]Ihr Auftritt muss dieses Vertrauen bestätigen.[/U]
„Wir haben schon eine Website." → Ja, davon gehe ich aus. Die Frage ist nicht, ob Sie eine haben — sondern ob Ihr kompletter Außenauftritt stark genug [U]verkauft[/U], warum Sie hochwertiger und vertrauenswürdiger sind. Viele Websites informieren nur. Wenige positionieren wirklich.

MECHANISMUS + EXKLUSIVITÄT [R](kurz — Gabelung beachten)[/R]
Firmen-Branding: Wir bauen aus Ihrem Unternehmen ein sichtbares Vertrauenssystem — Strategie, Themen, Content, Wiedererkennbarkeit, regelmäßige Veröffentlichung.
Personal-Branding: Wir übersetzen Ihre Erfahrung und Haltung in Inhalte, die Kompetenz und Vertrauen erzeugen — ohne künstliche Show.
Ich spreche das bewusst zuerst mit Ihnen und nicht mit zehn Betrieben aus Ihrer Region gleichzeitig.

→ Bei Interesse: weiter in die Qualifizierung (Setter-Phase).$s$
where title = 'HK ▸ Social & Branding — Opener';

update public.scripts set
  call_goal = 'Qualifizieren + Gabelung (Firmen-/Personal-Branding) sauber raushören + festen Termin für die kostenlose Marken-Analyse setzen.',
  tone_guidance = 'Zuhören, Gabelung notieren — sie entscheidet, was der Experte vorbereitet. Termin über Alternativfragen, Anti-No-Show Pflicht.',
  qualifying_questions_json = '["Wenn ein Kunde Sie und zwei Wettbewerber online vergleicht: Wird sofort klar, warum er sich für Sie entscheiden sollte?","Haben Sie manchmal das Gefühl, dass Interessenten Ihre Leistung mit anderen vergleichen, obwohl Sie auf einem anderen Qualitätsniveau arbeiten?","Kommen Ihre besten Kunden eher über Empfehlung, online oder über bestehende Kontakte?","Wenn jemand Sie empfohlen bekommt und danach online prüft: Bestätigt Ihr Auftritt dieses Vertrauen stark genug?","Was ist Ihnen bei Ihrer Außenwirkung am wichtigsten: Hochwertigkeit, Vertrauen, mehr Anfragen oder weniger Preisdruck?","(Gabelung:) Bauen Kunden eher wegen der Firma Vertrauen auf — oder auch wegen Ihnen als Person? Und was möchten Sie auf keinen Fall: zu laut, zu künstlich, zu influencer-mäßig?","Wie wichtig ist es Ihnen auf einer Skala von 1 bis 10, in Ihrer Region als die klar vertrauenswürdigere Wahl wahrgenommen zu werden?"]'::jsonb,
  required_notes_json = '["Gabelung: Firmen- oder Personal-Branding (+ No-Gos)","Bedarf in Kundenworten","Anfragen-Qualität heute (Preisvergleicher vs. Wunschkunden)","Skala-Wert 1–10","Wer entscheidet mit","Termin + E-Mail bestätigt","Anti-No-Show gestellt + Antwort"]'::jsonb,
  full_script = $s$EINSTIEG IN DIE QUALIFIZIERUNG
Herr/Frau [Name], sehr schön. [G]Damit das folgende Gespräch für Sie auch wirklich Sinn ergibt und Sie nicht Ihre Zeit verschwenden, gestatten Sie mir zwei, drei kurze Fragen.[/G]

QUALIFIZIERUNG [R](Frage 6 ist die Gabelung — sie entscheidet, was der Experte vorbereitet!)[/R]
1. Wenn ein Kunde Sie und zwei Wettbewerber online vergleicht: Wird aus Ihrer Sicht sofort klar, warum er sich für [U]Sie[/U] entscheiden sollte?
2. Haben Sie manchmal das Gefühl, dass Interessenten Ihre Leistung mit anderen vergleichen, obwohl Sie eigentlich auf einem anderen Qualitätsniveau arbeiten?
3. Kommen Ihre besten Kunden eher über Empfehlung, online oder über bestehende Kontakte?
4. Wenn jemand Sie empfohlen bekommt und danach online prüft: Bestätigt Ihr Auftritt dieses Vertrauen stark genug?
5. Was ist Ihnen bei Ihrer Außenwirkung besonders wichtig — Hochwertigkeit, Vertrauen, Klarheit, mehr Anfragen oder [U]weniger Preisdruck[/U]?
6. [R](Gabelung:)[/R] Würden Sie sagen, Kunden bauen eher wegen der Firma Vertrauen auf — oder auch wegen [U]Ihnen als Person[/U]? Und was möchten Sie auf keinen Fall — zu laut, zu künstlich, zu influencer-mäßig? [R](Antwort bestimmt: Firmen- vs. Personal-Branding + No-Gos notieren)[/R]
7. Wie wichtig ist es Ihnen auf einer Skala von 1 bis 10, in Ihrer Region als die klar vertrauenswürdigere Wahl wahrgenommen zu werden? [R](unter 7 → „Was fehlt bis zur 9?")[/R]

ZUSAMMENFASSEN + WARUM JETZT
Alles klar. Basierend auf dem, was Sie mir gerade gesagt haben: [G]Das ist nichts, was ich nicht schon bei anderen Unternehmen gesehen habe.[/G] Bei Ihnen geht es aus meiner Sicht nicht darum, irgendwas schön zu machen. Es geht darum, Ihre [U]echte Qualität[/U] nach außen so klar zu zeigen, dass Kunden, Bewerber und Partner schneller verstehen, warum sie Ihnen vertrauen sollten. Damit ich Ihnen das einmal konkret an Ihrem Beispiel zeigen kann — [U]und wir uns auch anschauen, wie Ihre Konkurrenz aktuell nach außen wirkt[/U] — schauen Sie mal kurz in den Kalender.

WENN „SCHICKEN SIE MIR ERST MAL INFOS"
Kann ich machen — nur bringt eine allgemeine Mail wenig, weil ich es Ihnen [U]konkret an Ihrem Beispiel[/U] und im Vergleich zu Ihrem Wettbewerb zeigen wollte. [J]Lassen Sie uns die 20 Minuten direkt festmachen — eher morgen oder übermorgen?[/J]

TERMINABSCHLUSS
[J]Passt es Ihnen eher Anfang oder Ende nächster Woche?[/J] [R](antworten lassen)[/R]
[J]Eher vormittags oder nachmittags?[/J]
Ich könnte Ihnen [Tag 1] um [Uhrzeit 1] oder [Tag 2] um [Uhrzeit 2] anbieten. [J]Was passt Ihnen besser?[/J]

BESTÄTIGUNG
Alles klar, die Bestätigung für den Termin sende ich dann an [E-Mail], richtig? Perfekt.

WEITERE ENTSCHEIDER
Zwei letzte Fragen habe ich allerdings noch an Sie. Die erste entsteht aus der Erfahrung heraus: Gibt es irgendjemanden in Ihrem Unternehmen, den Sie gerne in unser Gespräch mit dazunehmen möchten? Zum Beispiel einen zweiten Geschäftsführer, Ihre Frau oder Ihren Mann, jemanden aus dem Marketing — oder jemanden, der bei solchen Entscheidungen mitredet?

ANTI-NO-SHOW
[G]Und die zweite Frage ist mittlerweile einfach eine reine Routinefrage bei uns geworden: Für mich ist wichtig, dass Sie den Termin jetzt nicht nur gemacht haben, damit ich endlich Ruhe gebe — sondern dass das Thema für Sie wirklich relevant ist. Ist das ein echtes Thema, das wir uns einmal sauber anschauen sollten?[/G] [R](bestätigen lassen)[/R]

VERBINDLICHE VERABSCHIEDUNG
Perfekt. Dann bis [Tag 1] um [Uhrzeit 1]. Wir zeigen Ihnen dann konkret, wie Sie in Ihrer Region zur klar vertrauenswürdigeren Wahl werden. Vielen Dank für Ihr Vertrauen und einen schönen Tag.$s$
where title = 'HK ▸ Social & Branding — Setter';

update public.scripts set
  call_goal = 'Marken-Analyse liefern (inkl. Wettbewerbs-Vergleich!) → Gabelung bestätigen → Lücke rechnen (Preisdruck) → Lösung (Drehtag-System) → Preis → Abschluss.',
  tone_guidance = 'Zeigen statt behaupten — der Wettbewerbs-Vergleich am Bildschirm ist der stärkste Moment dieses Calls. Nach dem Preis: still sein.',
  qualifying_questions_json = '["Was soll die Außenwirkung vor allem bewirken — hochwertigere Kunden, weniger Preisdruck, bessere Bewerber?","Wofür sollen Menschen Sie in einem Satz kennen?","Was kostet Sie der aktuelle Preisdruck bzw. die Vergleichbarkeit (Schätzung)?"]'::jsonb,
  required_notes_json = '["Gabelung bestätigt (Firmen/Personal + No-Gos)","Bestätigter Bedarf (Hebel)","Anker-Zahl (Preisdruck/Wunschkunden)","Umfang + genannter Preis","Einwände + Auflösung","Startdatum + Drehtag-Termin / bei Nicht-Abschluss: fixierter Follow-up"]'::jsonb,
  full_script = $s$REFRAME
Schön, dass Sie sich die Zeit nehmen. [G]Kurz vorweg: Das ist kein Verkaufsgespräch. Ich zeige Ihnen ehrlich, wie Ihre Marke im Vergleich zu Ihrem Wettbewerb nach außen wirkt und wo Sie am schnellsten unverwechselbar werden. Was Sie danach damit machen, entscheiden Sie völlig frei.[/G] Passt das? [R](bestätigen lassen)[/R]

KONTEXT SCHÄRFEN
Bevor ich einsteige: Was soll Ihre Außenwirkung vor allem bewirken — hochwertigere Kunden, weniger Preisdruck, bessere Bewerber? Und: Wofür sollen Menschen Sie [U]in einem Satz[/U] kennen? [R](Gabelung aus dem Setter-Kontext bestätigen: Firma oder Person?)[/R]

DIE ANALYSE — 5 HEBEL [R](Höhepunkt: Ihren Auftritt LIVE neben 2 Wettbewerber legen — dieser Moment verkauft)[/R]
1. [U]Positionierung / roter Faden:[/U] Wofür stehen Sie in einem Satz? Aktuell noch austauschbar → spitze Kernbotschaft.
2. [U]Wettbewerbs-Vergleich:[/U] [R](live zeigen)[/R] Neben diesen zwei Anbietern — warum Sie? Das wird noch nicht hart genug sichtbar.
3. [U]Vertrauen & Gesicht:[/U] Menschen folgen Menschen, nicht Logos → Sie/Ihr Team sichtbar, echte Referenzen, Bewertungen.
4. [U]Wiedererkennbarkeit & Konsistenz:[/U] Website, Social, Google wirken uneinheitlich → ein einprägsames Bild über alle Kanäle.
5. [U]Regelmäßigkeit:[/U] Ohne Rhythmus kein Vertrauensaufbau → planbarer Content statt „ab und zu posten".

MODERNE UMSETZUNG
Wie das heute läuft: ein Content-System, das aus [U]einem Drehtag[/U] Material für Wochen macht — vorher Themen und Botschaften planen, danach als Reels, Beiträge, Website- und Anzeigen-Material verwerten. KI-gestützte Produktion, gezielte Distribution. Kein „jeden Tag selbst posten müssen".

BEDARF BESTÄTIGEN
Was ich bei Ihnen sehe: Vor allem [Hebel 1–3] wären dran — bei Ihnen als [Firma/Person]. Deckt sich das mit Ihrem Eindruck? [R](Ja abholen)[/R]

LÜCKE RECHNEN [R](Anker VOR dem Preis)[/R]
Rechnen wir kurz: Was kostet es Sie, dass Sie aktuell über den [U]Preis[/U] verglichen werden statt über Vertrauen? Schon [X] Prozent mehr durchsetzbarer Preis — oder [X] Wunschkunden mehr im Jahr — ergeben [U][große Zahl][/U]. [R](stehen lassen)[/R]

LÖSUNG — NUR WAS NÖTIG IST
Auf Basis der Analyse: [Positionierung schärfen → erster Content-Drehtag → Distribution & Rhythmus] — in [X] Wochen nach außen sichtbar.

PREIS [R](erst jetzt — dann still sein)[/R]
[G]Den Preis nenne ich erst jetzt, wo wir Ihren Bedarf kennen — nicht ins Blaue.[/G] Für den Umfang liegen wir bei [Preis].

EINWÄNDE [R](verstehen → isolieren → reframen)[/R]
„Zu teuer." → Verglichen womit — mit dem Preis, oder mit dem Preisdruck, den ein austauschbarer Auftritt Sie [U]jeden Monat[/U] kostet?
„Bringt Branding wirklich was?" → Nicht Branding an sich. Sondern dass Kunden Sie schneller als die hochwertigere Wahl erkennen — genau das haben wir gerade an Ihrem Wettbewerb gesehen.
„Ich muss überlegen." → Das [U]Ob[/U] oder das [U]Wie[/U]? Beim Wie gebe ich Ihnen sofort Klarheit.
„Ich muss das mit … besprechen." → Richtig so. Was wäre für ihn/sie der wichtigste Punkt? Am besten beim nächsten Mal direkt dazu — wann sitzen Sie beide vor dem Kalender?
„Gerade kein Budget." → Wenn das Budget da wäre — wäre es ein Ja? [R](isolieren)[/R]
„Zu künstlich / nicht mein Stil." → Genau deshalb haben wir Ihre No-Gos notiert: [No-Gos]. Wir bauen [U]Ihre[/U] echte Art aus — keine Show.
„Schicken Sie das Angebot." → Bekommen Sie schriftlich — lassen Sie uns nur den einen offenen Punkt jetzt klären. Was lässt Sie noch zögern?
„Was, wenn es nicht wirkt?" → Deshalb starten wir mit dem am schnellsten messbaren Baustein — nach [X] Wochen sehen Sie schwarz auf weiß, ob die Richtung stimmt.

ABSCHLUSS
[J]Wenn es passt: Start [Datum], erster Drehtag [Datum], in [X] Wochen sichtbar. Machen wir es so?[/J] [R](still sein)[/R]

WENN HEUTE KEIN ABSCHLUSS
Dann fixieren wir den nächsten Schritt: Ich melde mich [Tag] um [Uhrzeit] — bis dahin klären Sie das [Ob/Wie], und genau da machen wir weiter. Einverstanden?$s$
where title = 'HK ▸ Social & Branding — Closer';

-- ── 4) KI-INTEGRATION — voller Umfang ────────────────────────

update public.scripts set
  call_goal = 'Aufmachen + Interesse gewinnen. Pain: liegengebliebene Anfragen + manuelles Chaos = unsichtbar verlorener Umsatz.',
  tone_guidance = 'Nüchtern-konkret, kein Tech-Sprech. Der Pain ist Zeit + verpuffter Umsatz, nicht „KI ist cool". Gestresste Entscheider lieben dieses Thema — kurz bleiben.',
  qualifying_questions_json = '[]'::jsonb,
  full_script = $s$EINSTIEG
Moin / Servus / Hallo Herr/Frau [Name], [ICH] hier von HK Growth.

[G]Wir haben vor knapp zwei Monaten schon einmal miteinander gesprochen — damals war zu dem Zeitpunkt einfach ein bisschen zu viel los.[/G]
[R](Nur wenn wahr — sonst: „Ich hatte mir Ihren Betrieb notiert, weil mir Ihre digitale Struktur aufgefallen ist.")[/R]

Deshalb hab ich es mir heute nochmal auf die Agenda geschrieben, [U]Sie als Kunden zu gewinnen[/U]. [R](lachen)[/R] — also natürlich nicht genau heute. Aber ich hab mir Ihren Betrieb und Ihre digitale Struktur nochmal [U]ganz genau[/U] angeschaut.

[G]Und mir sind da zwei, drei Parallelen zu einem unserer Kunden aufgefallen, der mit uns in den letzten zwei Monaten sein digitales Wachstum auf die nächste Stufe bringen konnte.[/G] [R](kurze Pause)[/R]

DER PAIN
Viele Unternehmen [U]bekommen[/U] Anfragen, Kontakte, Bewerbungen — das Problem ist, was danach passiert: Es fehlt ein sauberes System für Nachverfolgung, Terminierung, Angebote, Rechnungen oder Wiedervorlage. Anfragen werden zu spät beantwortet, Angebote bleiben liegen, gute Kontakte versanden. [U]Da bleibt jeden Monat Umsatz liegen, ohne dass man es merkt[/U] — und das Team verliert Stunden an Aufgaben, die längst automatisch laufen könnten.

METHODENFRAGE
[J]Deshalb meine Frage an Sie: Haben Sie schon einmal etwas von einem digitalen Prozess-Wachstums-System gehört?[/J] [R](still sein — antworten lassen)[/R]

WENN „NEIN / WAS IST DAS?"
Dabei verbinden wir Ihre Kontaktwege, Formulare, CRM, E-Mails, Erinnerungen und internen Abläufe — inklusive KI-Integration — so, dass [U]weniger liegen bleibt[/U] und mehr aus bestehenden Kontakten entsteht. Anfrage kommt rein, wird sauber erfasst, richtig zugeordnet, nachverfolgt und zum nächsten Schritt geführt. Automatisch.

WENN „WAS IST IHNEN DENN BEI UNS AUFGEFALLEN?"
Kurz gesagt, drei Dinge:
Erstens: Bei Ihnen läuft erkennbar vieles über persönlichen Einsatz — das funktioniert, skaliert aber nicht.
Zweitens: Zwischen Anfrage und Antwort vergeht Zeit, in der ein Interessent längst beim schnelleren Wettbewerber gelandet sein kann.
Und drittens: Es gibt bei Ihnen mit hoher Wahrscheinlichkeit zwei, drei Abläufe — Angebote, Rechnungen, Nachfassen — die heute Stunden fressen und morgen automatisch laufen könnten.
Genau das würde ich Ihnen gerne konkret zeigen, statt es am Telefon halb zu erklären.

NEGATIVE CLOSE
[J]Wäre es die absolut schlechteste Idee, wenn ich Ihnen in einer [U]kostenlosen[/U] Analyse einmal zeige, wo Unternehmen typischerweise Anfragen oder Kontakte verlieren — und wie das bei Ihnen sauberer laufen könnte?[/J]

MECHANISMUS + EXKLUSIVITÄT [R](kurz)[/R]
Das Ziel ist nicht Automatisierung um der Automatisierung willen. Es geht darum, dass [U]kein guter Kontakt verloren geht[/U] — und Ihr Team die Zeit zurückbekommt, die heute in Routine verschwindet.
Ich spreche das bewusst zuerst mit Ihnen und nicht mit zehn Betrieben aus Ihrer Branche gleichzeitig — wenn es passt, wäre es sinnvoll, dass Sie [U]vorne dran[/U] sind, bevor Ihre Mitbewerber ihre Abläufe digital sauberer aufstellen.

WENN ZWISCHENDURCH ABWEHR KOMMT [R](Kurzform)[/R]
„Kein Interesse" → Grundsätzlich, oder gerade schlechter Zeitpunkt? [R](isolieren)[/R]
„Unsere IT macht das" → Perfekt, dann gibt es Grundlagen — die Frage ist nur, ob Kapazität und KI-Erfahrung da sind. Ein neutraler Blick kostet nichts.
„Keine Zeit" → Genau [U]deshalb[/U] rufe ich an. Das Thema ist Zeit.

→ Bei Interesse: weiter in die Qualifizierung (Setter-Phase).$s$
where title = 'HK ▸ KI-Automation — Opener';

update public.scripts set
  call_goal = 'Qualifizieren + festen Termin für die kostenlose Automations-Analyse setzen. Die Kosten-Frage (4) ist der spätere Anker des Closers — sauber notieren!',
  tone_guidance = 'Konkret nach Abläufen fragen, nicht nach Technik. Exklusivität nur, wenn wahr. Termin über Alternativfragen.',
  qualifying_questions_json = '["Was passiert aktuell Schritt für Schritt, wenn eine neue Anfrage reinkommt?","Gibt es ein CRM — oder läuft vieles über E-Mail, WhatsApp und Excel?","Werden Interessenten automatisch nachverfolgt, oder hängt das an einzelnen Personen?","Gibt es Termine, Angebote oder Rechnungen, die manchmal liegen bleiben?","Was kostet es Sie ungefähr, wenn eine gute Anfrage nicht sauber bearbeitet wird? (Anker für den Closer!)","Wo ist aktuell am meisten Chaos: Vertrieb, Kundenservice, Projektstart, Rechnung oder Nachverfolgung?","Wie wichtig ist mehr Struktur auf einer Skala von 1 bis 10?"]'::jsonb,
  required_notes_json = '["Ist-Ablauf bei neuer Anfrage (Schritt für Schritt)","CRM ja/nein + verwendete Tools","Was bleibt liegen (konkret)","Kosten-Schätzung pro verlorener Anfrage (ANKER für Closer!)","Größtes Chaos-Feld","Skala-Wert","Wer entscheidet mit (IT? GF?)","Termin + E-Mail bestätigt","Anti-No-Show gestellt + Antwort"]'::jsonb,
  full_script = $s$EINSTIEG IN DIE QUALIFIZIERUNG
Super. [G]Damit der Experte gezielt auf Ihre Abläufe schauen kann und das Gespräch wirklich Sinn für Sie ergibt, gestatten Sie mir ein paar kurze Fragen.[/G]

QUALIFIZIERUNG [R](Frage 5 ist Gold — die Antwort ist der Anker des Closers. Sauber notieren!)[/R]
1. Was passiert aktuell Schritt für Schritt, wenn eine neue Anfrage reinkommt?
2. Gibt es ein CRM — oder läuft vieles über E-Mail, WhatsApp und Excel?
3. Werden Interessenten automatisch nachverfolgt — oder hängt das daran, dass jemand daran denkt?
4. Gibt es Termine, Angebote oder Rechnungen, die manchmal [U]liegen bleiben[/U]?
5. Was kostet es Sie ungefähr, wenn eine gute Anfrage nicht sauber bearbeitet wird? [R](Antwort wörtlich notieren — der Closer rechnet damit den Anker)[/R]
6. Wo ist aktuell am meisten Chaos: Vertrieb, Kundenservice, Projektstart, Rechnung oder Nachverfolgung?
7. Wie wichtig ist mehr Struktur auf einer Skala von 1 bis 10? [R](unter 7 → „Was fehlt bis zur 9?")[/R]

ZUSAMMENFASSEN + WARUM JETZT
Alles klar. Basierend auf dem, was Sie sagen: [G]Das sind genau die Muster, die wir kennen — und die sich am schnellsten beheben lassen.[/G] Der Experte zeigt Ihnen konkret, welche zwei, drei Abläufe bei Ihnen am meisten Zeit fressen und was davon heute automatisierbar wäre. Ich spreche das bewusst zuerst mit Ihnen und nicht mit zehn Betrieben aus Ihrer Branche gleichzeitig — [U]wenn es passt, wäre es sinnvoll, dass Sie vorne dran sind[/U].

WENN „SCHICKEN SIE MIR ERST MAL INFOS"
Kann ich machen — nur bringt eine allgemeine Mail wenig, weil ich es [U]konkret an Ihren Abläufen[/U] zeigen wollte. Die Bestätigung mit allen Details kommt sofort nach dem Gespräch. [J]Lassen Sie uns die 20 Minuten direkt festmachen — eher morgen oder übermorgen?[/J]

TERMINABSCHLUSS
[J]Passt Ihnen eher Anfang oder Ende nächster Woche?[/J] [R](antworten lassen)[/R]
[J]Eher vormittags oder nachmittags?[/J]
Ich könnte Ihnen [Tag 1] um [Uhrzeit 1] oder [Tag 2] um [Uhrzeit 2] anbieten. [J]Was passt besser?[/J]

BESTÄTIGUNG
Perfekt. Die Bestätigung sende ich an [E-Mail], richtig?

WEITERE ENTSCHEIDER
Zwei letzte Fragen. Erstens: Gibt es jemanden, den Sie bei dem Thema gerne direkt dabeihätten — Geschäftsführung, jemand aus der IT, oder wer bei Ihnen über Abläufe entscheidet?

ANTI-NO-SHOW
[G]Und zweitens, reine Routinefrage: Für mich ist wichtig, dass der Termin nicht nur gemacht wurde, damit ich Ruhe gebe. Ist das Thema für Sie wirklich relevant genug, dass wir uns die 20 Minuten sauber anschauen?[/G] [R](bestätigen lassen)[/R]

VERBINDLICHE VERABSCHIEDUNG
Perfekt, dann bis [Tag 1] um [Uhrzeit 1]. Wir zeigen Ihnen dann konkret, wo bei Ihnen Zeit und Anfragen verloren gehen — und was sich davon automatisch lösen lässt. Vielen Dank für Ihr Vertrauen und einen schönen Tag.$s$
where title = 'HK ▸ KI-Automation — Setter';

update public.scripts set
  call_goal = 'Automations-Analyse liefern → Zeit/Geld-Anker rechnen (mit der Setter-Zahl!) → Lösung → Preis (erst jetzt) → Abschluss.',
  tone_guidance = 'Rechnen statt behaupten: Stunden × Kosten + verlorene Anfragen = Anker. Kein Tech-Sprech — Abläufe und Ergebnisse. Nach dem Preis: still sein.',
  qualifying_questions_json = '["Was würde am meisten helfen — Zeit im Team freispielen, schnellere Reaktion, oder mehr aus bestehenden Anfragen machen?","Welcher Ablauf nervt Sie selbst am meisten?","Wie viele Stunden pro Woche stecken im Team in Routine (Schätzung)?","Wie viele Anfragen pro Monat gehen durch langsame/fehlende Nachverfolgung verloren?"]'::jsonb,
  required_notes_json = '["Priorisierte Abläufe 1–3","Anker-Rechnung (Stunden × Kosten + verlorene Anfragen — Setter-Zahl nutzen)","Umfang + genannter Preis","Einwände + Auflösung","Startdatum + erste Automation / bei Nicht-Abschluss: fixierter Follow-up"]'::jsonb,
  full_script = $s$REFRAME
Schön, dass Sie sich die Zeit nehmen. [G]Kurz vorweg: Das ist kein Verkaufsgespräch. Ich zeige Ihnen ehrlich, welche Abläufe bei Ihnen aktuell am meisten Zeit fressen und was davon heute automatisierbar wäre. Was Sie danach damit machen, entscheiden Sie völlig frei.[/G] Passt das? [R](bestätigen lassen)[/R]

KONTEXT SCHÄRFEN
Bevor ich einsteige: Was würde Ihnen am meisten helfen — Zeit im Team freispielen, schneller auf Anfragen reagieren, oder mehr aus den Anfragen machen, die schon reinkommen? Und welcher Ablauf nervt Sie [U]selbst[/U] am meisten? [R](Setter-Notizen aufgreifen: „Mein Kollege hat mir erzählt, dass bei Ihnen vor allem … Thema ist")[/R]

DIE ANALYSE — 5 HEBEL [R](an SEINEN Abläufen konkret machen — die Setter-Notizen sind die Landkarte)[/R]
1. [U]Anfrage-Handling:[/U] Automatische Sofort-Reaktion auf jede Anfrage → kein Lead bleibt liegen, kein Wettbewerber ist schneller.
2. [U]Termine, Angebote, Rechnungen:[/U] Buchung, Angebotserstellung, Rechnungslauf und Erinnerungen laufen automatisch → kein Hinterherlaufen mehr.
3. [U]Wiederkehrende Handarbeit:[/U] Nachfassen, Datenpflege, Wiedervorlage → einmal aufgesetzt, läuft dauerhaft.
4. [U]KI-Assistent:[/U] FAQ, Erstauskunft, Vorqualifizierung — rund um die Uhr, auch samstagabends, wenn der Kunde tatsächlich sucht.
5. [U]Reporting:[/U] Anfragen und Umsatz auf einen Blick — ohne Excel-Bastelei am Monatsende.

MODERNE UMSETZUNG
KI-Agenten und Workflow-Automationen, angebunden an Ihre [U]bestehenden[/U] Tools — kein Systemwechsel, keine Umstellung fürs Team, eine Schicht Automatisierung obendrauf. Das meiste ist in Tagen live, nicht in Monaten.

BEDARF BESTÄTIGEN
Was ich bei Ihnen sehe: Vor allem [Ablauf 1–3] wären dran. Deckt sich das mit Ihrem Eindruck? [R](Ja abholen)[/R]

LÜCKE RECHNEN [R](Anker VOR dem Preis — die Setter-Zahl aus Frage 5 verwenden!)[/R]
Rechnen wir kurz — Sie hatten meinem Kollegen gesagt, eine nicht sauber bearbeitete Anfrage kostet Sie etwa [Setter-Zahl]: [X] Stunden pro Woche Routine × Stundenkosten + [X] verlorene Anfragen im Monat → über ein Jahr [U][große Zahl][/U]. [G]Das ist der Betrag, der aktuell einfach verpufft.[/G] [R](stehen lassen)[/R]

LÖSUNG — NUR WAS NÖTIG IST
Auf Basis der Analyse setze ich genau die Automationen an, die den Hebel bringen: [Ablauf 1 → 2 → 3]. Die erste läuft in [X] Wochen — Sie merken den Unterschied im Alltag sofort.

PREIS [R](erst jetzt — dann still sein)[/R]
[G]Den Preis nenne ich erst jetzt, wo wir Ihren Bedarf kennen — nicht ins Blaue.[/G] Für den Umfang liegen wir bei [Preis].

EINWÄNDE [R](verstehen → isolieren → reframen)[/R]
„Zu teuer." → Verglichen womit — mit dem Preis, oder mit den [große Zahl], die aktuell [U]jedes Jahr[/U] verpuffen? Die Rechnung haben wir gerade gemacht.
„Das macht unsere IT selbst." → Perfekt, dann gibt es Grundlagen. Die Frage ist Kapazität und KI-Erfahrung — genau da springen wir ein, und Ihre IT behält die Hoheit.
„Ich muss überlegen." → Das [U]Ob[/U] oder das [U]Wie[/U]? Beim Wie gebe ich Ihnen sofort Klarheit.
„Ich muss das mit … besprechen." → Richtig. Was wäre für ihn/sie der wichtigste Punkt? Am besten direkt dazuholen — wann sitzen Sie beide vor dem Kalender?
„Keine Zeit für die Umstellung." → Genau deshalb übernehmen wir das — Ihr Aufwand ist ein kurzes Onboarding, es gibt keinen Systemwechsel.
„Datenschutz / unsere Daten?" → Berechtigte Frage: Alles läuft in Ihren bestehenden Systemen, DSGVO-konform — nichts verlässt Ihre Kontrolle. Zeigen wir im Detail.
„Gerade kein Budget." → Wenn das Budget da wäre — wäre es ein Ja? [R](isolieren; ggf. mit dem kleinsten Hebel starten)[/R]
„Was, wenn es nicht funktioniert?" → Deshalb starten wir mit der am schnellsten messbaren Automation — nach [X] Wochen sehen Sie schwarz auf weiß, was sie spart.

ABSCHLUSS
[J]Wenn es passt: Start [Datum], Onboarding kommt direkt, in [X] Wochen läuft die erste Automation. Machen wir es so?[/J] [R](still sein)[/R]

WENN HEUTE KEIN ABSCHLUSS
Dann fixieren wir den nächsten Schritt: Ich melde mich [Tag] um [Uhrzeit] — bis dahin wissen Sie, ob es beim Ob oder beim Wie hakt. Einverstanden?$s$
where title = 'HK ▸ KI-Automation — Closer';
