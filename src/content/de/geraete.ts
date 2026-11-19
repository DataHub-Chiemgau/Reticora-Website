import type { Action, LinkRef, Rich } from '../types';

/** Texte der Seite „Geräte“, wörtlich aus docs/copy/geraete-de.md. Die Tabelle kommt aus src/data/devices.ts. */
export const geraete = {
  meta: {
    title: 'Unterstützte Geräte und Protokolle – Reticora',
    description:
      'Welche Switches, Router, Firewalls, Server, NAS, USVs und PDUs der Collector erkennt, über welche Protokolle, und was mit unbekannten Geräten geschieht.',
  },
  hero: {
    title: 'Wird Ihr Gerät erkannt?',
    lead: 'Der Collector bringt Profile für verbreitete Netzwerk-, Server-, Storage- und Stromgeräte mit. Die Tabelle zeigt jede Gerätefamilie mit den Protokollen, über die Reticora sie erkennt und ausliest. [C-08]' as Rich,
    actions: ['trial', 'demo'] as Action[],
  },
  familien: {
    id: 'familien',
    title: 'Gerätefamilien',
    tableLabel: 'Gerätefamilien mit Hersteller und Protokollen',
    categories: { network: 'Netzwerk', server: 'Server und Virtualisierung', storage: 'Storage', power: 'Strom' },
    jump: 'Zu einer Kategorie springen',
    groupId: 'kategorie',
    heads: { vendor: 'Hersteller', family: 'Familie', protocols: 'Protokolle' },
    note: 'Herstellernamen sind Marken ihrer Inhaber und stehen hier nur zur Beschreibung der Kompatibilität.',
    claim: 'C-08' as `C-${string}`,
  },
  erkennung: {
    id: 'erkennung',
    title: 'So erkennt der Collector ein Gerät',
    text: 'Für jedes gefundene Gerät geht der Collector in fester Reihenfolge vor: zuerst die Antwort auf SNMP (sysObjectID und Beschreibung), dann Redfish (Hersteller und Modell des Server-Controllers), dann das Banner eines Dienstes wie SSH. Dazu nimmt er die Herstellerkennung aus der MAC-Adresse. Das erste passende Profil legt Typ, Hersteller und Modell fest. [C-40]' as Rich,
    link: { label: 'Protokolle und Ablauf der Discovery', href: '/produkt/discovery/' } as LinkRef,
  },
  unbekannt: {
    id: 'unbekannt',
    title: 'Was mit unbekannten Geräten geschieht',
    text: 'Passt kein Profil, legt Reticora das Gerät trotzdem an, als generisches Gerät. Den Hersteller nennt die MAC-Adresse, und in der Review-Inbox wartet ein Review „Unklassifiziertes Gerät“. Sie setzen den Typ am CI und erledigen das Review. [C-40, C-49] Ein generisches Gerät hebt die Discovery später auf einen bestimmten Typ; einen anderen Typ, etwa den, den Sie gesetzt haben, ändert sie nie. [C-91]' as Rich,
  },
  profile: {
    id: 'profile',
    title: 'Profile ergänzen',
    text: 'Ein Profil ist eine beschreibende Datei: woran ein Gerät zu erkennen ist und welche Werte der Collector abfragt. Zusätzliche oder geänderte Profile lädt der Collector aus einem Verzeichnis, ohne dass Sie auf eine neue Version warten. [C-88] Fehlt Ihnen eine Familie, schreiben Sie uns.' as Rich,
    link: { label: 'Kontakt', href: '/kontakt/' } as LinkRef,
  },
};
