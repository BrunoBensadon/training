/**
 * Locale loading.
 *
 * Every locale file is bundled at build time rather than fetched at
 * runtime. That is a privacy requirement, not a performance one: fetching
 * a locale would be a network request, and this app makes none. Two
 * locales of JSON cost a few kilobytes.
 *
 * Adding a locale is adding `locales/<code>/{ui,items,facilitator}.json`.
 * Nothing in this file needs to change — the display label and name come
 * out of the locale file itself, and the build fails if the new locale's
 * keys do not match English.
 */
import {
  buildBundles,
  createTranslator,
  readLegacyLang,
  resolveLocale,
  type Messages,
  type Translator,
} from '@training/i18n';
import type { LangOption } from '@training/ui';

const files = import.meta.glob('../locales/*/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Messages>;

/**
 * Locale files are split by namespace — ui.json, items.json,
 * facilitator.json — so that the assessment items can be reviewed and
 * revised as a unit. At runtime the interface namespace is the common
 * case, so it is lifted to the top: `t('intro.title')` rather than
 * `t('ui.intro.title')`, while items and facilitator copy keep their
 * prefixes. The parity check still runs against the files as written.
 */
function liftUiNamespace(bundle: Messages): Messages {
  const { ui, ...rest } = bundle;
  const uiMessages = (ui ?? {}) as Messages;
  for (const namespace of Object.keys(rest)) {
    if (namespace in uiMessages) {
      throw new Error(
        `locale namespace "${namespace}" collides with a top-level key in ui.json`,
      );
    }
  }
  return { ...uiMessages, ...rest };
}

export const bundles: Record<string, Messages> = Object.fromEntries(
  Object.entries(buildBundles(files)).map(([locale, bundle]) => [locale, liftUiNamespace(bundle)]),
);

export const DEFAULT_LOCALE = 'en';

/** Default locale first, then the rest alphabetically — stable without a
 *  code change when a locale is added. */
export const SUPPORTED_LOCALES: string[] = Object.keys(bundles).sort((a, b) => {
  if (a === DEFAULT_LOCALE) return -1;
  if (b === DEFAULT_LOCALE) return 1;
  return a.localeCompare(b);
});

export function translatorFor(locale: string): Translator {
  const messages = bundles[locale] ?? bundles[DEFAULT_LOCALE];
  /* c8 ignore next */
  if (!messages) throw new Error(`no locale bundle available for "${locale}"`);
  return createTranslator(locale, messages, {
    fallback: bundles[DEFAULT_LOCALE],
    onMissing: (key, from) => {
      // The build-time parity check should make this unreachable. If it
      // ever fires, it means a locale file reached production broken.
      console.warn(`[i18n] missing key "${key}" in ${from}`);
    },
  });
}

export function detectLocale(url: string): string {
  return resolveLocale({
    supported: SUPPORTED_LOCALES,
    defaultLocale: DEFAULT_LOCALE,
    url,
    storageValue: readLegacyLang(),
    navigatorLanguages: typeof navigator === 'undefined' ? [] : navigator.languages,
  }).locale;
}

/** The language toggle's options, built from the locale files. */
export function languageOptions(): LangOption[] {
  return SUPPORTED_LOCALES.map((code) => {
    const meta = bundles[code]?.meta as Messages | undefined;
    return {
      code,
      label: String(meta?.langLabel ?? code.toUpperCase()),
      name: String(meta?.langName ?? code),
    };
  });
}
