/**
 * Which language to show.
 *
 * Order: the URL, then an existing `bb-lang` value, then the browser, then
 * the default.
 *
 * The URL comes first so that a shared link keeps its language — a trainer
 * sending the Portuguese link to a delegation should not have it flip to
 * English because of what is in that phone's localStorage.
 *
 * `bb-lang` is the key brunobensadon.github.io uses. Honouring it means
 * someone who arrives from the main site in Portuguese stays in
 * Portuguese. It stores a bare language ("pt"), so it is matched loosely.
 */

export type LocaleSource = 'url' | 'storage' | 'navigator' | 'default';

export interface ResolveOptions {
  supported: readonly string[];
  defaultLocale: string;
  /** Current location. Both `?lang=` and a `lang=` param in the fragment
   *  are read; the fragment wins, because that is where this app keeps its
   *  own state. */
  url?: string;
  storageValue?: string | null;
  navigatorLanguages?: readonly string[];
}

export interface ResolvedLocale {
  locale: string;
  source: LocaleSource;
}

/** The main site's storage key. */
export const LEGACY_LANG_KEY = 'bb-lang';

/**
 * Matches a requested tag against what we have: exact first, then by
 * primary subtag, so "pt", "pt-br" and "pt-PT" all land on "pt-BR" when
 * that is the only Portuguese we ship.
 */
export function matchLocale(
  requested: string | null | undefined,
  supported: readonly string[],
): string | null {
  if (!requested) return null;
  const wanted = requested.trim().toLowerCase();
  if (!wanted) return null;

  const exact = supported.find((code) => code.toLowerCase() === wanted);
  if (exact) return exact;

  const primary = wanted.split('-')[0];
  const byPrimary = supported.find((code) => code.toLowerCase().split('-')[0] === primary);
  return byPrimary ?? null;
}

function langFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url, 'https://placeholder.invalid');
  } catch {
    return null;
  }

  const fragment = parsed.hash.replace(/^#/, '');
  const queryStart = fragment.indexOf('?');
  if (queryStart !== -1) {
    const inFragment = new URLSearchParams(fragment.slice(queryStart + 1)).get('lang');
    if (inFragment) return inFragment;
  }

  return parsed.searchParams.get('lang');
}

export function resolveLocale(options: ResolveOptions): ResolvedLocale {
  const { supported, defaultLocale } = options;

  const fromUrl = matchLocale(langFromUrl(options.url), supported);
  if (fromUrl) return { locale: fromUrl, source: 'url' };

  const fromStorage = matchLocale(options.storageValue, supported);
  if (fromStorage) return { locale: fromStorage, source: 'storage' };

  for (const candidate of options.navigatorLanguages ?? []) {
    const matched = matchLocale(candidate, supported);
    if (matched) return { locale: matched, source: 'navigator' };
  }

  return { locale: defaultLocale, source: 'default' };
}

/**
 * Reads `bb-lang` without letting a blocked or full localStorage take the
 * page down with it. Storage can throw on access alone in some privacy
 * modes, so every call is guarded.
 */
export function readLegacyLang(storage?: Storage | null): string | null {
  try {
    return (storage ?? globalThis.localStorage)?.getItem(LEGACY_LANG_KEY) ?? null;
  } catch {
    return null;
  }
}

/**
 * Writes the language back in the main site's format (a bare "en" / "pt"),
 * so the choice travels between the tools and the site.
 *
 * This is the only thing these tools persist, and it is written only when
 * someone presses the toggle. No answer and no result is ever stored.
 */
export function writeLegacyLang(locale: string, storage?: Storage | null): void {
  try {
    (storage ?? globalThis.localStorage)?.setItem(LEGACY_LANG_KEY, locale.split('-')[0]!);
  } catch {
    // A shared training-room device with storage disabled is a normal
    // case, not an error worth showing anyone.
  }
}
