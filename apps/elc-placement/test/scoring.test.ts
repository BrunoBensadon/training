import { describe, expect, it } from 'vitest';
import {
  BAND,
  InvalidResponsesError,
  assertValidResponses,
  axisRange,
  pointsForRank,
  scoreResponses,
} from '../src/scoring.ts';
import { QUADRANTS, type Quadrant, type Ranking, type Responses } from '../src/model.ts';

/** Shorthand: rank(1, 2, 3, 4) in canonical quadrant order. */
function rank(activist: number, reflector: number, theorist: number, pragmatist: number): Ranking {
  return { activist, reflector, theorist, pragmatist };
}

function repeat(ranking: Ranking, times = 6): Responses {
  return Array.from({ length: times }, () => ({ ...ranking }));
}

describe('pointsForRank', () => {
  it('is reverse-ranked: first choice scores most', () => {
    expect([1, 2, 3, 4].map(pointsForRank)).toEqual([4, 3, 2, 1]);
  });
});

describe('scoreResponses', () => {
  it('sums reverse-ranked points per quadrant and always totals 60', () => {
    const result = scoreResponses(repeat(rank(1, 2, 3, 4)));
    expect(result.scores).toEqual({ activist: 24, reflector: 18, theorist: 12, pragmatist: 6 });
    expect(result.total).toBe(60);
  });

  it('keeps every quadrant inside its possible range', () => {
    const result = scoreResponses(repeat(rank(4, 3, 2, 1)));
    for (const quadrant of QUADRANTS) {
      expect(result.scores[quadrant]).toBeGreaterThanOrEqual(6);
      expect(result.scores[quadrant]).toBeLessThanOrEqual(24);
    }
  });

  it('derives the quadrant from the signs of the two axes', () => {
    // activist 1st, pragmatist 2nd, reflector 3rd, theorist 4th.
    const result = scoreResponses(repeat(rank(1, 3, 4, 2)));
    expect(result.scores).toEqual({ activist: 24, reflector: 12, theorist: 6, pragmatist: 18 });
    // Concrete over abstract, active over reflective.
    expect(result.axes).toEqual({ perceiving: 12, processing: 24 });
    expect(result.placement).toEqual({ kind: 'quadrant', quadrant: 'activist' });
  });

  it('puts a straight 1-2-3-4 down the canonical order on an axis, not in a quadrant', () => {
    // Worth pinning: ranking the quadrants in the order they are declared
    // cancels the processing axis exactly, and the honest answer is "you
    // are on the line", not "you are an Activist".
    const result = scoreResponses(repeat(rank(1, 2, 3, 4)));
    expect(result.axes).toEqual({ perceiving: 24, processing: 0 });
    expect(result.placement).toEqual({
      kind: 'edge',
      axis: 'processing',
      between: ['activist', 'reflector'],
    });
  });

  it('reaches each quadrant', () => {
    const cases: Array<[Ranking, Quadrant]> = [
      [rank(1, 3, 4, 2), 'activist'],
      [rank(3, 1, 2, 4), 'reflector'],
      [rank(4, 2, 1, 3), 'theorist'],
      [rank(3, 4, 2, 1), 'pragmatist'],
    ];
    for (const [ranking, expected] of cases) {
      expect(scoreResponses(repeat(ranking)).placement).toEqual({
        kind: 'quadrant',
        quadrant: expected,
      });
    }
  });

  describe('the cases a facilitator has to handle in the room', () => {
    it('an exactly balanced profile is a result, not a failure', () => {
      // Each quadrant takes each rank in turn across four sets; repeated to
      // six would skew, so this uses a four-set instrument.
      const responses: Responses = [
        rank(1, 2, 3, 4),
        rank(2, 3, 4, 1),
        rank(3, 4, 1, 2),
        rank(4, 1, 2, 3),
      ];
      const result = scoreResponses(responses);
      expect(result.scores).toEqual({ activist: 10, reflector: 10, theorist: 10, pragmatist: 10 });
      expect(result.balanced).toBe(true);
      expect(result.axes).toEqual({ perceiving: 0, processing: 0 });
      expect(result.placement).toEqual({ kind: 'centre' });
      expect(result.tiedAtTop).toEqual([...QUADRANTS]);
      expect(result.closeCall).toEqual([...QUADRANTS]);
    });

    it('both axes at zero without the quadrants being equal is a diagonal, not a centre-dweller', () => {
      // activist = theorist and reflector = pragmatist makes both axes zero.
      const responses: Responses = [
        rank(1, 3, 2, 4),
        rank(1, 3, 2, 4),
        rank(2, 4, 1, 3),
        rank(2, 4, 1, 3),
      ];
      const result = scoreResponses(responses);
      expect(result.axes).toEqual({ perceiving: 0, processing: 0 });
      expect(result.placement).toEqual({ kind: 'centre' });
      expect(result.balanced).toBe(false);
      // The shape still has something to say: two quadrants lead.
      expect(result.scores.activist).toBe(result.scores.theorist);
      expect(result.scores.reflector).toBe(result.scores.pragmatist);
      expect(result.scores.activist).toBeGreaterThan(result.scores.reflector);
    });

    it('a single axis at zero puts you on a line between two quadrants', () => {
      // Perceiving zero, processing active: between activist and pragmatist.
      const responses: Responses = [rank(1, 4, 3, 2), rank(2, 3, 4, 1)];
      const result = scoreResponses(responses);
      expect(result.axes.perceiving).toBe(0);
      expect(result.axes.processing).toBeGreaterThan(0);
      expect(result.placement).toEqual({
        kind: 'edge',
        axis: 'perceiving',
        between: ['activist', 'pragmatist'],
      });
    });

    it('the other single-axis zero puts you on the other line', () => {
      // Processing zero, perceiving concrete: between activist and reflector.
      const responses: Responses = [rank(1, 2, 4, 3), rank(2, 1, 3, 4)];
      const result = scoreResponses(responses);
      expect(result.axes.processing).toBe(0);
      expect(result.axes.perceiving).toBeGreaterThan(0);
      expect(result.placement).toEqual({
        kind: 'edge',
        axis: 'processing',
        between: ['activist', 'reflector'],
      });
    });

    it('breaks an exact tie by canonical order rather than by chance', () => {
      const responses: Responses = [rank(1, 2, 3, 4), rank(2, 1, 4, 3)];
      const result = scoreResponses(responses);
      expect(result.scores.activist).toBe(result.scores.reflector);
      expect(result.order[0]).toBe('activist');
      expect(result.tiedAtTop).toEqual(['activist', 'reflector']);
    });

    it('is deterministic: the same answers always read the same way', () => {
      const responses: Responses = [rank(1, 2, 3, 4), rank(2, 1, 4, 3)];
      const first = scoreResponses(responses);
      const second = scoreResponses(responses.map((entry) => ({ ...entry })));
      expect(second).toEqual(first);
    });

    it('flags a close call when the top two are within one band', () => {
      // activist 21, reflector 19: two apart, inside the band of 3.
      const responses: Responses = [
        rank(1, 2, 3, 4),
        rank(1, 2, 3, 4),
        rank(1, 2, 3, 4),
        rank(1, 2, 4, 3),
        rank(2, 1, 3, 4),
        rank(2, 1, 4, 3),
      ];
      const result = scoreResponses(responses);
      expect(result.scores.activist - result.scores.reflector).toBeLessThanOrEqual(BAND);
      expect(result.closeCall.length).toBeGreaterThan(1);
      expect(result.closeCall.slice(0, 2)).toEqual(['activist', 'reflector']);
      expect(result.tiedAtTop).toEqual(['activist']);
    });

    it('does not flag a close call when the lead is clear', () => {
      const result = scoreResponses(repeat(rank(1, 2, 3, 4)));
      expect(result.closeCall).toEqual(['activist']);
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

describe('axisRange', () => {
  it('is the furthest an axis can travel over six sets', () => {
    expect(axisRange(6)).toBe(24);
    const extreme = scoreResponses(repeat(rank(1, 2, 3, 4)));
    expect(Math.abs(extreme.axes.perceiving)).toBeLessThanOrEqual(axisRange(6));
  });

  it('is actually reached by the most extreme possible answers', () => {
    const allConcrete = scoreResponses(repeat(rank(1, 2, 3, 4)));
    expect(allConcrete.axes.perceiving).toBe(axisRange(6));
  });
});

describe('how often the boundary cases actually happen', () => {
  /**
   * The edge and centre placements are not defensive programming for a
   * case nobody hits. With six sets the axes move in steps of two and
   * land on zero often.
   *
   * This enumerates the exact joint distribution of the two axes over all
   * 24^6 ways of answering — by convolution, not by brute force — under
   * the assumption that every ranking is equally likely. Real respondents
   * are not random, so treat these as an upper bound; they are still the
   * reason a facilitator needs somewhere to put these people.
   */
  function axisDistribution(setCount: number): {
    total: number;
    onALine: number;
    deadCentre: number;
  } {
    const perSet: Array<[number, number]> = [];
    const permute = (rest: number[], taken: number[]): void => {
      if (rest.length === 0) {
        const ranking = rank(taken[0]!, taken[1]!, taken[2]!, taken[3]!);
        const result = scoreResponses([ranking]);
        perSet.push([result.axes.perceiving, result.axes.processing]);
        return;
      }
      rest.forEach((value, index) => {
        permute([...rest.slice(0, index), ...rest.slice(index + 1)], [...taken, value]);
      });
    };
    permute([1, 2, 3, 4], []);
    expect(perSet).toHaveLength(24);

    let distribution = new Map<string, number>([['0,0', 1]]);
    for (let set = 0; set < setCount; set += 1) {
      const next = new Map<string, number>();
      for (const [key, count] of distribution) {
        const [a, b] = key.split(',').map(Number) as [number, number];
        for (const [dp, dq] of perSet) {
          const nextKey = `${a + dp},${b + dq}`;
          next.set(nextKey, (next.get(nextKey) ?? 0) + count);
        }
      }
      distribution = next;
    }

    let total = 0;
    let onALine = 0;
    let deadCentre = 0;
    for (const [key, count] of distribution) {
      const [a, b] = key.split(',').map(Number) as [number, number];
      total += count;
      if (a === 0 || b === 0) onALine += count;
      if (a === 0 && b === 0) deadCentre += count;
    }
    return { total, onALine, deadCentre };
  }

  it('puts roughly a quarter of random responders on a line', () => {
    const { total, onALine, deadCentre } = axisDistribution(6);
    expect(total).toBe(24 ** 6);

    const lineShare = onALine / total;
    const centreShare = deadCentre / total;

    // ~23.2% on a line, ~1.5% dead centre. In a room of twenty, that is
    // several people who cannot be put inside a quadrant.
    expect(lineShare).toBeGreaterThan(0.22);
    expect(lineShare).toBeLessThan(0.24);
    expect(centreShare).toBeGreaterThan(0.014);
    expect(centreShare).toBeLessThan(0.017);
  });
});
