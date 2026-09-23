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
import { QUADRANTS } from '../src/model.ts';

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
  quadrants: Record<string, { name: string; short: string; description: string }>;
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
  it.each(locales)('%s has six sets of four statements', (locale) => {
    const file = items[locale]!;
    expect(file.sets).toHaveLength(6);
    for (const set of file.sets) {
      expect(Object.keys(set.statements).sort()).toEqual([...QUADRANTS].sort());
      for (const quadrant of QUADRANTS) {
        expect(set.statements[quadrant]!.trim().length).toBeGreaterThan(20);
      }
    }
  });

  it.each(locales)('%s names all four quadrants and both axes', (locale) => {
    const file = items[locale]!;
    expect(Object.keys(file.quadrants).sort()).toEqual([...QUADRANTS].sort());
    for (const quadrant of QUADRANTS) {
      expect(file.quadrants[quadrant]!.name).toBeTruthy();
      expect(file.quadrants[quadrant]!.description.length).toBeGreaterThan(40);
    }
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
        for (const quadrant of QUADRANTS) {
          expect(placeholders(set.statements[quadrant]), `${locale} ${set.id}`).toEqual([]);
        }
      }
    }
  });

  it('gives every statement its own wording within a set', () => {
    for (const locale of locales) {
      for (const set of items[locale]!.sets) {
        const texts = QUADRANTS.map((quadrant) => set.statements[quadrant]);
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
