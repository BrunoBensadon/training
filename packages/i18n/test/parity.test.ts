import { describe, expect, it } from 'vitest';
import {
  assertLocaleParity,
  buildBundles,
  compareLocales,
  flatten,
  placeholders,
} from '@training/i18n';

const reference = {
  ui: { start: 'Start', progress: 'Set {n} of {total}' },
  items: { sets: [{ statements: [{ text: 'a' }, { text: 'b' }] }] },
};

describe('flatten', () => {
  it('indexes arrays so a missing list entry is a missing key', () => {
    expect(flatten(reference)).toEqual({
      'ui.start': 'Start',
      'ui.progress': 'Set {n} of {total}',
      'items.sets.0.statements.0.text': 'a',
      'items.sets.0.statements.1.text': 'b',
    });
  });
});

describe('placeholders', () => {
  it('collects and sorts them', () => {
    expect(placeholders('Set {n} of {total}, {n} again')).toEqual(['n', 'total']);
  });
  it('is empty for non-strings', () => {
    expect(placeholders(42)).toEqual([]);
  });
});

describe('compareLocales', () => {
  it('passes when the locales agree', () => {
    const problems = compareLocales({ en: reference, 'pt-BR': structuredClone(reference) }, 'en');
    expect(problems).toEqual([]);
  });

  it('reports a statement that was never translated', () => {
    const incomplete = structuredClone(reference);
    incomplete.items.sets[0]!.statements.pop();
    const problems = compareLocales({ en: reference, 'pt-BR': incomplete }, 'en');
    expect(problems).toEqual([
      {
        locale: 'pt-BR',
        kind: 'missing-key',
        key: 'items.sets.0.statements.1.text',
        detail: 'present in "en", absent here',
      },
    ]);
  });

  it('reports a key nothing will ever show', () => {
    const extra = structuredClone(reference) as Record<string, Record<string, unknown>>;
    extra.ui!.leftover = 'Antigo';
    const problems = compareLocales({ en: reference, 'pt-BR': extra }, 'en');
    expect(problems).toMatchObject([{ kind: 'extra-key', key: 'ui.leftover' }]);
  });

  it('reports a half-finished translation that looks finished', () => {
    const blank = structuredClone(reference);
    blank.ui.start = '   ';
    const problems = compareLocales({ en: reference, 'pt-BR': blank }, 'en');
    expect(problems).toMatchObject([{ kind: 'empty-value', key: 'ui.start' }]);
  });

  it('reports a translation that dropped a placeholder', () => {
    const dropped = structuredClone(reference);
    dropped.ui.progress = 'Conjunto {n}';
    const problems = compareLocales({ en: reference, 'pt-BR': dropped }, 'en');
    expect(problems).toMatchObject([
      { kind: 'placeholder-mismatch', key: 'ui.progress', detail: expect.stringContaining('{total}') },
    ]);
  });

  it('reports a string where the app expects structure', () => {
    const wrongShape = { ui: { start: 'Iniciar', progress: 'Set {n} of {total}' }, items: 'oops' };
    const problems = compareLocales({ en: reference, 'pt-BR': wrongShape }, 'en');
    expect(problems.some((problem) => problem.kind === 'missing-key')).toBe(true);
  });

  it('flags an empty string in the reference locale itself', () => {
    const problems = compareLocales({ en: { ui: { start: '' } } }, 'en');
    expect(problems).toMatchObject([{ locale: 'en', kind: 'empty-value', key: 'ui.start' }]);
  });

  it('refuses to compare against a reference it does not have', () => {
    expect(() => compareLocales({ 'pt-BR': reference }, 'en')).toThrow(/reference locale "en"/);
  });
});

describe('assertLocaleParity', () => {
  it('names the locale, the kind and the key', () => {
    const incomplete = structuredClone(reference);
    incomplete.ui.start = '';
    expect(() => assertLocaleParity({ en: reference, 'pt-BR': incomplete }, 'en')).toThrow(
      /pt-BR[\s\S]*empty-value[\s\S]*ui\.start/,
    );
  });
});

describe('buildBundles', () => {
  it('maps locales/<locale>/<namespace>.json onto bundle namespaces', () => {
    expect(
      buildBundles({
        '../locales/en/ui.json': { start: 'Start' },
        '../locales/en/items.json': { sets: [] },
        '../locales/pt-BR/ui.json': { start: 'Iniciar' },
        '../locales/pt-BR/items.json': { sets: [] },
        '../locales/pt-BR/notes.txt': { ignored: true },
      }),
    ).toEqual({
      en: { ui: { start: 'Start' }, items: { sets: [] } },
      'pt-BR': { ui: { start: 'Iniciar' }, items: { sets: [] } },
    });
  });
});
