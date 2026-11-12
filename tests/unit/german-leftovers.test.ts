import { describe, expect, test } from 'vitest';
import { ALLOWED_GERMAN, germanLeftovers } from '../german-leftovers';

describe('Suche nach deutschen Resten', () => {
  test.each(['Seite', 'Preise', 'Kunde', 'Standort', 'Beleg', 'Hinweis', 'Anfrage', 'Sicherheit', 'Paket', 'Monat', 'Jahr', 'Nutzer', 'Kontakt', 'Anmelden'])(
    'findet „%s“ ohne Umlaut',
    (w) => expect(germanLeftovers(`The ${w} is here`)).not.toEqual([]),
  );
  test('englischer Text und Adressen treffen nicht', () => {
    expect(germanLeftovers('Plans and pricing for your customer site. Contact us at /kontakt/ or sign in.')).toEqual([]);
    expect(germanLeftovers('The sites of a customer')).toEqual([]);
  });
  test('erlaubte Eigennamen werden ausgenommen', () => {
    expect(germanLeftovers(`Provider: ${ALLOWED_GERMAN[0]}, ${ALLOWED_GERMAN[2]}`)).toEqual([]);
  });
});
