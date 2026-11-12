import type { PageContent } from '../../types';

/** Wörtlich aus docs/copy/produkt-datenqualitaet-de.md. */
export const DATENQUALITAET: PageContent = {
  meta: {
    title: 'Datenqualität – jeder Wert mit Herkunft',
    description:
      'Wie Reticora ein Gerät eindeutig erkennt, welche Quelle gewinnt und warum manuelle Werte bleiben. Mit Quellrängen, Herkunft je Feld und Review-Inbox.',
  },
  hero: {
    title: 'Ein Gerät, ein CI. Jeder Wert mit Quelle.',
    lead:
      'Reticora führt Beobachtungen aus mehreren Quellen zu einem CI zusammen – einem Eintrag in der CMDB. Dabei gelten feste Regeln: welcher Schlüssel ein Gerät erkennt, welche Quelle gewinnt und wann ein Mensch entscheidet. Dieser Abgleich heißt in der App Reconciliation.',
    actions: ['trial', 'demo'],
  },
  sections: [
    {
      id: 'schluessel',
      title: 'Fünf Schlüssel in fester Reihenfolge',
      lead: 'Bevor ein Wert in ein CI gelangt, klärt Reticora, zu welchem Gerät er gehört. Geprüft wird innerhalb eines Kunden, Schlüssel für Schlüssel. [C-45]',
      blocks: [
        {
          kind: 'table',
          label: 'Die fünf Schlüssel zur Geräteerkennung',
          rowHeader: 'key',
          columns: [
            { key: 'nr', head: 'Nr.', numeric: true },
            { key: 'key', head: 'Schlüssel' },
            { key: 'rule', head: 'Regel' },
          ],
          rows: [
            { nr: '1', key: 'Seriennummer', rule: 'Platzhalter wie „To be filled by O.E.M.“ zählen nicht. [C-45]' },
            { nr: '2', key: 'Hardware-UUID', rule: 'Bekannte Klon-UUIDs zählen nicht; virtuelle Maschinen brauchen zusätzlich MAC oder Hostname. [C-45]' },
            { nr: '3', key: 'MAC-Adressen', rule: 'Eine eindeutige Schnittmenge; lokal administrierte und VRRP-, HSRP- und CARP-Adressen zählen nicht. [C-45]' },
            { nr: '4', key: 'Management-IP und sysObjectID', rule: 'nur in derselben VRF [C-45]' },
            { nr: '5', key: 'Hostname oder FQDN', rule: 'Führt nie zum automatischen Zusammenführen, nur zu einem Review „Wahrscheinliches Duplikat“. [C-05, C-49]' },
          ],
        },
        { kind: 'prose', paras: ['Aus einem Gerät wird so nie ein zweites CI, und zwei Geräte mit demselben Namen werden nie still eins. [C-05]'] },
      ],
    },
    {
      id: 'quelle-gewinnt',
      title: 'Welche Quelle gewinnt',
      blocks: [
        {
          kind: 'split',
          paras: [
            'Melden zwei Quellen für dasselbe Feld verschiedene Werte, gilt der Wert der Quelle mit dem höheren Rang. Ein Wert wird nur übernommen, wenn seine Beobachtung neuer ist als die des gespeicherten Werts. Es zählt der Zeitpunkt der Beobachtung, nicht der Eingang. [C-46, C-47]',
          ],
          side: {
            kind: 'table',
            label: 'Rangfolge der Quellen',
            rowHeader: 'source',
            columns: [
              { key: 'source', head: 'Quelle' },
              { key: 'rank', head: 'Rang', numeric: true },
            ],
            rows: [
              { source: 'manuell, Override', rank: '100' },
              { source: 'Import', rank: '95' },
              { source: 'Workflow', rank: '92' },
              { source: 'Redfish', rank: '90' },
              { source: 'Agent', rank: '85' },
              { source: 'SNMP', rank: '80' },
              { source: 'API, Integration', rank: '75' },
              { source: 'WMI', rank: '70' },
              { source: 'SSH, NAS', rank: '60' },
              { source: 'Sweep', rank: '20' },
            ],
            after: '[C-46]',
          },
        },
        {
          kind: 'figure',
          paras: [
            'Zu jedem Feld zeigt die CI-Ansicht Quelle, Rang, Zeitpunkt der Beobachtung und den Grund, warum dieser Wert gilt: manueller Override, höchstrangige Quelle, Wert aus dem Asset oder Wert des CI-Datensatzes. [C-03]',
          ],
          shot: { id: 'S-02', caption: 'Herkunft eines Feldes in der CI-Ansicht.' },
        },
      ],
    },
    {
      id: 'manuell-gewinnt',
      title: 'Manuell gewinnt',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Was Sie von Hand setzen, ist ein Override. Ihn überschreibt keine Quelle, auch kein Workflow. [C-04, C-65] Meldet eine Quelle später einen anderen Wert, entsteht ein Review „Konflikt mit Override“. Sie sehen beide Werte und entscheiden, ob Ihr Wert bleibt. [C-47, C-49] Kaufmännische Daten wie Seriennummer, Standort und Kaufdaten führt das Asset; das CI zeigt sie nur an. [C-56]',
          ],
        },
      ],
    },
    {
      id: 'review-inbox',
      title: 'Die Review-Inbox: drei typische Fälle',
      lead:
        'Die Review-Inbox sammelt, was die Automatik nicht allein entscheiden darf. Sie vergleichen Beobachtung und CI nebeneinander und entscheiden: zusammenführen, neu anlegen, übernehmen oder verwerfen. Ohne Ihre Entscheidung wird nichts verworfen. [C-30, C-04]',
      blocks: [
        {
          kind: 'table',
          label: 'Drei typische Fälle in der Review-Inbox',
          rowHeader: 'case',
          columns: [
            { key: 'case', head: 'Fall' },
            { key: 'shows', head: 'Was Reticora zeigt' },
            { key: 'todo', head: 'Was Sie tun' },
          ],
          rows: [
            { case: 'Unbekanntes Gerät', shows: 'Kein Profil passt. Reticora legt ein generisches Gerät an; den Hersteller nennt die MAC-Adresse. [C-40, C-91]', todo: 'Typ setzen, Review erledigen.' },
            { case: 'Mögliche Dublette', shows: 'Ein neues Gerät trägt denselben Hostnamen wie ein vorhandenes CI, die übrigen Schlüssel passen nicht. [C-05, C-49]', todo: 'Zusammenführen, wenn es dasselbe Gerät ist; sonst neu anlegen.' },
            { case: 'Abweichende Seriennummer', shows: 'Die Discovery meldet eine andere Seriennummer, als im Asset steht – etwa nach einem Tausch der Hauptplatine. [C-49, C-56]', todo: 'Wert übernehmen oder verwerfen.' },
          ],
        },
        {
          kind: 'figure',
          paras: ['**Weitere Arten von Reviews:** mehrdeutige Identität, widersprüchliche Werte, wiedergekehrtes Gerät, doppelte IP-Adresse, nicht lizenziertes CI, Scope-Vorschlag. [C-49]'],
          shot: { id: 'S-03', caption: 'Review-Inbox: Beobachtung und CI im Vergleich.' },
        },
      ],
    },
    {
      id: 'rueckgaengig',
      title: 'Zusammenführen lässt sich rückgängig machen',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Führen Sie zwei CIs zusammen, hängt Reticora alle Bezüge auf das verbleibende CI um; das alte leitet weiter. Stellt sich der Schritt als falsch heraus, machen Sie ihn innerhalb von 30 Tagen rückgängig. Ein gelöschtes CI stellen Sie 90 Tage lang wieder her. [C-48]',
          ],
        },
      ],
    },
    {
      id: 'nicht-mehr-gesehen',
      title: 'Was nicht mehr gesehen wird',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Antwortet ein Gerät nicht mehr, verschwindet es nicht. Nach dem Dreifachen des Scope-Intervalls ohne Sichtung erhält das CI den Status „unknown“. Von Hand angelegte CIs bleiben, wie sie sind. [C-44] Meldet die Discovery ein Gerät, dessen CI gelöscht wurde, legt Reticora es nicht einfach neu an: Die Review-Inbox zeigt ein „Wiedergekehrtes Gerät“, und Sie entscheiden. [C-49]',
          ],
        },
      ],
    },
  ],
};
