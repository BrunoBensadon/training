/**
 * Scoring.
 *
 * Specified in docs/reviews/elc-placement-2-content-guide.md §3D, which is
 * the place to read *why*; this file says *what*.
 *
 * Reverse-ranked points: the statement ranked 1st scores 4, 4th scores 1.
 * Summed per preference across the n sets, so each preference lands
 * between n and 4n, the middle is 2.5n, and the four always total 10n.
 *
 * Because every answer is a ranking, the scores are ipsative: they compare
 * one person's preferences with each other and say nothing about how
 * strong a preference is compared with anyone else.
 *
 * Where to stand comes from the gaps between the sorted scores, judged
 * against margins that grow with the length of the quiz:
 *
 *   τ  = ⌈2√n⌉   clear lead      (n = 12 → 7)
 *   τ2 = ⌈√n⌉    pair ahead      (n = 12 → 4)
 *
 * τ is about 1.2 standard errors of the difference between two scores. A
 * single point is named only when the top score leads the next by τ;
 * otherwise, if the top two lead the rest by τ2, the person stands between
 * them (neighbours) or in the centre (opposites); otherwise in the centre.
 * No exact tie can ever decide a placement.
 */
import {
  PREFERENCES,
  RANKS,
  TENSIONS,
  TENSION_POLES,
  areAdjacent,
  nextInCycle,
  type Preference,
  type Responses,
  type Tension,
} from './model.ts';

/** 1st choice is worth 4 points, 4th is worth 1. */
export function pointsForRank(rank: number): number {
  return PREFERENCES.length + 1 - rank;
}

/** τ: how far the top score must lead the next before one point is named. */
export function clearLead(setCount: number): number {
  return Math.ceil(2 * Math.sqrt(setCount));
}

/** τ2: how far the top two must lead the third to be named as a pair. */
export function pairLead(setCount: number): number {
  return Math.ceil(Math.sqrt(setCount));
}

export type Placement =
  /** One preference leads the next by at least τ: stand at it. */
  | { kind: 'point'; preference: Preference }
  /** Two neighbours on the circle lead the rest: stand on the circle
   *  halfway between them. Listed clockwise, so the second follows the
   *  first round the cycle. */
  | { kind: 'between'; pair: readonly [Preference, Preference] }
  /** Two opposite preferences lead the rest: stand in the centre, on the
   *  line between them. Listed in canonical order. */
  | { kind: 'opposite'; pair: readonly [Preference, Preference] }
  /** Nothing clearly ahead: stand in the centre. */
  | { kind: 'spread' };

/** Kolb's tension, read with the same margin as a clear lead. */
export type TensionReading =
  | { kind: 'lean'; towards: Preference; by: number }
  | { kind: 'even' };

export interface Classification {
  placement: Placement;
  /** Highest first; equal scores keep canonical order. Display only —
   *  never used to break a tie in the placement. */
  order: Preference[];
  /** How far the top score leads the second. */
  lead: number;
  /** The lowest preference, when it trails the third by at least τ. */
  lowest: { preference: Preference; gap: number } | null;
  tensions: Record<Tension, TensionReading>;
  /** The margins used, so the screen can quote them. */
  clearLead: number;
  pairLead: number;
}

export interface Result extends Classification {
  scores: Record<Preference, number>;
  setCount: number;
  total: number;
}

export class InvalidResponsesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidResponsesError';
  }
}

/**
 * Rejects anything that is not a complete set of rankings, because a
 * partially answered instrument that silently scores as zeroes is worse
 * than one that refuses.
 */
export function assertValidResponses(responses: Responses, expectedSets?: number): void {
  if (expectedSets !== undefined && responses.length !== expectedSets) {
    throw new InvalidResponsesError(
      `expected ${expectedSets} rankings, got ${responses.length}`,
    );
  }
  if (responses.length === 0) {
    throw new InvalidResponsesError('no rankings given');
  }
  responses.forEach((ranking, index) => {
    const ranks = PREFERENCES.map((preference) => ranking[preference]);
    if (ranks.some((rank) => !Number.isInteger(rank) || rank < 1 || rank > PREFERENCES.length)) {
      throw new InvalidResponsesError(`set ${index + 1}: ranks must be whole numbers 1-4`);
    }
    if (new Set(ranks).size !== PREFERENCES.length) {
      throw new InvalidResponsesError(`set ${index + 1}: each rank must be used exactly once`);
    }
  });
}

/**
 * Placement, lowest and tensions from the four scores alone. Separate from
 * `scoreResponses` so it can be checked against score vectors directly.
 */
export function classify(scores: Record<Preference, number>, setCount: number): Classification {
  const tau = clearLead(setCount);
  const tau2 = pairLead(setCount);

  const order = [...PREFERENCES].sort((a, b) => {
    const difference = scores[b] - scores[a];
    if (difference !== 0) return difference;
    return PREFERENCES.indexOf(a) - PREFERENCES.indexOf(b);
  });
  const [p1, p2, p3, p4] = order as [Preference, Preference, Preference, Preference];
  const lead = scores[p1] - scores[p2];
  const pairGap = scores[p2] - scores[p3];
  const lowestGap = scores[p3] - scores[p4];

  // Each branch needs a strictly positive gap, so the preference or pair
  // it names is unique even when the display order had to break a tie.
  let placement: Placement;
  if (lead >= tau) {
    placement = { kind: 'point', preference: p1 };
  } else if (pairGap >= tau2 && areAdjacent(p1, p2)) {
    placement = { kind: 'between', pair: nextInCycle(p1) === p2 ? [p1, p2] : [p2, p1] };
  } else if (pairGap >= tau2) {
    placement = {
      kind: 'opposite',
      pair: PREFERENCES.indexOf(p1) < PREFERENCES.indexOf(p2) ? [p1, p2] : [p2, p1],
    };
  } else {
    placement = { kind: 'spread' };
  }

  const tensions = Object.fromEntries(
    TENSIONS.map((tension) => {
      const { positive, negative } = TENSION_POLES[tension];
      const difference = scores[positive] - scores[negative];
      const reading: TensionReading =
        Math.abs(difference) >= tau
          ? { kind: 'lean', towards: difference > 0 ? positive : negative, by: Math.abs(difference) }
          : { kind: 'even' };
      return [tension, reading];
    }),
  ) as Record<Tension, TensionReading>;

  return {
    placement,
    order,
    lead,
    lowest: lowestGap >= tau ? { preference: p4, gap: lowestGap } : null,
    tensions,
    clearLead: tau,
    pairLead: tau2,
  };
}

export function scoreResponses(responses: Responses, expectedSets?: number): Result {
  assertValidResponses(responses, expectedSets);

  const scores = Object.fromEntries(PREFERENCES.map((preference) => [preference, 0])) as Record<
    Preference,
    number
  >;
  for (const ranking of responses) {
    for (const preference of PREFERENCES) {
      scores[preference] += pointsForRank(ranking[preference]);
    }
  }

  return {
    ...classify(scores, responses.length),
    scores,
    setCount: responses.length,
    total: PREFERENCES.reduce((sum, preference) => sum + scores[preference], 0),
  };
}

const FIRST = RANKS[0];
const LAST = RANKS[RANKS.length - 1]!;

/** The fewest points one preference can collect: last in every set. */
export function minScore(setCount: number): number {
  return setCount * pointsForRank(LAST);
}

/** The most points one preference can collect: first in every set. */
export function maxScore(setCount: number): number {
  return setCount * pointsForRank(FIRST);
}

/** The middle of the range, where an even spread puts every score. */
export function midScore(setCount: number): number {
  return (minScore(setCount) + maxScore(setCount)) / 2;
}

/**
 * The four scores always add to this. Every rank 1-4 is given out once
 * per set, so each set contributes 4 + 3 + 2 + 1.
 */
export function totalPoints(setCount: number): number {
  return setCount * ((PREFERENCES.length * (PREFERENCES.length + 1)) / 2);
}
