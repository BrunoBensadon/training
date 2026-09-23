import { describe, expect, it, vi } from 'vitest';
import { createTranslator, interpolate } from '@training/i18n';

const messages = {
  ui: { start: 'Start', progress: 'Set {n} of {total}' },
  items: { sets: [{ id: 'a', statements: ['one', 'two'] }] },
};

describe('interpolate', () => {
  it('fills placeholders', () => {
    expect(interpolate('Set {n} of {total}', { n: 2, total: 6 })).toBe('Set 2 of 6');
  });
  it('leaves an unknown placeholder alone rather than printing undefined', () => {
    expect(interpolate('Set {n} of {total}', { n: 2 })).toBe('Set 2 of {total}');
  });
});

describe('createTranslator', () => {
  const t = createTranslator('en', messages);

  it('looks up a nested string', () => {
    expect(t.t('ui.start')).toBe('Start');
    expect(t.t('ui.progress', { n: 1, total: 6 })).toBe('Set 1 of 6');
  });

  it('returns structured data through raw()', () => {
    expect(t.raw<{ id: string }[]>('items.sets')).toEqual([{ id: 'a', statements: ['one', 'two'] }]);
  });

  it('reports what it has', () => {
    expect(t.has('ui.start')).toBe(true);
    expect(t.has('ui.nope')).toBe(false);
  });

  it('falls back to another locale and says so', () => {
    const onMissing = vi.fn();
    const partial = createTranslator('pt-BR', { ui: { start: 'Iniciar' } }, {
      fallback: messages,
      onMissing,
    });
    expect(partial.t('ui.start')).toBe('Iniciar');
    expect(partial.t('ui.progress', { n: 1, total: 6 })).toBe('Set 1 of 6');
    expect(onMissing).toHaveBeenCalledWith('ui.progress', 'pt-BR');
  });

  it('shows the key when a string is missing everywhere, rather than a blank', () => {
    const onMissing = vi.fn();
    const partial = createTranslator('pt-BR', {}, { onMissing });
    expect(partial.t('ui.start')).toBe('ui.start');
    expect(onMissing).toHaveBeenCalledWith('ui.start', 'pt-BR');
  });
});
