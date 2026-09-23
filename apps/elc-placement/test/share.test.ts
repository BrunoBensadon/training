import { describe, expect, it } from 'vitest';
import {
  ENCODING_VERSION,
  decodeResponses,
  encodeResponses,
  itemsVersionMatches,
  permutationFromIndex,
  permutationIndex,
} from '../src/share.ts';
import { QUADRANTS, type Ranking, type Responses } from '../src/model.ts';
import { scoreResponses } from '../src/scoring.ts';

function rank(activist: number, reflector: number, theorist: number, pragmatist: number): Ranking {
  return { activist, reflector, theorist, pragmatist };
}

const sample: Responses = [
  rank(1, 2, 3, 4),
  rank(4, 3, 2, 1),
  rank(2, 4, 1, 3),
  rank(3, 1, 4, 2),
  rank(1, 3, 2, 4),
  rank(2, 1, 3, 4),
];

describe('permutation coding', () => {
  it('covers all 24 permutations exactly once', () => {
    const seen = new Set<string>();
    for (let index = 0; index < 24; index += 1) {
      const permutation = permutationFromIndex(index);
      expect(new Set(permutation).size).toBe(4);
      expect(permutationIndex(permutation)).toBe(index);
      seen.add(permutation.join(''));
    }
    expect(seen.size).toBe(24);
  });

  it('refuses an index outside the 24', () => {
    expect(() => permutationFromIndex(24)).toThrow(/out of range/);
    expect(() => permutationFromIndex(-1)).toThrow(/out of range/);
  });

  it('refuses something that is not a permutation', () => {
    expect(() => permutationIndex([1, 1, 2, 3])).toThrow(/not a permutation/);
  });
});

describe('encodeResponses', () => {
  it('produces one character per set', () => {
    const encoded = encodeResponses(sample, '1.0.0');
    expect(encoded).toMatch(new RegExp(`^e${ENCODING_VERSION}:1\\.0\\.0:[0-9a-n]{6}$`));
  });

  it('round-trips', () => {
    const decoded = decodeResponses(encodeResponses(sample, '1.0.0'));
    expect(decoded).toEqual({ ok: true, responses: sample, itemsVersion: '1.0.0' });
  });

  it('round-trips to the same score, which is the thing that matters', () => {
    const decoded = decodeResponses(encodeResponses(sample, '1.0.0'));
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(scoreResponses(decoded.responses)).toEqual(scoreResponses(sample));
  });

  it('stays short enough to survive being typed off a screen', () => {
    expect(encodeResponses(sample, '1.0.0').length).toBeLessThan(20);
  });
});

describe('decodeResponses', () => {
  it('rejects nonsense rather than showing a wrong result', () => {
    for (const bad of ['', 'hello', 'e1:1.0.0:', 'e1::abcdef', 'e1:1.0.0:ABCDEF', '1.0.0:abcdef']) {
      expect(decodeResponses(bad), bad).toMatchObject({ ok: false, reason: 'malformed' });
    }
  });

  it('rejects a character outside the 24 permutations', () => {
    // 'z' is a valid base-36 digit but not a valid permutation index.
    expect(decodeResponses('e1:1.0.0:abcdez')).toMatchObject({ ok: false, reason: 'malformed' });
  });

  it('names a future encoding rather than misreading it', () => {
    expect(decodeResponses('e9:1.0.0:abcdef')).toEqual({
      ok: false,
      reason: 'unsupported-encoding',
      found: '9',
    });
  });

  it('tolerates surrounding whitespace, because links get copied by hand', () => {
    expect(decodeResponses(`  ${encodeResponses(sample, '1.0.0')}  `)).toMatchObject({ ok: true });
  });
});

describe('items version', () => {
  it('is carried so a stale link can say so', () => {
    const decoded = decodeResponses(encodeResponses(sample, '1.0.0'));
    expect(decoded.ok && itemsVersionMatches(decoded.itemsVersion, '2.0.0')).toBe(false);
    expect(decoded.ok && itemsVersionMatches(decoded.itemsVersion, '1.0.0')).toBe(true);
  });

  it('still decodes a stale link, because ranks are stored per quadrant', () => {
    // Rewording a statement cannot invalidate a saved link: the link never
    // referred to the statement, only to the quadrant it belonged to.
    const decoded = decodeResponses(encodeResponses(sample, '1.0.0'));
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(Object.keys(decoded.responses[0]!).sort()).toEqual([...QUADRANTS].sort());
  });
});
