import type { TopoEdge, TopoNode } from './types';

/** Koordinaten im viewBox 0 0 1100 420 */
export const TOPO_NODES: readonly TopoNode[] = [
  { id: 'usv-01', x: 550, y: 56, label: 'top' },
  { id: 'pdu-a', x: 330, y: 156, label: 'left' },
  { id: 'pdu-b', x: 770, y: 156, label: 'right' },
  { id: 'sw-access-01', x: 130, y: 276, label: 'below' },
  { id: 'srv-01', x: 410, y: 276, label: 'side' },
  { id: 'srv-02', x: 690, y: 276, label: 'side' },
  { id: 'nas-01', x: 970, y: 276, label: 'below' },
  { id: 'vm-app-01', x: 410, y: 366, label: 'below' },
  { id: 'vm-db-01', x: 690, y: 366, label: 'below' },
];

/** from = abhängiges CI, to = Versorger */
export const TOPO_EDGES: readonly TopoEdge[] = [
  { from: 'pdu-a', to: 'usv-01', rel: 'powered_by', labelAt: 0.5 },
  { from: 'pdu-b', to: 'usv-01', rel: 'powered_by', labelAt: 0.5 },
  { from: 'sw-access-01', to: 'pdu-a', rel: 'powered_by', labelAt: 0.5 },
  { from: 'srv-01', to: 'pdu-a', rel: 'powered_by', labelAt: 0.5 },
  { from: 'srv-02', to: 'pdu-a', rel: 'powered_by', labelAt: 0.74 },
  { from: 'srv-01', to: 'pdu-b', rel: 'powered_by', labelAt: 0.74 },
  { from: 'srv-02', to: 'pdu-b', rel: 'powered_by', labelAt: 0.5 },
  { from: 'nas-01', to: 'pdu-b', rel: 'powered_by', labelAt: 0.5 },
  { from: 'vm-app-01', to: 'srv-01', rel: 'hosted_on', labelAt: 0.5 },
  { from: 'vm-db-01', to: 'srv-02', rel: 'hosted_on', labelAt: 0.5 },
];

export const TOPO_INITIAL_FAILED: readonly string[] = ['pdu-a'];
