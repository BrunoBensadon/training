/**
 * Scoring.
 *
 * Reverse-ranked points: the statement ranked 1st scores 4, 4th scores 1.
 * Summed per preference across the sets, so with six sets each preference
 * lands between 6 and 24 and the four always total 60.
 *
 * Where you stand comes from the scores themselves: the preference with
 * the most points. The first version read it off the signs of two axes
 * built from pairs of preferences, which could send someone to stand at
 * their third-highest score; see docs/reviews/elc-placement-1-evaluation.md.
 *
 * The two axes are still computed, as Kolb's dialectics: each compares
 * the two preferences opposite each other on the circle.
 *
 * The cases a facilitator actually has to handle in a room — two
 * preferences level, an even spread — are handled deliberately here
 * rather than falling out of whatever `sort` happens to do.
 */
import {
  AXES,
  AXIS_POLES,
  PREFERENCES,
  RANKS,
  areAdjacent,
  nextInCycle,
  type Axis,
  type Preference,
  type Responses,
} from './model.ts';

/** 1st choice is worth 4 points, 4th is worth 1. */
export function pointsForRank(rank: number): number {
  return PREFERENCES.length + 1 - rank;
}

/**
 * How close two preferences have to be before we refuse to separate them.
 *
 * Three points is one statement moving one place in three of the six
 * sets. Below that the ordering is an artefact of which set someone
 * happened to read carefully, not a difference worth naming out loud, so
 * the result screen says the two are level instead of picking one.
 */
export const BAND = 3;

export type Placement =
  /** One preference has the most points: stand at it. */
  | { kind: 'single'; preference: Preference }
  /** Two neighbours on the circle share the most points: stand on the
   *  arc between them. Listed clockwise, so the second follows the first
   *  round the cycle. */
  | { kind: 'between'; pair: readonly [Preference, Preference] }
  /** No single part of the circle fits — an even spread, two opposite
   *  preferences level, or three level. Stand in the middle. */
  | { kind: 'centre' };

export interface Result {
  scores: Record<Preference, number>;
  /** Kolb's two dialectics; positive towards the axis's `positive` pole. */
  axes: Record<Axis, number>;
  /** Highest first; ties broken by canonical order, not by chance. */
  order: Preference[];
  placement: Placement;
  /** Every preference within BAND of the highest score, in `order` order.
   *  More than one means the result screen must say so rather than
   *  presenting the first as the answer. */
  closeCall: Preference[];
  /** Preferences sharing the highest score exactly. */
  tiedAtTop: Preference[];
  /** All four scores identical — a real result, not a failure. */
  balanced: boolean;
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

function placementFor(tiedAtTop: Preference[]): Placement {
  if (tiedAtTop.length === 1) return { kind: 'single', preference: tiedAtTop[0]! };

  if (tiedAtTop.length === 2) {
    const [a, b] = tiedAtTop as [Preference, Preference];
    if (areAdjacent(a, b)) {
      return { kind: 'between', pair: nextInCycle(a) === b ? [a, b] : [b, a] };
    }
  }

  return { kind: 'centre' };
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

  const axes = Object.fromEntries(
    AXES.map((axis) => [
      axis,
      scores[AXIS_POLES[axis].positive] - scores[AXIS_POLES[axis].negative],
    ]),
  ) as Record<Axis, number>;

  // Highest first. Equal scores keep canonical order so that the same
  // answers always produce the same reading — there is no hidden
  // tie-break, because a hidden tie-break is a claim we cannot support.
  const order = [...PREFERENCES].sort((a, b) => {
    const difference = scores[b] - scores[a];
    if (difference !== 0) return difference;
    return PREFERENCES.indexOf(a) - PREFERENCES.indexOf(b);
  });

  const top = scores[order[0]!];
  const closeCall = order.filter((preference) => top - scores[preference] <= BAND);
  const tiedAtTop = order.filter((preference) => scores[preference] === top);
  const balanced = tiedAtTop.length === PREFERENCES.length;

  return {
    scores,
    axes,
    order,
    placement: placementFor(tiedAtTop),
    closeCall,
    tiedAtTop,
    balanced,
    total: PREFERENCES.reduce((sum, preference) => sum + scores[preference], 0),
  };
}

/**
 * The four scores always add to this. Every rank 1-4 is given out once
 * per set, so each set contributes 4 + 3 + 2 + 1.
 */
export function totalPoints(setCount: number): number {
  return setCount * ((PREFERENCES.length * (PREFERENCES.length + 1)) / 2);
}

const FIRST = RANKS[0];
const LAST = RANKS[RANKS.length - 1]!;

/** The most points one preference can collect. */
export function maxScore(setCount: number): number {
  return setCount * pointsForRank(FIRST);
}

/** The furthest an axis can travel: first place against last, every set. */
export function axisRange(setCount: number): number {
  return setCount * (pointsForRank(FIRST) - pointsForRank(LAST));
}
