import { PARSE_VECTORS, formatNumber, parseNumber, roundValue, toInputText } from './number';
import { validateValue } from './validation';

describe('number', () => {
  it.each(PARSE_VECTORS.map((v) => [v.text, v.value] as const))('parses %j as %s', (text, value) => {
    expect(parseNumber(text)).toBe(value);
  });

  it('rounds to two decimals, half away from zero', () => {
    expect(roundValue(1.005)).toBe(1.01);
    expect(roundValue(-1.005)).toBe(-1.01);
    expect(roundValue(2.5)).toBe(2.5);
    expect(roundValue(0.1 + 0.2)).toBe(0.3);
  });

  it('formats with a comma in Italian and a point in English, without trailing zeros', () => {
    expect(formatNumber(82.4, 'it')).toBe('82,4');
    expect(formatNumber(82.4, 'en')).toBe('82.4');
    expect(formatNumber(7, 'it')).toBe('7');
    expect(formatNumber(3.05, 'it')).toBe('3,05');
    expect(formatNumber(-0.004, 'en')).toBe('0');
    expect(formatNumber(-12.345, 'en')).toBe('-12.35');
  });

  it('gives input text that parses back', () => {
    expect(toInputText(82.4)).toBe('82.4');
    expect(parseNumber(toInputText(-3.5))).toBe(-3.5);
  });

  it('validates Value text: empty is fine, non-numeric is not', () => {
    expect(validateValue('')).toBeNull();
    expect(validateValue(' 12,5 ')).toBeNull();
    expect(validateValue('abc')).toBe('valueInvalid');
  });
});
