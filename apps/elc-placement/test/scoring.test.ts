/**
 * Scoring, against the specification in
 * docs/reviews/elc-placement-2-content-guide.md §3D — including its nine
 * test vectors (§3D8), which were checked there against a separate
 * reference implementation.
 */
import { describe, expect, it } from 'vitest';
import {
  InvalidResponsesError,
  assertValidResponses,
  clearLead,
  classify,
  maxScore,
  midScore,
  minScore,
  pairLead,
  pointsForRank,
  scoreResponses,
  totalPoints,
} from '../src/scoring.ts';
import {
  BEARING,
  PREFERENCES,
  areAdjacent,
  nextInCycle,
  type Preference,
  type Ranking,
  type Responses,
} from '../src/model.ts';

/** Shorthand: rank(1, 2, 3, 4) in canonical order — active, reflective, theorist, pragmatist. */
function rank(active: number, reflective: number, theorist: number, pragmatist: number): Ranking {
  return { active, reflective, theorist, pragmatist };
}

function repeat(ranking: Ranking, times = 12): Responses {
  return Array.from({ length: times }, () => ({ ...ranking }));
}

function scores(
  active: number,
  reflective: number,
  theorist: number,
  pragmatist: number,
): Record<Preference, number> {
  return { active, reflective, theorist, pragmatist };
}

describe('the cycle', () => {
  it('runs clockwise from the top: Active, Reflective, Theorist, Pragmatist', () => {
    expect(PREFERENCES).toEqual(['active', 'reflective', 'theorist', 'pragmatist']);
    expect(BEARING).toEqual({ active: 0, reflective: 90, theorist: 180, pragmatist: 270 });
  });

  it('goes round and back to the start', () => {
    expect(nextInCycle('active')).toBe('reflective');
    expect(nextInCycle('pragmatist')).toBe('active');
  });

  it('knows neighbours from opposites', () => {
    expect(areAdjacent('active', 'reflective')).toBe(true);
    expect(areAdjacent('pragmatist', 'active')).toBe(true);
    expect(areAdjacent('active', 'theorist')).toBe(false);
    expect(areAdjacent('reflective', 'pragmatist')).toBe(false);
  });
});

describe('points and ranges', () => {
  it('is reverse-ranked: first choice scores most', () => {
    expect([1, 2, 3, 4].map(pointsForRank)).toEqual([4, 3, 2, 1]);
  });

  it('runs from n to 4n with 2.5n in the middle, and always totals 10n', () => {
    expect([minScore(12), midScore(12), maxScore(12), totalPoints(12)]).toEqual([12, 30, 48, 120]);
    const result = scoreResponses(repeat(rank(1, 3, 4, 2)));
    expect(result.total).toBe(120);
    expect(result.setCount).toBe(12);
  });
});

describe('the margins grow with the length of the quiz', () => {
  it('τ = ⌈2√n⌉ and τ2 = ⌈√n⌉', () => {
    expect([6, 12, 16].map((n) => [clearLead(n), pairLead(n)])).toEqual([
      [5, 3],
      [7, 4],
      [8, 4],
    ]);
  });
});

describe('the guide’s test vectors (§3D8)', () => {
  it('1 — first in every set is a point, with the last-ranked as lowest', () => {
    const result = scoreResponses(repeat(rank(1, 2, 3, 4)));
    expect(result.scores).toEqual(scores(48, 36, 24, 12));
    expect(result.placement).toEqual({ kind: 'point', preference: 'active' });
    expect(result.lead).toBe(12);
    expect(result.lowest).toEqual({ preference: 'pragmatist', gap: 12 });
    expect(result.tensions).toEqual({
      grasping: { kind: 'lean', towards: 'active', by: 24 },
      transforming: { kind: 'lean', towards: 'reflective', by: 24 },
    });
  });

  it('2 — each rank given to each preference equally is a spread', () => {
    const responses: Responses = [
      ...repeat(rank(1, 2, 3, 4), 3),
      ...repeat(rank(2, 3, 4, 1), 3),
      ...repeat(rank(3, 4, 1, 2), 3),
      ...repeat(rank(4, 1, 2, 3), 3),
    ];
    const result = scoreResponses(responses);
    expect(result.scores).toEqual(scores(30, 30, 30, 30));
    expect(result.placement).toEqual({ kind: 'spread' });
    expect(result.lowest).toBeNull();
    expect(result.tensions).toEqual({ grasping: { kind: 'even' }, transforming: { kind: 'even' } });
  });

  it('3 — two neighbours level and well ahead stand between them', () => {
    const result = scoreResponses([...repeat(rank(1, 2, 4, 3), 6), ...repeat(rank(2, 1, 3, 4), 6)]);
    expect(result.scores).toEqual(scores(42, 42, 18, 18));
    expect(result.placement).toEqual({ kind: 'between', pair: ['active', 'reflective'] });
    expect(result.lowest).toBeNull();
  });

  it('4 — two opposites level and well ahead stand in the centre', () => {
    const result = scoreResponses([...repeat(rank(1, 3, 2, 4), 6), ...repeat(rank(2, 4, 1, 3), 6)]);
    expect(result.scores).toEqual(scores(42, 18, 42, 18));
    expect(result.placement).toEqual({ kind: 'opposite', pair: ['active', 'theorist'] });
    expect(result.tensions).toEqual({ grasping: { kind: 'even' }, transforming: { kind: 'even' } });
  });

  it('5 — a lead of exactly τ is a point', () => {
    const result = classify(scores(37, 30, 27, 26), 12);
    expect(result.placement).toEqual({ kind: 'point', preference: 'active' });
    expect(result.lead).toBe(7);
    expect(result.lowest).toBeNull();
    expect(result.tensions.grasping).toEqual({ kind: 'lean', towards: 'active', by: 10 });
    expect(result.tensions.transforming).toEqual({ kind: 'even' });
  });

  it('6 — a lead of τ − 1, with no pair ahead, is a spread', () => {
    expect(classify(scores(36, 30, 28, 26), 12).placement).toEqual({ kind: 'spread' });
  });

  it('7 — a pair ahead by exactly τ2 is between, when neighbours', () => {
    const result = classify(scores(36, 31, 26, 27), 12);
    expect(result.order).toEqual(['active', 'reflective', 'pragmatist', 'theorist']);
    expect(result.placement).toEqual({ kind: 'between', pair: ['active', 'reflective'] });
  });

  it('8 — a pair ahead, when opposites, is opposite', () => {
    expect(classify(scores(34, 26, 34, 26), 12).placement).toEqual({
      kind: 'opposite',
      pair: ['active', 'theorist'],
    });
  });

  it('9 — the first version’s counter-example names its top score', () => {
    // At six sets the first version told this person "Activist" while
    // the table under it led with Pragmatist by five points.
    const result = classify(scores(32, 32, 14, 42), 12);
    expect(result.placement).toEqual({ kind: 'point', preference: 'pragmatist' });
    expect(result.lowest).toEqual({ preference: 'theorist', gap: 18 });
    expect(result.tensions.grasping).toEqual({ kind: 'lean', towards: 'active', by: 18 });
    expect(result.tensions.transforming).toEqual({ kind: 'lean', towards: 'pragmatist', by: 10 });
  });

  it('every ranking given twelve times is a point at the first, with the last as lowest', () => {
    const permutations: number[][] = [];
    const permute = (rest: number[], taken: number[]): void => {
      if (rest.length === 0) {
        permutations.push(taken);
        return;
      }
      rest.forEach((value, index) => {
        permute([...rest.slice(0, index), ...rest.slice(index + 1)], [...taken, value]);
      });
    };
    permute([1, 2, 3, 4], []);
    expect(permutations).toHaveLength(24);

    for (const ranks of permutations) {
      const result = scoreResponses(repeat(rank(ranks[0]!, ranks[1]!, ranks[2]!, ranks[3]!)));
      expect(result.placement).toEqual({
        kind: 'point',
        preference: PREFERENCES[ranks.indexOf(1)],
      });
      expect(result.lowest?.preference).toBe(PREFERENCES[ranks.indexOf(4)]);
    }
  });
});

describe('placement details', () => {
  it('lists a pair that wraps round the top clockwise, Pragmatist then Active', () => {
    // The marker goes 45° clockwise from the first of the pair, so the
    // order is what puts it on the right diagonal.
    expect(classify(scores(40, 20, 20, 40), 12).placement).toEqual({
      kind: 'between',
      pair: ['pragmatist', 'active'],
    });
  });

  it('never lets an exact tie decide: level top two with no lead over the third is a spread', () => {
    expect(classify(scores(32, 32, 30, 26), 12).placement).toEqual({ kind: 'spread' });
  });

  it('never names a single point unless it is the highest score', () => {
    for (const vector of [scores(40, 26, 27, 27), scores(26, 27, 40, 27), scores(27, 26, 27, 40)]) {
      const result = classify(vector, 12);
      if (result.placement.kind === 'point') {
        expect(vector[result.placement.preference]).toBe(Math.max(...Object.values(vector)));
      }
    }
  });

  it('is deterministic: the same answers always read the same way', () => {
    const responses = [...repeat(rank(1, 2, 3, 4), 6), ...repeat(rank(2, 1, 4, 3), 6)];
    expect(scoreResponses(responses.map((entry) => ({ ...entry })))).toEqual(
      scoreResponses(responses),
    );
  });
});

describe('refusing bad input', () => {
  it('rejects a repeated rank', () => {
    expect(() => scoreResponses([rank(1, 1, 3, 4)])).toThrow(InvalidResponsesError);
  });
  it('rejects an out-of-range rank', () => {
    expect(() => scoreResponses([rank(0, 2, 3, 4)])).toThrow(/whole numbers/);
  });
  it('rejects a fractional rank', () => {
    expect(() => scoreResponses([rank(1.5, 2, 3, 4)])).toThrow(/whole numbers/);
  });
  it('rejects an empty instrument rather than scoring it as zeroes', () => {
    expect(() => scoreResponses([])).toThrow(/no rankings/);
  });
  it('rejects the wrong number of sets when told how many to expect', () => {
    expect(() => scoreResponses(repeat(rank(1, 2, 3, 4), 6), 12)).toThrow(/expected 12/);
    expect(() => assertValidResponses(repeat(rank(1, 2, 3, 4), 12), 12)).not.toThrow();
  });
});

describe('how often each placement happens under random answering', () => {
  /**
   * Exact, not simulated: the distribution of the four scores over all
   * 24^12 ways of answering, by convolution, assuming every ranking is
   * equally likely. This is the floor the statements have to beat — a
   * random responder is named a single point about one time in eight —
   * and it matches the content review's own simulation of random
   * responding (12% / 18% / 9% / 61%).
   */
  it('names a single point for about one random responder in eight', () => {
    const n = 12;
    const permutations: Ranking[] = [];
    const permute = (rest: number[], taken: number[]): void => {
      if (rest.length === 0) {
        permutations.push(rank(taken[0]!, taken[1]!, taken[2]!, taken[3]!));
        return;
      }
      rest.forEach((value, index) => {
        permute([...rest.slice(0, index), ...rest.slice(index + 1)], [...taken, value]);
      });
    };
    permute([1, 2, 3, 4], []);

    // The fourth score is fixed by the other three: they total 10n.
    let distribution = new Map<string, number>([['0,0,0', 1]]);
    for (let set = 0; set < n; set += 1) {
      const next = new Map<string, number>();
      for (const [key, count] of distribution) {
        const [a, r, t] = key.split(',').map(Number) as [number, number, number];
        for (const ranking of permutations) {
          const nextKey = `${a + pointsForRank(ranking.active)},${r + pointsForRank(ranking.reflective)},${t + pointsForRank(ranking.theorist)}`;
          next.set(nextKey, (next.get(nextKey) ?? 0) + count);
        }
      }
      distribution = next;
    }

    const share = { point: 0, between: 0, opposite: 0, spread: 0 };
    let total = 0;
    for (const [key, count] of distribution) {
      const [a, r, t] = key.split(',').map(Number) as [number, number, number];
      share[classify(scores(a, r, t, totalPoints(n) - a - r - t), n).placement.kind] += count;
      total += count;
    }

    expect(share.point / total).toBeCloseTo(0.1255, 3);
    expect(share.between / total).toBeCloseTo(0.1809, 3);
    expect(share.opposite / total).toBeCloseTo(0.0904, 3);
    expect(share.spread / total).toBeCloseTo(0.6032, 3);
  });
});
