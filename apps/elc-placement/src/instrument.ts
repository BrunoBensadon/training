/**
 * The instrument, read out of the locale files.
 *
 * Items are data. Nothing in this file knows what any statement says, how
 * many sets there are, or what the preferences are called in a given
 * language — revising an item, or adding a set, is an edit to
 * locales/<locale>/items.json and nothing else.
 */
import type { Translator } from '@training/i18n';
import { AXES, PREFERENCES, type Axis, type Preference } from './model.ts';

export interface StatementSet {
  id: string;
  prompt: string;
  statements: Record<Preference, string>;
}

export interface PreferenceInfo {
  name: string;
  /** Kolb's name for this stage of the cycle, e.g. "Concrete experience". */
  stage: string;
  /** One word for the step, drawn on the circle, e.g. "experiencing". */
  step: string;
  /** Completes "Today you leaned towards {name} — …". */
  short: string;
  description: string;
}

/** One of the cycle's two dialectics. Its poles are the two preferences
 *  facing each other across the circle (see AXIS_POLES in model.ts). */
export interface AxisInfo {
  name: string;
  /** How the positive pole's preference takes things in, e.g. "through the experience itself". */
  positiveDescription: string;
  negativeDescription: string;
}

export interface Instrument {
  version: string;
  instruction: string;
  sets: StatementSet[];
  preferences: Record<Preference, PreferenceInfo>;
  axes: Record<Axis, AxisInfo>;
}

export function instrumentFrom(t: Translator): Instrument {
  const sets = t.raw<StatementSet[]>('items.sets') ?? [];
  const preferences = t.raw<Record<Preference, PreferenceInfo>>('items.preferences');
  const axes = t.raw<Record<Axis, AxisInfo>>('items.axes');

  // A locale file that reached production without these is a bug in the
  // build, not something to paper over at runtime.
  for (const preference of PREFERENCES) {
    if (!preferences?.[preference]) throw new Error(`items.preferences.${preference} is missing`);
  }
  for (const axis of AXES) {
    if (!axes?.[axis]) throw new Error(`items.axes.${axis} is missing`);
  }

  return {
    version: t.t('items.version'),
    instruction: t.t('items.instruction'),
    sets,
    preferences,
    axes,
  };
}

/**
 * Display order for one set's statements.
 *
 * Shuffled per respondent so that position carries no weight: with a fixed
 * order the first statement is read most carefully and the last is read
 * least. The shuffle is display-only — scoring reads the rank given to
 * each preference, so it does not care what order they appeared in, and a
 * saved link is unaffected.
 */
export function shuffledPreferences(random: () => number = Math.random): Preference[] {
  const order = [...PREFERENCES];
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}
