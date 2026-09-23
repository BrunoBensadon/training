import { describe, expect, it } from 'vitest';
import { matchLocale, readLegacyLang, resolveLocale, writeLegacyLang } from '@training/i18n';

const supported = ['en', 'pt-BR'];
const base = { supported, defaultLocale: 'en' };

describe('matchLocale', () => {
  it('matches exactly, ignoring case', () => {
    expect(matchLocale('PT-br', supported)).toBe('pt-BR');
  });
  it('matches a bare language onto the regional locale we ship', () => {
    expect(matchLocale('pt', supported)).toBe('pt-BR');
    expect(matchLocale('pt-PT', supported)).toBe('pt-BR');
  });
  it('returns null for something we do not have', () => {
    expect(matchLocale('fr', supported)).toBeNull();
    expect(matchLocale('', supported)).toBeNull();
    expect(matchLocale(null, supported)).toBeNull();
  });
});

describe('resolveLocale', () => {
  it('prefers the URL, so a shared link keeps its language', () => {
    const resolved = resolveLocale({
      ...base,
      url: 'https://example.org/elc-placement/?lang=pt',
      storageValue: 'en',
      navigatorLanguages: ['en-GB'],
    });
    expect(resolved).toEqual({ locale: 'pt-BR', source: 'url' });
  });

  it('reads lang out of the fragment, which is where results live', () => {
    const resolved = resolveLocale({
      ...base,
      url: 'https://example.org/elc-placement/#/result?r=v1abcdef&lang=pt-BR',
      storageValue: 'en',
    });
    expect(resolved).toEqual({ locale: 'pt-BR', source: 'url' });
  });

  it('lets the fragment win over the query string', () => {
    const resolved = resolveLocale({ ...base, url: '/?lang=en#/about?lang=pt' });
    expect(resolved).toEqual({ locale: 'pt-BR', source: 'url' });
  });

  it('honours an existing bb-lang from the main site', () => {
    const resolved = resolveLocale({ ...base, storageValue: 'pt', navigatorLanguages: ['en-GB'] });
    expect(resolved).toEqual({ locale: 'pt-BR', source: 'storage' });
  });

  it('falls back to the browser, in order of preference', () => {
    const resolved = resolveLocale({ ...base, navigatorLanguages: ['fr-FR', 'pt-BR', 'en'] });
    expect(resolved).toEqual({ locale: 'pt-BR', source: 'navigator' });
  });

  it('falls back to the default when nothing matches', () => {
    const resolved = resolveLocale({ ...base, navigatorLanguages: ['fr-FR'] });
    expect(resolved).toEqual({ locale: 'en', source: 'default' });
  });

  it('ignores an unparseable URL instead of failing to render', () => {
    const resolved = resolveLocale({ ...base, url: '%%%not a url', storageValue: 'pt' });
    expect(resolved.locale).toBe('pt-BR');
  });
});

describe('bb-lang interoperability', () => {
  function fakeStorage(initial: Record<string, string> = {}) {
    const map = new Map(Object.entries(initial));
    return {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => void map.set(key, value),
      read: (key: string) => map.get(key) ?? null,
    } as unknown as Storage & { read(key: string): string | null };
  }

  it('reads the main site key', () => {
    expect(readLegacyLang(fakeStorage({ 'bb-lang': 'pt' }))).toBe('pt');
  });

  it('writes back in the main site format, not the full tag', () => {
    const storage = fakeStorage();
    writeLegacyLang('pt-BR', storage);
    expect(storage.getItem('bb-lang')).toBe('pt');
  });

  it('survives storage being unavailable', () => {
    const hostile = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(readLegacyLang(hostile)).toBeNull();
    expect(() => writeLegacyLang('pt-BR', hostile)).not.toThrow();
  });
});
