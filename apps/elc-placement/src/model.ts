/** The shared vocabulary. Everything else in the app speaks in these terms. */

/**
 * The four preferences, in the order the learning cycle runs: clockwise
 * from the top of the circle.
 *
 *   Active      — North — concrete experience        (experiencing)
 *   Reflective  — East  — reflective observation     (reflecting)
 *   Theorist    — South — abstract conceptualisation (thinking)
 *   Pragmatist  — West  — active experimentation     (acting)
 *
 * Each preference is a *stage* of Kolb's cycle and sits on the cycle
 * itself, at the end of one axis. They are not the quadrants between the
 * axes: those are Kolb's combined styles, which this tool does not report.
 * Treating the four as quadrants was the error in the first version — see
 * docs/reviews/elc-placement-1-evaluation.md.
 *
 * Canonical order. It is used for encoding, for deterministic
 * tie-breaking and for laying out the circle. Changing it changes saved
 * links, so don't. (It is the same order the first version used, which is
 * why links made before the correction still decode.)
 */
export const PREFERENCES = ['active', 'reflective', 'theorist', 'pragmatist'] as const;

export type Preference = (typeof PREFERENCES)[number];

/** Compass bearing of each preference on the circle, in degrees. */
export const BEARING: Record<Preference, 0 | 90 | 180 | 270> = {
  active: 0,
  reflective: 90,
  theorist: 180,
  pragmatist: 270,
};

export const AXES = ['perceiving', 'processing'] as const;
export type Axis = (typeof AXES)[number];

/**
 * The two dialectics of the cycle. Each axis runs between two preferences
 * that face each other across the circle, and its score is the first
 * minus the second.
 *
 *   Perceiving (grasping):     Active (concrete)     − Theorist (abstract)
 *   Processing (transforming): Pragmatist (active)   − Reflective (reflective)
 */
export const AXIS_POLES: Record<Axis, { positive: Preference; negative: Preference }> = {
  perceiving: { positive: 'active', negative: 'theorist' },
  processing: { positive: 'pragmatist', negative: 'reflective' },
};

/** The next preference clockwise round the cycle. */
export function nextInCycle(preference: Preference): Preference {
  return PREFERENCES[(PREFERENCES.indexOf(preference) + 1) % PREFERENCES.length]!;
}

/** True when two preferences are neighbours on the circle. */
export function areAdjacent(a: Preference, b: Preference): boolean {
  return nextInCycle(a) === b || nextInCycle(b) === a;
}

/** One set's answer: the rank 1–4 given to each preference's statement. */
export type Ranking = Record<Preference, number>;

/** One ranking per set, in the order the sets appear in the locale file. */
export type Responses = Ranking[];

export const RANKS = [1, 2, 3, 4] as const;
export type Rank = (typeof RANKS)[number];

export function isPreference(value: unknown): value is Preference {
  return typeof value === 'string' && (PREFERENCES as readonly string[]).includes(value);
}

/** A ranking part-way through being given. */
export type PartialRanking = Partial<Record<Preference, number>>;

export function isComplete(ranking: PartialRanking): ranking is Ranking {
  const used = PREFERENCES.map((preference) => ranking[preference]);
  return used.every((rank) => rank !== undefined) && new Set(used).size === PREFERENCES.length;
}
