/**
 * The locale files themselves, checked as data.
 *
 * The Vite plugin runs the same parity check at build time; this runs it
 * in CI without a build, and adds the checks that are specific to this
 * instrument rather than to locale files in general.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { assertLocaleParity, buildBundles, placeholders } from '@training/i18n';
import { PREFERENCES } from '../src/model.ts';

const localesDir = fileURLToPath(new URL('../locales', import.meta.url));

const locales = readdirSync(localesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const files: Record<string, Record<string, unknown>> = {};
for (const locale of locales) {
  for (const file of readdirSync(path.join(localesDir, locale))) {
    if (!file.endsWith('.json')) continue;
    files[`${locale}/${file}`] = JSON.parse(
      readFileSync(path.join(localesDir, locale, file), 'utf8'),
    );
  }
}
const bundles = buildBundles(files);

interface ItemsFile {
  version: string;
  instruction: string;
  sets: Array<{ id: string; prompt: string; statements: Record<string, string> }>;
  preferences: Record<string, { name: string; step: string; where: string; description: string }>;
}

const items = Object.fromEntries(
  locales.map((locale) => [locale, bundles[locale]!.items as unknown as ItemsFile]),
);

describe('locale files', () => {
  it('ships more than one locale, or there is nothing to check', () => {
    expect(locales).toContain('en');
    expect(locales.length).toBeGreaterThan(1);
  });

  it('agree key for key with English', () => {
    expect(() => assertLocaleParity(bundles, 'en')).not.toThrow();
  });
});

describe('the instrument', () => {
  it.each(locales)('%s has twelve sets of four statements', (locale) => {
    const file = items[locale]!;
    expect(file.sets).toHaveLength(12);
    for (const set of file.sets) {
      expect(Object.keys(set.statements).sort()).toEqual([...PREFERENCES].sort());
      for (const preference of PREFERENCES) {
        expect(set.statements[preference]!.trim().length).toBeGreaterThan(20);
      }
    }
  });

  it.each(locales)('%s names all four preferences, their step and where they stand', (locale) => {
    const file = items[locale]!;
    expect(Object.keys(file.preferences).sort()).toEqual([...PREFERENCES].sort());
    for (const preference of PREFERENCES) {
      const info = file.preferences[preference]!;
      expect(info.name).toBeTruthy();
      expect(info.where).toBeTruthy();
      // Drawn on the circle beside the ring: it has to fit.
      expect(info.step.length).toBeGreaterThan(0);
      expect(info.step.length).toBeLessThanOrEqual(16);
      expect(info.name.length).toBeLessThanOrEqual(12);
      expect(info.description.length).toBeGreaterThan(40);
    }
  });

  it('uses the corrected names, not the ones that put the preferences in quadrants', () => {
    const names = (locale: string): string[] =>
      PREFERENCES.map((preference) => items[locale]!.preferences[preference]!.name);
    expect(names('en')).toEqual(['Active', 'Reflective', 'Theorist', 'Pragmatist']);
    expect(names('pt-BR')).toEqual(['Ativo', 'Reflexivo', 'Teórico', 'Pragmático']);
  });

  it('uses the same set ids in every locale, so scoring lines up', () => {
    const reference = items.en!.sets.map((set) => set.id);
    for (const locale of locales) {
      expect(items[locale]!.sets.map((set) => set.id), locale).toEqual(reference);
    }
  });

  it('carries the same items version in every locale', () => {
    // Saved result links record this. A locale drifting to its own
    // version would make a link right in one language and stale in another.
    const versions = new Set(locales.map((locale) => items[locale]!.version));
    expect([...versions]).toHaveLength(1);
    expect(items.en!.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('keeps interpolation out of the statements', () => {
    // An item with a {placeholder} would be an item whose meaning depends
    // on code. Items are meant to be readable as written.
    for (const locale of locales) {
      for (const set of items[locale]!.sets) {
        for (const preference of PREFERENCES) {
          expect(placeholders(set.statements[preference]), `${locale} ${set.id}`).toEqual([]);
        }
      }
    }
  });

  it('keeps each statement within the length the content review set (9–16 words in English)', () => {
    // The guide's writing rules (§3B4): long statements read as more
    // considered, and get ranked higher for it.
    for (const set of items.en!.sets) {
      for (const preference of PREFERENCES) {
        const words = set.statements[preference]!.trim().split(/\s+/).length;
        expect(words, `${set.id} ${preference}`).toBeGreaterThanOrEqual(9);
        expect(words, `${set.id} ${preference}`).toBeLessThanOrEqual(16);
      }
    }
  });

  it('gives every statement its own wording within a set', () => {
    for (const locale of locales) {
      for (const set of items[locale]!.sets) {
        const texts = PREFERENCES.map((preference) => set.statements[preference]);
        expect(new Set(texts).size, `${locale} ${set.id}`).toBe(4);
      }
    }
  });
});

describe('the copy that is not optional', () => {
  it.each(locales)('%s carries the disclaimer on the result screen', (locale) => {
    const ui = bundles[locale]!.ui as Record<string, Record<string, string>>;
    const disclaimer = ui.result!.disclaimer!;
    expect(disclaimer.length).toBeGreaterThan(200);
  });

  it.each(locales)('%s says on the about page that it is not validated', (locale) => {
    const ui = bundles[locale]!.ui as Record<string, Record<string, unknown>>;
    const about = ui.about as Record<string, unknown>;
    expect(String(about.notValidated).length).toBeGreaterThan(100);
    expect((about.whatWouldItTake as string[]).length).toBeGreaterThanOrEqual(3);
    const citations = (about.citations as string[]).join(' ');
    expect(citations).toContain('Pashler');
    expect(citations).toContain('Coffield');
  });

  it.each(locales)('%s tells the trainee up front that nothing is transmitted', (locale) => {
    const ui = bundles[locale]!.ui as Record<string, Record<string, unknown>>;
    const privacy = (ui.intro as Record<string, unknown>).privacy as string[];
    expect(privacy.length).toBeGreaterThanOrEqual(3);
  });
});
