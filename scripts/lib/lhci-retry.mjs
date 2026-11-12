// Entscheidung des Lighthouse-Wrappers (scripts/lhci.mjs), rein und testbar.
// 'pass': Lauf erfolgreich. 'fail': Grenzwert verletzt oder anderer Fehler, sofort scheitern.
// 'retry': nur ein Laufzeitfehler von Lighthouse (z. B. NO_NAVSTART) ohne verletzte Grenzwerte, einmal wiederholen.
export const RUNTIME_ERROR = 'Runtime error encountered';

/** @param {number} code Exit-Code von `lhci autorun` @param {string} output stdout und stderr @param {boolean} [alreadyRetried] */
export function decide(code, output, alreadyRetried = false) {
  if (code === 0) return 'pass';
  const assertionFailed = /assertion failed|failed assertion|✘| failure for |Assertion failed/i.test(output);
  if (!alreadyRetried && output.includes(RUNTIME_ERROR) && !assertionFailed) return 'retry';
  return 'fail';
}
