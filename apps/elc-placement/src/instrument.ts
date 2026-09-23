/**
 * The instrument, read out of the locale files.
 *
 * Items are data. Nothing in this file knows what any statement says, how
 * many sets there are, or what the quadrants are called in a given
 * language — revising an item, or adding a seventh set, is an edit to
 * locales/<locale>/items.json and nothing else.
 */
import type { Translator } from '@training/i18n';
import { AXES, QUADRANTS, type Axis, type Quadrant } from './model.ts';

export interface StatementSet {
  id: string;
  prompt: string;
  statements: Record<Quadrant, string>;
}

export interface QuadrantInfo {
  name: string;
  short: string;
  description: string;
}

export interface AxisInfo {
  name: string;
  question: string;
  positive: string;
  negative: string;
  positiveDescription: string;
  negativeDescription: string;
}

export interface Instrument {
  version: string;
  instruction: string;
  sets: StatementSet[];
  quadrants: Record<Quadrant, QuadrantInfo>;
  axes: Record<Axis, AxisInfo>;
}

export function instrumentFrom(t: Translator): Instrument {
  const sets = t.raw<StatementSet[]>('items.sets') ?? [];
  const quadrants = t.raw<Record<Quadrant, QuadrantInfo>>('items.quadrants');
  const axes = t.raw<Record<Axis, AxisInfo>>('items.axes');

  // A locale file that reached production without these is a bug in the
  // build, not something to paper over at runtime.
  for (const quadrant of QUADRANTS) {
    if (!quadrants?.[quadrant]) throw new Error(`items.quadrants.${quadrant} is missing`);
  }
  for (const axis of AXES) {
    if (!axes?.[axis]) throw new Error(`items.axes.${axis} is missing`);
  }

  return {
    version: t.t('items.version'),
    instruction: t.t('items.instruction'),
    sets,
    quadrants,
    axes,
  };
}

/**
 * Display order for one set's statements.
 *
 * Shuffled per respondent so that position carries no weight: with a fixed
 * order the first statement is read most carefully and the last is read
 * least. The shuffle is display-only — scoring reads the rank given to
 * each quadrant, so it does not care what order they appeared in, and a
 * saved link is unaffected.
 */
export function shuffledQuadrants(random: () => number = Math.random): Quadrant[] {
  const order = [...QUADRANTS];
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}
