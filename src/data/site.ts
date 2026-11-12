export interface Site {
  /** Ursprung der öffentlichen Website, ohne Schrägstrich am Ende */
  url: string;
  company: string;
  street: string;
  city: string;
  email: string | null;
  phone: string | null;
  managingDirector: string | null;
  registerCourt: string | null;
  registerNumber: string | null;
  vatId: string | null;
}

/** Fehlende Angaben bleiben null (Release-Sperre); sie werden nirgends gerendert. */
export const SITE: Site = {
  url: 'https://www.reticora.de',
  company: 'Koyer Consulting für IT und Kommunikation UG (haftungsbeschränkt)',
  street: 'Dr. Albert-Frank-Str. 2',
  city: '83308 Trostberg',
  email: null,
  phone: null,
  managingDirector: null,
  registerCourt: null,
  registerNumber: null,
  vatId: null,
};
