import type { PageContent } from '../../types';

/** Wörtlich aus docs/copy/produkt-betrieb-de.md. */
export const betrieb: PageContent = {
  meta: {
    title: 'Betrieb – Tickets, SLAs, Monitoring, Workflows',
    description:
      'Tickets mit SLA und Geschäftskalender am betroffenen CI, Monitoring mit Alarmregeln, Workflows und Formulare, Wartungsfenster mit den betroffenen Kunden.',
  },
  hero: {
    title: 'Störung, Ticket, Wartung: am CI, nicht daneben.',
    lead:
      'Service-Desk und Netzbetrieb arbeiten auf demselben Bestand wie die Discovery. Ein Ticket kennt sein CI, ein Alarm sein Gerät, ein Wartungsfenster seine Kunden.',
    actions: ['demo', 'trial'],
  },
  sections: [
    {
      id: 'tickets',
      title: 'Tickets mit SLA',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'Jedes Ticket hat eine Nummer, die in Ihrer Organisation eindeutig ist, einen Bezug auf das betroffene CI oder ein anderes Objekt und Anhänge. Aus einem Review legen Sie direkt ein Ticket an, wenn die Klärung Arbeit vor Ort braucht. [C-62] SLAs rechnen mit einem Geschäftskalender, den Sie für die Organisation oder für einzelne Kunden festlegen (ab Standard). [C-37, C-62]',
          ],
          shot: { id: 'S-11', caption: 'Ticket mit SLA.' },
        },
      ],
    },
    {
      id: 'monitoring',
      title: 'Monitoring und Alarmregeln',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'Der Collector liest Erreichbarkeit, Interface-Zähler sowie die Werte von USVs und PDUs mit aus. Reticora zeigt sie als Verlauf am CI und bewahrt sie 400 Tage auf. [C-63] Eine Alarmregel nennt Metrik, Bedingung, Schwellwert, Dauer und Schweregrad. Löst sie aus, entsteht ein Ticket, ein Webhook oder eine Benachrichtigung (ab Pro). [C-64] Benachrichtigungen gehen per E-Mail, mit Ruhezeiten, Sammelmeldung und Entdoppelung. [C-90]',
          ],
          shot: { id: 'S-12', caption: 'Monitoring: Metriken und Alarmregeln.' },
        },
      ],
    },
    {
      id: 'workflows',
      title: 'Workflows und Formulare',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Wiederkehrende Abläufe bauen Sie im Klick-Builder, ohne zu programmieren. Ein Workflow startet bei einem Ereignis, von Hand oder nach Zeitplan, und führt Aktionen aus: Ticket anlegen, Webhook senden, benachrichtigen, ein Feld setzen, eine Genehmigung einholen. Was ein Workflow schreibt, trägt die Herkunft „Workflow“ mit Rang 92 und lässt Ihre Overrides stehen. Formulare sind versioniert und blenden Felder je nach Antwort ein oder aus (ab Pro). [C-65]',
          ],
        },
        {
          kind: 'table',
          label: 'Beispiele für Workflows',
          caption: '**Beispiele** (Einsatzzwecke aus der Produktbeschreibung, keine Kundenprojekte):',
          rowHeader: 'flow',
          columns: [
            { key: 'flow', head: 'Ablauf' },
            { key: 'parts', head: 'Bausteine' },
          ],
          rows: [
            { flow: 'Übergabe eines Geräts', parts: 'Formular, Unterschrift, Feld setzen [C-65]' },
            { flow: 'Bestellung genehmigen', parts: 'Formular, Genehmigung, Ticket [C-65]' },
            { flow: 'Wartung ankündigen', parts: 'Zeitplan, Benachrichtigung [C-65]' },
          ],
        },
      ],
    },
    {
      id: 'wartungsfenster',
      title: 'Wartungsfenster',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Ein Wartungsfenster hat Beginn, Ende und die CIs, an denen gearbeitet wird. Reticora leitet daraus ab, welche Kunden betroffen sind. Vorher lassen Sie die CIs in der Ausfallsimulation gemeinsam ausfallen und sehen, was mit ausfällt und was die Redundanz trägt. [C-66, C-09]',
          ],
        },
        { kind: 'link', link: { label: 'Ausfallsimulation', href: '/produkt/topologie-impact/' } },
      ],
    },
  ],
};
