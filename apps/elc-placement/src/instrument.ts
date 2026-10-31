/**
 * The instrument, read out of the locale files.
 *
 * Items are data. Nothing in this file knows what any statement says, how
 * many sets there are, or what the preferences are called in a given
 * language — revising an item, or adding a set, is an edit to
 * locales/<locale>/items.json and nothing else.
 */
import type { Translator } from '@training/i18n';
import { PREFERENCES, type Preference } from './model.ts';

export interface StatementSet {
  id: string;
  prompt: string;
  statements: Record<Preference, string>;
}

export interface PreferenceInfo {
  name: string;
  /** The stage of the cycle in plain words, drawn on the circle, e.g. "experiencing". */
  step: string;
  /** Where its point is on the floor circle, e.g. "at the top of the circle". */
  where: string;
  /** One gain and one blind spot of similar weight, so none reads as the good answer. */
  description: string;
}

export interface Instrument {
  version: string;
  instruction: string;
  sets: StatementSet[];
  preferences: Record<Preference, PreferenceInfo>;
}

export function instrumentFrom(t: Translator): Instrument {
  const sets = t.raw<StatementSet[]>('items.sets') ?? [];
  const preferences = t.raw<Record<Preference, PreferenceInfo>>('items.preferences');

  // A locale file that reached production without these is a bug in the
  // build, not something to paper over at runtime.
  for (const preference of PREFERENCES) {
    if (!preferences?.[preference]) throw new Error(`items.preferences.${preference} is missing`);
  }

  return {
    version: t.t('items.version'),
    instruction: t.t('items.instruction'),
    sets,
    preferences,
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
