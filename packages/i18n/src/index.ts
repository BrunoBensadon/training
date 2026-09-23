export { buildBundles, describeLocalePath } from './bundle.js';

export {
  flatten,
  placeholders,
  compareLocales,
  formatProblems,
  assertLocaleParity,
} from './parity.js';

export {
  createTranslator,
  interpolate,
  type Translator,
  type TranslatorOptions,
  type Messages,
  type MessageValue,
  type Vars,
} from './translator.ts';

export {
  resolveLocale,
  matchLocale,
  readLegacyLang,
  writeLegacyLang,
  LEGACY_LANG_KEY,
  type ResolveOptions,
  type ResolvedLocale,
  type LocaleSource,
} from './resolve.ts';
