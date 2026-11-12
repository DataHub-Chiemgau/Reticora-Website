import type { PageContent } from '../../types';

/** Wörtlich aus docs/copy/produkt-topologie-impact-de.md. */
export const TOPOLOGIE_IMPACT: PageContent = {
  meta: {
    title: 'Topologie und Ausfallsimulation – Reticora',
    description:
      'Topologie aus LLDP, Racks mit Vorder- und Rückseite, Stromkette bis zur USV und eine Ausfallsimulation, die Redundanz von Strom und Cluster kennt.',
  },
  hero: {
    title: 'Was hängt woran, und was fällt mit aus?',
    lead:
      'Reticora leitet aus den Beobachtungen ab, wie Ihre Geräte verbunden und versorgt sind. Daraus rechnet die Ausfallsimulation, welche CIs, Kunden und Standorte ein Ausfall trifft. [C-31, C-52]',
    actions: ['demo', 'trial'],
    topology: true,
  },
  sections: [
    {
      id: 'topologie',
      title: 'Topologie als Graph',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'Meldet ein Gerät über LLDP einen Nachbarn, entsteht eine Beziehung `connected_to`. [C-31] Dazu kommen die Abhängigkeiten zwischen CIs: was worauf läuft, was wovon Strom bekommt, was zu einem Cluster gehört. Die Topologie zeigt alles als Graph; die Farbe eines Punktes steht für den Status des CIs. Bis 2.000 Knoten sehen Sie das ganze Netz; darüber wählen Sie zuerst einen Standort oder Typ. [C-55]',
          ],
          shot: { id: 'S-04', caption: 'Topologie: CIs als Graph, die Farbe zeigt den Status.' },
        },
      ],
    },
    {
      id: 'ausfallsimulation',
      title: 'Ausfallsimulation mit Redundanz',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'Wählen Sie ein CI oder mehrere und lassen Sie sie ausfallen. Reticora folgt den Beziehungen und zeigt, was betroffen ist. Strom (`powered_by`) und Cluster (`member_of_cluster`) gelten als redundant: Ein Server mit zwei Netzteilen an zwei PDUs fällt erst aus, wenn beide PDUs ausfallen. Bei `hosted_on`, `runs_on` und `depends_on` genügt ein ausgefallener Versorger. [C-09, C-50]',
          ],
          shot: { id: 'S-06', caption: 'Ausfallsimulation in der Topologie.' },
        },
        {
          kind: 'table',
          label: 'Beispiele für Ausfälle im Netzschema',
          caption: '**Beispiel** (dieselben neun CIs wie im Netzschema):',
          rowHeader: 'fail',
          columns: [
            { key: 'fail', head: 'Ausfall' },
            { key: 'hit', head: 'betroffen' },
            { key: 'safe', head: 'durch Redundanz geschützt' },
          ],
          rows: [
            { fail: '`pdu-a`', hit: '`sw-access-01`', safe: '`srv-01`, `srv-02`' },
            { fail: '`pdu-a` und `pdu-b`', hit: 'beide Server, Switch, NAS, beide VMs (6)', safe: '–' },
            { fail: '`usv-01`', hit: 'beide PDUs und alles dahinter (8)', safe: '–' },
            { fail: '`srv-01`', hit: '`vm-app-01`', safe: '–' },
          ],
        },
      ],
    },
    {
      id: 'betroffen',
      title: 'Wer ist betroffen',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Die Auswirkungsanalyse nennt nicht nur Geräte. Sie listet die betroffenen CIs, Kunden, Standorte und Services und zeigt, welches CI für einen Service ein Single Point of Failure ist. [C-52] Was nur über eine Netzverbindung (`connected_to`) erreicht wird, führt sie getrennt als „möglicherweise betroffen“: Ob der Ausfall diese CIs trifft, ist nicht sicher, und sie zählen nicht mit. [C-50] Für ein Wartungsfenster rechnen Sie mehrere CIs auf einmal. [C-66]',
          ],
        },
        { kind: 'link', link: { label: 'Wartungsfenster im Betrieb', href: '/produkt/betrieb/' } },
      ],
    },
    {
      id: 'stromkette',
      title: 'Die Stromkette bis zur Quelle',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Reticora bildet die Versorgung als Kette ab: Gerät, PDU, USV, Quelle. [C-51] So beantwortet die Ausfallsimulation auch Fragen wie „Was bleibt an, wenn USV B gewartet wird?“. Die Werte von USVs und PDUs liest der Collector selbst aus und zeigt sie als Verlauf am CI. [C-01, C-63]',
          ],
        },
      ],
    },
    {
      id: 'herkunft-beziehung',
      title: 'Herkunft und Prüfstatus jeder Beziehung',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Auch Beziehungen haben eine Herkunft. Jede trägt ihre Quelle, eine Konfidenz und einen Prüfstatus: ungeprüft oder bestätigt. Eine Nachbarschaft aus LLDP hat die Konfidenz 1,0. Fehlt LLDP, nutzt Reticora die Weiterleitungstabelle des Switches mit 0,6. Unbestätigte Kanten aus der Discovery verschwinden nach 7 Tagen oder dem Fünffachen des Scope-Intervalls, je nachdem, was länger ist. Kanten, die Sie von Hand anlegen, löscht die Discovery nie; Kanten, die Sie entfernen, legt sie nicht wieder an. [C-53]',
          ],
        },
      ],
    },
    {
      id: 'racks',
      title: 'Racks mit Vorder- und Rückseite',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'Die Rack-Ansicht zeigt die Belegung je Höheneinheit, auf der Vorder- und der Rückseite. Beim Einbau prüft Reticora, ob das Gerät in die Höhe passt und ob der Platz auf dieser Seite frei ist. [C-10, C-54]',
          ],
          shot: { id: 'S-05', caption: 'Rack, Vorderseite.', ratio: '4x5' },
        },
      ],
    },
  ],
};
