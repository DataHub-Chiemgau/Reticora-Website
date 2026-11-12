import type { PageContent } from '../../types';

/** Wörtlich aus docs/copy/produkt-compliance-de.md. C-19: Berichtsfunktion, keine Zertifizierung, keine Garantie der Konformität. */
export const COMPLIANCE: PageContent = {
  meta: {
    title: 'Compliance und Audit – Reticora',
    description:
      'Audit-Protokoll mit Hash-Kette, Compliance-Regeln je CI-Typ mit Score und Befunden, Berichte für ISO 27001, NIS2 und KRITIS, IGA als Add-on.',
  },
  hero: {
    title: 'Nachweise aus dem Bestand, nicht aus dem Gedächtnis.',
    lead:
      'Wer prüft, braucht zwei Dinge: ein Protokoll, an dem sich nichts unbemerkt ändern lässt, und Regeln, die zeigen, wo der Bestand abweicht. Beides arbeitet in Reticora auf denselben CIs.',
    actions: ['contact', 'demo'],
  },
  sections: [
    {
      id: 'audit-protokoll',
      title: 'Audit-Protokoll mit Hash-Kette',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'Jede Änderung landet im Audit-Protokoll Ihrer Organisation. Die Einträge sind zu einer Hash-Kette verbunden: Wird ein Eintrag nachträglich geändert oder entfernt, bricht die Kette an dieser Stelle. Sie prüfen die Kette in der Anwendung oder mit dem Kommandozeilenwerkzeug `audit-verify`. [C-12, C-69] Daneben führt Reticora zu jedem CI die Feldhistorie: wer oder welche Quelle wann welchen Wert gesetzt hat. [C-69, C-03]',
          ],
          shot: { id: 'S-14', caption: 'Audit-Protokoll.' },
        },
        {
          kind: 'specs',
          items: [
            { term: 'Kette', value: 'je Organisation [C-12]' },
            { term: 'Prüfung', value: 'in der Anwendung und per `audit-verify` [C-69]' },
            { term: 'Aufbewahrung Audit-Protokoll', value: '10 Jahre [C-69]' },
            { term: 'Aufbewahrung Feldhistorie', value: '3 Jahre [C-69]' },
            { term: 'Zugriffe des Plattformbetriebs', value: 'eigenes Protokoll mit Hash-Kette [C-82]' },
          ],
        },
      ],
    },
    {
      id: 'regeln-score',
      title: 'Compliance-Regeln und Score',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'Eine Compliance-Regel gilt für einen CI-Typ und prüft dessen Felder, zum Beispiel ob auf allen Firewalls eine unterstützte Firmware-Version steht. Sie bauen die Regel im Klick-Builder und geben ihr Schweregrad, Kategorie und einen Hinweis zur Behebung. Reticora wertet jedes CI aus: bestanden, fehlgeschlagen oder nicht anwendbar. Daraus entsteht ein Score, gesamt und je CI-Typ (ab Enterprise). [C-67]',
          ],
          shot: { id: 'S-13', caption: 'Compliance: Regeln, Score und Abweichungen.' },
        },
      ],
    },
    {
      id: 'befunde',
      title: 'Befunde mit den betroffenen CIs',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Jede fehlgeschlagene Regel wird zum Befund. Er nennt Regel, Schweregrad und Kategorie, den Hinweis zur Behebung und die betroffenen CIs. Befunde sind nach Schweregrad sortiert, damit das Wichtigste oben steht. [C-68]',
          ],
        },
      ],
    },
    {
      id: 'berichte',
      title: 'Berichte für ISO 27001, NIS2 und KRITIS',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Reticora erstellt einen Bericht für Ihre Prüfung. Er enthält: Ergebnis der Prüfung der Audit-Kette, Score, Befunde nach Schweregrad mit den betroffenen CIs und die Sicherheitsfunktionen, die in Ihrer Organisation eingeschaltet sind. [C-68] Der Bericht liefert Nachweise für Ihre Prüfung. Er ersetzt sie nicht, und er bescheinigt keine Konformität. [C-19]',
          ],
        },
      ],
    },
    {
      id: 'iga',
      title: 'IGA als Add-on',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Mit dem Add-on IGA steuern Sie Berechtigungen in angebundenen Systemen: Eintritt, Wechsel und Austritt von Personen, Zugriffsanträge mit Genehmigung, regelmäßige Access-Reviews und die Erkennung von Abweichungen. Korrekturen laufen nur, wenn eine zweite Person zustimmt. Schreibende Connectoren laufen als eigener Prozess mit eigenem Enrollment und den geringsten nötigen Rechten. [C-70] IGA ist zu jedem Paket zubuchbar; den Preis nennen wir auf Anfrage.',
          ],
        },
        { kind: 'link', link: { label: 'Preise und Add-ons', href: '/preise/' } },
      ],
    },
  ],
  closing: {
    id: 'abschluss',
    title: 'Sie bereiten eine Prüfung vor?',
    text: 'Schreiben Sie uns, was Ihre Prüfung verlangt. Wir zeigen Ihnen Audit-Protokoll, Regeln und Bericht an einem Beispiel.',
    actions: ['contact', 'demo', 'trial'],
  },
};
