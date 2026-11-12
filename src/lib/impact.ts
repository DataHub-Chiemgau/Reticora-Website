import type { Lang } from '../data/types';

export const REDUNDANT_RELS: ReadonlySet<string> = new Set(['powered_by', 'member_of_cluster']);

/** Beziehungen ohne Ausfallwirkung (ungerichtet). */
export const IGNORED_RELS: ReadonlySet<string> = new Set(['connected_to']);

export interface ImpactResult { failed: string[]; affected: string[]; guarded: string[] }

type Edge = { from: string; to: string; rel: string };

export function computeImpact(nodes: readonly string[], edges: readonly Edge[], failed: readonly string[]): ImpactResult {
  const known = new Set(nodes);
  const failedSet = new Set(failed.filter((id) => known.has(id)));
  const down = new Set(failedSet);

  // Anbieter je Knoten und Beziehungstyp
  const providers = new Map<string, Map<string, string[]>>();
  for (const e of edges) {
    if (IGNORED_RELS.has(e.rel)) continue;
    const byRel = providers.get(e.from) ?? new Map<string, string[]>();
    byRel.set(e.rel, [...(byRel.get(e.rel) ?? []), e.to]);
    providers.set(e.from, byRel);
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const id of nodes) {
      if (down.has(id)) continue;
      for (const [rel, list] of providers.get(id) ?? []) {
        const downCount = list.filter((p) => down.has(p)).length;
        if (REDUNDANT_RELS.has(rel) ? downCount === list.length : downCount > 0) {
          down.add(id);
          changed = true;
          break;
        }
      }
    }
  }

  const guarded = nodes.filter((id) => {
    if (down.has(id)) return false;
    for (const [rel, list] of providers.get(id) ?? []) {
      if (REDUNDANT_RELS.has(rel) && list.some((p) => down.has(p))) return true;
    }
    return false;
  });

  return {
    failed: nodes.filter((id) => failedSet.has(id)),
    affected: nodes.filter((id) => down.has(id) && !failedSet.has(id)),
    guarded,
  };
}

export function impactSentence(lang: Lang, r: ImpactResult): { main: string; guarded: string | null } {
  const de = lang === 'de';
  if (r.failed.length === 0) {
    return { main: de ? 'Wählen Sie ein CI, um seinen Ausfall zu simulieren.' : 'Choose a CI to simulate its outage.', guarded: null };
  }
  const n = r.affected.length;
  const tail = de
    ? n === 0 ? 'ist kein weiteres CI betroffen.'
      : n === 1 ? 'ist 1 weiteres CI betroffen (grau dargestellt).'
      : `sind ${n} weitere CIs betroffen (grau dargestellt).`
    : n === 0 ? 'no other CI is affected.'
      : n === 1 ? '1 more CI is affected (shown in grey).'
      : `${n} more CIs are affected (shown in grey).`;
  const head = r.failed.length === 1
    ? de ? `Fällt „${r.failed[0]}“ aus,` : `If "${r.failed[0]}" fails,`
    : de ? `Fallen ${r.failed.length} CIs (${r.failed.join(', ')}) gemeinsam aus,` : `If ${r.failed.length} CIs (${r.failed.join(', ')}) fail together,`;
  const names = r.guarded.join(', ');
  return {
    main: `${head} ${tail}`,
    guarded: r.guarded.length === 0 ? null : de ? `Durch Redundanz geschützt: ${names}.` : `Protected by redundancy: ${names}.`,
  };
}
