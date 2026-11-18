import type { Lang } from '../data/types';

/** Beschriftungen des Netzschemas „Verbindungsrichtung“. */
export const SCHEMA: Record<Lang, { net: string; cloud: string; collector: string; devices: string; title: string; desc: string }> = {
  de: {
    net: 'Ihr Netz',
    cloud: 'Reticora (EU)',
    collector: 'Collector',
    devices: 'Geräte',
    title: 'Verbindungsrichtung des Collectors',
    desc: 'Links die Fläche „Ihr Netz“ mit vier Geräten und dem Collector, rechts die Fläche „Reticora (EU)“. Zwei Linien führen vom Collector nach rechts: HTTPS 443 und NATS mTLS 4222. Es gibt keine Linie von rechts nach links.',
  },
  en: {
    net: 'Your network',
    cloud: 'Reticora (EU)',
    collector: 'Collector',
    devices: 'Devices',
    title: 'Connection direction of the collector',
    desc: 'On the left the area “Your network” with four devices and the collector, on the right the area “Reticora (EU)”. Two lines run from the collector to the right: HTTPS 443 and NATS mTLS 4222. There is no line from right to left.',
  },
};
