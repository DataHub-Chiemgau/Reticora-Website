export type Lang = 'de' | 'en';
export type ClaimId = `C-${string}`;
export type ScreenshotId = `S-${string}`;

export interface Claim {
  id: ClaimId;
  title: Record<Lang, string>;
  evidence: Record<Lang, string>;
  asOf: string;
  status: 'offen' | 'geprüft';
  checkedBy?: string;
  checkedOn?: string;
  /** intern, deutsch, wird nie gerendert */
  note?: string;
}

export interface Screenshot {
  id: ScreenshotId;
  motif: Record<Lang, string>;
  width: number;
  height: number;
  file?: string;
}

export interface Plan {
  id: 'essentials' | 'standard' | 'pro' | 'enterprise-shared' | 'enterprise-local';
  name: string;
  monthly: number;
  from: boolean;
  yearly: number | null;
  betaYearly: number | null;
  /** null = unbegrenzt */
  limits: { cis: number; collectors: number | null; users: number | null };
  summary: Record<Lang, string>;
}

export interface TopoNode {
  id: string;
  x: number;
  y: number;
  label: 'top' | 'left' | 'right' | 'side' | 'below';
}

export interface TopoEdge {
  from: string;
  to: string;
  rel: 'powered_by' | 'hosted_on';
  /** Position des Labels von abhängigem Knoten (0) zum Versorger (1) */
  labelAt: number;
}
