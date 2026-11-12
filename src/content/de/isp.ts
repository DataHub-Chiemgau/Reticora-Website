import type { SolutionContent } from '../solution';
import { PLANS } from '../../data/pricing';
import { grouped } from '../../lib/format';

const ent = PLANS.find((p) => p.id === 'enterprise-shared')!;

/** Texte der Seite „Lösungen für ISPs“, wörtlich aus docs/copy/loesungen-isp-de.md. Zahlen aus src/data/pricing.ts. */
export const ISP: SolutionContent = {
  meta: {
    title: 'Reticora für Netzbetreiber (ISP)',
    description:
      'Störung an der USV, geplanter Tausch, viele PoPs, ein Gerät aus der Reparatur: Wie Netzbetreiber diese Aufgaben mit Reticora erledigen.',
  },
  hero: {
    title: 'Für Netzbetreiber: Bestand, Abhängigkeiten und Ausfallfolgen an einem Ort.',
    lead: 'Vier Situationen aus dem Betrieb eines Netzes und wie Reticora dabei hilft. Sie beschreiben Funktionen des Produkts, keine Kundenprojekte.',
    actions: ['demo', 'contact'],
    topic: 'enterprise',
  },
  situations: [
    {
      id: 'usv-stoerung',
      title: 'Eine USV im PoP meldet eine Störung.',
      text: [
        'Öffnen Sie die USV in der Topologie und simulieren Sie ihren Ausfall. Reticora folgt der Stromkette über die PDUs bis zu den Geräten und zeigt, welche CIs, Kunden und Standorte betroffen sind. Server mit zwei Netzteilen an getrennten Wegen stehen unter „Durch Redundanz geschützt“, solange der zweite Weg steht. [C-09, C-50, C-51, C-52] Aus der Analyse legen Sie ein Ticket am CI an; der Verlauf der USV-Werte steht im selben CI. [C-62, C-63]',
      ],
      features: ['Ausfallsimulation', 'Auswirkungsanalyse', 'Stromkette', 'Tickets', 'Monitoring'],
      shot: { id: 'S-06', caption: 'Ausfallsimulation in der Topologie.' },
    },
    {
      id: 'switch-tausch',
      title: 'Nächste Woche wird ein Aggregationsswitch getauscht.',
      text: [
        'Lassen Sie den Switch und alles, was mit ihm vom Netz geht, gemeinsam ausfallen. Die Auswirkungsanalyse nennt die betroffenen Kunden und Services und führt getrennt auf, was nur über eine Netzverbindung erreicht wird und deshalb möglicherweise betroffen ist. [C-52, C-50, C-66] Dann legen Sie ein Wartungsfenster mit diesen CIs an; die betroffenen Kunden leitet Reticora daraus ab. [C-66]',
      ],
      features: ['Mehrfachausfall', 'Auswirkungsanalyse', 'Wartungsfenster'],
    },
    {
      id: 'viele-pops',
      title: 'Viele PoPs, mehrere Hersteller, keine aktuelle Liste.',
      text: [
        `Setzen Sie in jedem PoP einen Collector ein. Er schlägt die Netze vor, in denen er steht, und Sie bestätigen die Scopes, je mit ihrer VRF; gleiche Adressbereiche in verschiedenen VRFs bleiben getrennt. [C-29, C-43, C-85] Profile für Cisco, Juniper, Arista, MikroTik, FortiGate, USVs und PDUs bringt der Collector mit; Unbekanntes erscheint als generisches Gerät in der Review-Inbox. [C-08, C-40] Das Paket Enterprise umfasst bis ${grouped(ent.limits.cis)} CIs und beliebig viele Collectors. [C-21]`,
      ],
      features: ['Collector', 'Scopes mit VRF', 'Geräteprofile', 'Review-Inbox'],
      shot: { id: 'S-16', caption: 'Dashboard.' },
      link: { label: 'Unterstützte Geräte', href: '/geraete/' },
    },
    {
      id: 'ersatzgeraet',
      title: 'Ein Switch wird gegen ein Ersatzgerät aus dem Lager getauscht.',
      text: [
        'Sie entnehmen das Ersatzgerät dem Lager und buchen das defekte als Bewegung „Reparatur“. [C-57] Meldet die Discovery das neue Gerät, ordnet Reticora es über die Schlüssel in fester Reihenfolge zu: Seriennummer, Hardware-UUID, MAC-Adressen, Management-IP mit sysObjectID. Wo Beobachtung und Asset nicht zusammenpassen, entsteht ein Review „Abweichende Seriennummer“; ein zweites CI legt Reticora nicht still an, und Sie entscheiden. [C-45, C-49, C-56]',
      ],
      features: ['Lager', 'Identitätsabgleich', 'Review-Inbox', 'Asset'],
    },
  ],
  closing: {
    id: 'abschluss',
    title: 'Großer Bestand oder eigene Infrastruktur?',
    text: 'Enterprise Shared läuft in der Cloud auf getrennter Infrastruktur, Enterprise Local bei Ihnen, inklusive aller Arbeiten. [C-92] Schreiben Sie uns, wie Ihr Netz aufgebaut ist.',
    actions: ['contact', 'demo', 'trial'],
    topic: 'enterprise',
  },
};
