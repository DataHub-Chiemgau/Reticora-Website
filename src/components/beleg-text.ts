import { claim } from '../data/claims';
import type { ClaimId, Lang } from '../data/types';

/** Der gerenderte Inhalt eines Belegs: nur Titel und Beleg, nie der interne Vermerk. */
export function belegText(id: ClaimId, lang: Lang): { title: string; evidence: string } {
  const c = claim(id);
  return { title: c.title[lang], evidence: c.evidence[lang] };
}
