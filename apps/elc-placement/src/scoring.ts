/**
 * Scoring.
 *
 * Reverse-ranked points: the statement ranked 1st scores 4, 4th scores 1.
 * Summed per quadrant across six sets, so each quadrant lands between 6 and
 * 24 and the four always total 60.
 *
 * The axes are computed from the same numbers and are the better-supported
 * unit. The quadrant is derived from their signs and is presentation only:
 * it is where you stand on a floor, not what you are.
 *
 * The cases a facilitator actually has to handle in a room — two quadrants
 * level, an axis at exactly zero, a completely even profile — are handled
 * deliberately here rather than falling out of whatever `sort` happens to
 * do.
 */
import { QUADRANTS, QUADRANT_POLES, type Axis, type Quadrant, type Responses } from './model.ts';

/** 1st choice is worth 4 points, 4th is worth 1. */
export function pointsForRank(rank: number): number {
  return QUADRANTS.length + 1 - rank;
}

/**
 * How close two quadrants have to be before we refuse to separate them.
 *
 * Three points is one statement moving one place in three of the six sets.
 * Below that the ordering is an artefact of which set someone happened to
 * read carefully, not a difference worth naming out loud, so the result
 * screen says the two are level instead of picking one.
 */
export const BAND = 3;

export type Placement =
  | { kind: 'quadrant'; quadrant: Quadrant }
  /** Balanced on one axis: standing on a line rather than in a quadrant. */
  | { kind: 'edge'; axis: Axis; between: readonly [Quadrant, Quadrant] }
  /** Balanced on both axes: standing at the centre of the circle. */
  | { kind: 'centre' };

export interface Result {
  scores: Record<Quadrant, number>;
  axes: Record<Axis, number>;
  /** Highest first; ties broken by canonical quadrant order, not by chance. */
  order: Quadrant[];
  placement: Placement;
  /** Every quadrant within BAND of the highest score, in `order` order.
   *  More than one means the result screen must say so rather than
   *  presenting the first as the answer. */
  closeCall: Quadrant[];
  /** Quadrants sharing the highest score exactly. */
  tiedAtTop: Quadrant[];
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
    const ranks = QUADRANTS.map((quadrant) => ranking[quadrant]);
    if (ranks.some((rank) => !Number.isInteger(rank) || rank < 1 || rank > QUADRANTS.length)) {
      throw new InvalidResponsesError(`set ${index + 1}: ranks must be whole numbers 1-4`);
    }
    if (new Set(ranks).size !== QUADRANTS.length) {
      throw new InvalidResponsesError(`set ${index + 1}: each rank must be used exactly once`);
    }
  });
}

const ACTIVE_PAIR = ['activist', 'pragmatist'] as const;
const REFLECTIVE_PAIR = ['reflector', 'theorist'] as const;
const CONCRETE_PAIR = ['activist', 'reflector'] as const;
const ABSTRACT_PAIR = ['theorist', 'pragmatist'] as const;

function placementFor(axes: Record<Axis, number>): Placement {
  const { perceiving, processing } = axes;

  if (perceiving === 0 && processing === 0) return { kind: 'centre' };

  if (perceiving === 0) {
    // Even between concrete and abstract; the processing axis still leans.
    return {
      kind: 'edge',
      axis: 'perceiving',
      between: processing > 0 ? ACTIVE_PAIR : REFLECTIVE_PAIR,
    };
  }

  if (processing === 0) {
    return {
      kind: 'edge',
      axis: 'processing',
      between: perceiving > 0 ? CONCRETE_PAIR : ABSTRACT_PAIR,
    };
  }

  const quadrant = QUADRANTS.find(
    (candidate) =>
      Math.sign(QUADRANT_POLES[candidate].perceiving) === Math.sign(perceiving) &&
      Math.sign(QUADRANT_POLES[candidate].processing) === Math.sign(processing),
  );
  /* c8 ignore next */
  if (!quadrant) throw new Error(`no quadrant for axes ${perceiving}/${processing}`);
  return { kind: 'quadrant', quadrant };
}

export function scoreResponses(responses: Responses, expectedSets?: number): Result {
  assertValidResponses(responses, expectedSets);

  const scores = Object.fromEntries(QUADRANTS.map((quadrant) => [quadrant, 0])) as Record<
    Quadrant,
    number
  >;

  for (const ranking of responses) {
    for (const quadrant of QUADRANTS) {
      scores[quadrant] += pointsForRank(ranking[quadrant]);
    }
  }

  const axes: Record<Axis, number> = {
    perceiving:
      scores[CONCRETE_PAIR[0]] +
      scores[CONCRETE_PAIR[1]] -
      scores[ABSTRACT_PAIR[0]] -
      scores[ABSTRACT_PAIR[1]],
    processing:
      scores[ACTIVE_PAIR[0]] +
      scores[ACTIVE_PAIR[1]] -
      scores[REFLECTIVE_PAIR[0]] -
      scores[REFLECTIVE_PAIR[1]],
  };

  // Highest first. Equal scores keep canonical order so that the same
  // answers always produce the same reading — there is no hidden
  // tie-break, because a hidden tie-break is a claim we cannot support.
  const order = [...QUADRANTS].sort((a, b) => {
    const difference = scores[b] - scores[a];
    if (difference !== 0) return difference;
    return QUADRANTS.indexOf(a) - QUADRANTS.indexOf(b);
  });

  const top = scores[order[0]!];
  const closeCall = order.filter((quadrant) => top - scores[quadrant] <= BAND);
  const tiedAtTop = order.filter((quadrant) => scores[quadrant] === top);
  const balanced = QUADRANTS.every((quadrant) => scores[quadrant] === top);

  return {
    scores,
    axes,
    order,
    placement: placementFor(axes),
    closeCall,
    tiedAtTop,
    balanced,
    total: QUADRANTS.reduce((sum, quadrant) => sum + scores[quadrant], 0),
  };
}

/** The furthest an axis can travel, for normalising the circle. */
export function axisRange(setCount: number): number {
  // Per set the best case is 4 + 3 on one pole against 2 + 1 on the other.
  return setCount * 4;
}
