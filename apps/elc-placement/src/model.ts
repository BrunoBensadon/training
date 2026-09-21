/** The shared vocabulary. Everything else in the app speaks in these terms. */

/**
 * Canonical order. Used for encoding, for deterministic tie-breaking, and
 * for laying out the circle. Changing it changes saved links, so don't.
 */
export const QUADRANTS = ['activist', 'reflector', 'theorist', 'pragmatist'] as const;

export type Quadrant = (typeof QUADRANTS)[number];

export const AXES = ['perceiving', 'processing'] as const;
export type Axis = (typeof AXES)[number];

/**
 * Which axis poles a quadrant sits on.
 *
 *   Perceiving:  Concrete (+)  ..  Abstract (-)
 *   Processing:  Active (+)    ..  Reflective (-)
 */
export const QUADRANT_POLES: Record<Quadrant, { perceiving: 1 | -1; processing: 1 | -1 }> = {
  activist: { perceiving: 1, processing: 1 },
  reflector: { perceiving: 1, processing: -1 },
  theorist: { perceiving: -1, processing: -1 },
  pragmatist: { perceiving: -1, processing: 1 },
};

/** One set's answer: the rank 1–4 given to each quadrant's statement. */
export type Ranking = Record<Quadrant, number>;

/** One ranking per set, in the order the sets appear in the locale file. */
export type Responses = Ranking[];

export const RANKS = [1, 2, 3, 4] as const;
export type Rank = (typeof RANKS)[number];

export function isQuadrant(value: unknown): value is Quadrant {
  return typeof value === 'string' && (QUADRANTS as readonly string[]).includes(value);
}

/** A ranking part-way through being given. */
export type PartialRanking = Partial<Record<Quadrant, number>>;

export function isComplete(ranking: PartialRanking): ranking is Ranking {
  const used = QUADRANTS.map((quadrant) => ranking[quadrant]);
  return used.every((rank) => rank !== undefined) && new Set(used).size === QUADRANTS.length;
}
