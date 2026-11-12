import type { Action, Rich, ShotRef } from '../types';

/** Texte der Seite „Live-Demo“, wörtlich aus docs/copy/demo-de.md. Die Zugangsdaten kommen aus src/data/links.ts (LINKS). */
export const demo = {
  meta: {
    title: 'Live-Demo – Reticora ausprobieren',
    description:
      'Öffnen Sie die Demo von Reticora mit dem gemeinsamen Zugang. Drei Dinge zum Ausprobieren: Ausfall simulieren, Herkunft ansehen, Review entscheiden.',
  },
  hero: {
    title: 'Live-Demo',
    lead: 'Die Demo ist eine eigene Instanz von Reticora mit Beispieldaten. Sie brauchen kein Konto: Melden Sie sich mit dem Zugang unten an und probieren Sie aus, was Sie interessiert.',
  },
  zugang: {
    id: 'zugang',
    title: 'Zugang zur Demo',
    labels: { address: 'Adresse', user: 'Benutzer', password: 'Passwort' },
    notice: {
      lead: 'Gemeinsames Konto.',
      text: 'Alle Besucher der Demo nutzen dasselbe Konto und sehen, was andere eintragen. Geben Sie keine echten Daten ein: keine Namen, keine Adressen, keine Zugangsdaten, nichts aus Ihrem Netz oder dem Ihrer Kunden.',
    },
    open: 'Demo öffnen',
  },
  probieren: {
    id: 'ausprobieren',
    title: 'Drei Dinge zum Ausprobieren',
    items: [
      {
        title: 'Einen Ausfall simulieren',
        text: 'Öffnen Sie „Topologie“, wählen Sie eine PDU oder USV und klicken Sie „Ausfall simulieren“. Grau dargestellt sind die betroffenen CIs. Server, die an zwei Stromwegen hängen, stehen unter „Durch Redundanz geschützt“. Wählen Sie ein zweites CI dazu und sehen Sie, wie sich das Bild ändert. [C-09]' as Rich,
        shot: { id: 'S-06', caption: 'Ausfallsimulation in der Topologie.' } as ShotRef,
      },
      {
        title: 'Die Herkunft eines Feldes ansehen',
        text: 'Öffnen Sie ein CI und dort die Herkunft eines Feldes, etwa der Seriennummer. Sie sehen Quelle, Rang, Zeitpunkt der Beobachtung und warum dieser Wert gilt. [C-03]' as Rich,
        shot: { id: 'S-02', caption: 'Herkunft eines Feldes in der CI-Ansicht.' } as ShotRef,
      },
      {
        title: 'Ein Review entscheiden',
        text: 'Öffnen Sie die Review-Inbox und wählen Sie einen Eintrag. Beobachtung und CI stehen nebeneinander. Entscheiden Sie: zusammenführen, neu anlegen, übernehmen oder verwerfen. [C-30]' as Rich,
        shot: { id: 'S-03', caption: 'Review-Inbox: Beobachtung und CI im Vergleich.' } as ShotRef,
      },
    ],
  },
  closing: {
    id: 'abschluss',
    title: 'Lieber mit Ihrem eigenen Netz?',
    text: 'Im Test verbinden Sie einen Collector mit Ihrem Netz und sehen Ihre eigenen Geräte, 30 Tage im Standard-Umfang bis 100 CIs. [C-22]' as Rich,
    actions: ['trial', 'contact'] as Action[],
  },
};
