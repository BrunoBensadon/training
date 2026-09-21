import { flatten } from './parity.js';

export type MessageValue =
  | string
  | number
  | boolean
  | null
  | MessageValue[]
  | { [key: string]: MessageValue };

export type Messages = { [key: string]: MessageValue };

export type Vars = Record<string, string | number>;

export interface Translator {
  readonly locale: string;
  /** A string, with `{placeholders}` filled in. */
  t(key: string, vars?: Vars): string;
  /** Structured data — the assessment items, for instance. */
  raw<T>(key: string): T;
  has(key: string): boolean;
}

export interface TranslatorOptions {
  /** Used when the active locale is missing a key. */
  fallback?: Messages;
  /** Called for every missing key. The build-time parity check should mean
   *  this never fires; it exists so that when it does, it is loud. */
  onMissing?: (key: string, locale: string) => void;
}

function lookup(messages: Messages, key: string): unknown {
  let current: unknown = messages;
  for (const part of key.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  );
}

export function createTranslator(
  locale: string,
  messages: Messages,
  options: TranslatorOptions = {},
): Translator {
  const flat = flatten(messages);

  const missing = (key: string): void => {
    options.onMissing?.(key, locale);
  };

  return {
    locale,

    t(key, vars) {
      const value = flat[key];
      if (typeof value === 'string') return interpolate(value, vars);
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);

      if (options.fallback) {
        const fallbackValue = lookup(options.fallback, key);
        if (typeof fallbackValue === 'string') {
          missing(key);
          return interpolate(fallbackValue, vars);
        }
      }
      missing(key);
      // Showing the key is ugly, which is the point: it is visible in
      // review rather than being an invisible blank on a phone.
      return key;
    },

    raw<T>(key: string): T {
      const value = lookup(messages, key);
      if (value === undefined) {
        const fallbackValue = options.fallback ? lookup(options.fallback, key) : undefined;
        missing(key);
        return fallbackValue as T;
      }
      return value as T;
    },

    has(key) {
      return key in flat || lookup(messages, key) !== undefined;
    },
  };
}
