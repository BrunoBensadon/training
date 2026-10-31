import { describe, expect, it } from 'vitest';
import {
  BAND,
  InvalidResponsesError,
  assertValidResponses,
  axisRange,
  maxScore,
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

function repeat(ranking: Ranking, times = 6): Responses {
  return Array.from({ length: times }, () => ({ ...ranking }));
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

describe('pointsForRank', () => {
  it('is reverse-ranked: first choice scores most', () => {
    expect([1, 2, 3, 4].map(pointsForRank)).toEqual([4, 3, 2, 1]);
  });
});

describe('scoreResponses', () => {
  it('sums reverse-ranked points per preference and always totals 60', () => {
    const result = scoreResponses(repeat(rank(1, 2, 3, 4)));
    expect(result.scores).toEqual({ active: 24, reflective: 18, theorist: 12, pragmatist: 6 });
    expect(result.total).toBe(60);
  });

  it('keeps every preference inside its possible range', () => {
    const result = scoreResponses(repeat(rank(4, 3, 2, 1)));
    for (const preference of PREFERENCES) {
      expect(result.scores[preference]).toBeGreaterThanOrEqual(6);
      expect(result.scores[preference]).toBeLessThanOrEqual(24);
    }
  });

  it('puts you at the preference with the most points', () => {
    // The case the first version got wrong: Active first in every set was
    // reported as "on the line between Activist and Reflector".
    const result = scoreResponses(repeat(rank(1, 2, 3, 4)));
    expect(result.placement).toEqual({ kind: 'single', preference: 'active' });
  });

  it('never places you anywhere but your highest score', () => {
    // Active 17, Theorist 16, Reflective 15, Pragmatist 12 — the first
    // version put this person at Reflector, their third-highest.
    const responses: Responses = [
      rank(1, 2, 3, 4),
      rank(1, 2, 3, 4),
      rank(1, 2, 3, 4),
      rank(2, 3, 1, 4),
      rank(4, 3, 2, 1),
      rank(4, 3, 2, 1),
    ];
    const result = scoreResponses(responses);
    expect(result.scores).toEqual({ active: 17, reflective: 15, theorist: 16, pragmatist: 12 });
    expect(result.placement).toEqual({ kind: 'single', preference: 'active' });
    expect(result.order).toEqual(['active', 'theorist', 'reflective', 'pragmatist']);
  });

  it('reaches each preference', () => {
    const cases: Array<[Ranking, Preference]> = [
      [rank(1, 3, 4, 2), 'active'],
      [rank(3, 1, 2, 4), 'reflective'],
      [rank(4, 2, 1, 3), 'theorist'],
      [rank(3, 4, 2, 1), 'pragmatist'],
    ];
    for (const [ranking, expected] of cases) {
      expect(scoreResponses(repeat(ranking)).placement).toEqual({
        kind: 'single',
        preference: expected,
      });
    }
  });

  it('computes the axes from the preferences facing each other', () => {
    // Active 24, Reflective 12, Theorist 6, Pragmatist 18.
    const result = scoreResponses(repeat(rank(1, 3, 4, 2)));
    // Perceiving: Active − Theorist. Processing: Pragmatist − Reflective.
    expect(result.axes).toEqual({ perceiving: 18, processing: 6 });
  });

  describe('the cases a facilitator has to handle in the room', () => {
    it('an exactly balanced profile is a result, not a failure', () => {
      // Each preference takes each rank in turn across four sets; repeated
      // to six would skew, so this uses a four-set instrument.
      const responses: Responses = [
        rank(1, 2, 3, 4),
        rank(2, 3, 4, 1),
        rank(3, 4, 1, 2),
        rank(4, 1, 2, 3),
      ];
      const result = scoreResponses(responses);
      expect(result.scores).toEqual({ active: 10, reflective: 10, theorist: 10, pragmatist: 10 });
      expect(result.balanced).toBe(true);
      expect(result.axes).toEqual({ perceiving: 0, processing: 0 });
      expect(result.placement).toEqual({ kind: 'centre' });
      expect(result.tiedAtTop).toEqual([...PREFERENCES]);
      expect(result.closeCall).toEqual([...PREFERENCES]);
    });

    it('two neighbours level at the top puts you on the circle between them', () => {
      const responses: Responses = [rank(1, 2, 3, 4), rank(2, 1, 4, 3)];
      const result = scoreResponses(responses);
      expect(result.tiedAtTop).toEqual(['active', 'reflective']);
      expect(result.placement).toEqual({ kind: 'between', pair: ['active', 'reflective'] });
    });

    it('lists a pair that wraps round the top clockwise, Pragmatist then Active', () => {
      const responses: Responses = [rank(1, 3, 4, 2), rank(2, 4, 3, 1)];
      const result = scoreResponses(responses);
      expect(result.tiedAtTop).toEqual(['active', 'pragmatist']);
      expect(result.placement).toEqual({ kind: 'between', pair: ['pragmatist', 'active'] });
    });

    it('two opposites level at the top puts you in the middle, not between them', () => {
      // Active and Theorist face each other across the circle; there is no
      // arc between them to stand on.
      const responses: Responses = [rank(1, 3, 2, 4), rank(2, 4, 1, 3)];
      const result = scoreResponses(responses);
      expect(result.tiedAtTop).toEqual(['active', 'theorist']);
      expect(result.placement).toEqual({ kind: 'centre' });
      expect(result.balanced).toBe(false);
    });

    it('three level at the top puts you in the middle', () => {
      const responses: Responses = [rank(1, 2, 3, 4), rank(2, 3, 1, 4), rank(3, 1, 2, 4)];
      const result = scoreResponses(responses);
      expect(result.tiedAtTop).toEqual(['active', 'reflective', 'theorist']);
      expect(result.placement).toEqual({ kind: 'centre' });
    });

    it('breaks an exact tie in the ordering by canonical order rather than by chance', () => {
      const responses: Responses = [rank(1, 2, 3, 4), rank(2, 1, 4, 3)];
      const result = scoreResponses(responses);
      expect(result.scores.active).toBe(result.scores.reflective);
      expect(result.order[0]).toBe('active');
    });

    it('is deterministic: the same answers always read the same way', () => {
      const responses: Responses = [rank(1, 2, 3, 4), rank(2, 1, 4, 3)];
      const first = scoreResponses(responses);
      const second = scoreResponses(responses.map((entry) => ({ ...entry })));
      expect(second).toEqual(first);
    });

    it('flags a close call when the top two are within one band', () => {
      // active 21, reflective 19: two apart, inside the band of 3.
      const responses: Responses = [
        rank(1, 2, 3, 4),
        rank(1, 2, 3, 4),
        rank(1, 2, 3, 4),
        rank(1, 2, 4, 3),
        rank(2, 1, 3, 4),
        rank(2, 1, 4, 3),
      ];
      const result = scoreResponses(responses);
      expect(result.scores.active - result.scores.reflective).toBeLessThanOrEqual(BAND);
      expect(result.closeCall.length).toBeGreaterThan(1);
      expect(result.closeCall.slice(0, 2)).toEqual(['active', 'reflective']);
      expect(result.tiedAtTop).toEqual(['active']);
    });

    it('does not flag a close call when the lead is clear', () => {
      const result = scoreResponses(repeat(rank(1, 2, 3, 4)));
      expect(result.closeCall).toEqual(['active']);
    });

    it('puts the band at three points, which is one place in half the sets', () => {
      expect(BAND).toBe(3);
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
      expect(() => scoreResponses(repeat(rank(1, 2, 3, 4), 5), 6)).toThrow(/expected 6/);
      expect(() => assertValidResponses(repeat(rank(1, 2, 3, 4), 6), 6)).not.toThrow();
    });
  });
});

describe('ranges', () => {
  it('maxScore is first place in every set', () => {
    expect(maxScore(6)).toBe(24);
    expect(scoreResponses(repeat(rank(1, 2, 3, 4))).scores.active).toBe(maxScore(6));
  });

  it('axisRange is first place against last, every set, and is reached', () => {
    expect(axisRange(6)).toBe(18);
    const extreme = scoreResponses(repeat(rank(1, 2, 4, 3)));
    expect(extreme.axes.perceiving).toBe(axisRange(6));
  });
});

describe('how often the in-between cases actually happen', () => {
  /**
   * "Between two" and "the middle" are not defensive programming for a
   * case nobody hits. This enumerates the exact distribution of the four
   * scores over all 24^6 ways of answering — by convolution, not brute
   * force — assuming every ranking is equally likely. Real respondents
   * are not random, so treat these as an upper bound; they are still the
   * reason a facilitator needs somewhere to put these people.
   */
  function placementDistribution(setCount: number): Record<string, number> {
    const perSet: Ranking[] = [];
    const permute = (rest: number[], taken: number[]): void => {
      if (rest.length === 0) {
        perSet.push(rank(taken[0]!, taken[1]!, taken[2]!, taken[3]!));
        return;
      }
      rest.forEach((value, index) => {
        permute([...rest.slice(0, index), ...rest.slice(index + 1)], [...taken, value]);
      });
    };
    permute([1, 2, 3, 4], []);
    expect(perSet).toHaveLength(24);

    let distribution = new Map<string, number>([['0,0,0,0', 1]]);
    for (let set = 0; set < setCount; set += 1) {
      const next = new Map<string, number>();
      for (const [key, count] of distribution) {
        const scores = key.split(',').map(Number);
        for (const ranking of perSet) {
          const nextKey = PREFERENCES.map(
            (preference, index) => scores[index]! + pointsForRank(ranking[preference]),
          ).join(',');
          next.set(nextKey, (next.get(nextKey) ?? 0) + count);
        }
      }
      distribution = next;
    }

    // Any responses with these scores place the same way; build one.
    const kinds: Record<string, number> = { single: 0, between: 0, centre: 0, total: 0 };
    for (const [key, count] of distribution) {
      const scores = key.split(',').map(Number);
      const top = Math.max(...scores);
      const tied = PREFERENCES.filter((_, index) => scores[index] === top);
      const kind =
        tied.length === 1
          ? 'single'
          : tied.length === 2 && areAdjacent(tied[0]!, tied[1]!)
            ? 'between'
            : 'centre';
      kinds[kind]! += count;
      kinds.total! += count;
    }
    return kinds;
  }

  it('places most random responders at one point, and some between or in the middle', () => {
    const { single, between, centre, total } = placementDistribution(6);
    expect(total).toBe(24 ** 6);
    // ~85.0% at one point, ~9.0% between two neighbours, ~5.9% in the
    // middle. In a room of twenty, a few people need somewhere to stand
    // that is not a point.
    expect(single! / total!).toBeGreaterThan(0.84);
    expect(single! / total!).toBeLessThan(0.86);
    expect(between! / total!).toBeGreaterThan(0.085);
    expect(between! / total!).toBeLessThan(0.095);
    expect(centre! / total!).toBeGreaterThan(0.055);
    expect(centre! / total!).toBeLessThan(0.065);
  });
});

describe('totalPoints', () => {
  it('is what the four scores always add up to', () => {
    expect(totalPoints(6)).toBe(60);
    const result = scoreResponses(repeat(rank(1, 3, 4, 2)));
    expect(result.total).toBe(totalPoints(6));
  });

  it('holds for an instrument of a different length', () => {
    const responses: Responses = [rank(1, 2, 3, 4), rank(2, 1, 4, 3)];
    expect(scoreResponses(responses).total).toBe(totalPoints(2));
  });
});
