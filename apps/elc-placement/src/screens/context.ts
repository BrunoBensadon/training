import { el, richText } from '@training/ui';
import type { Translator, Vars } from '@training/i18n';
import type { Instrument } from '../instrument.ts';
import type { PartialRanking, Quadrant } from '../model.ts';

/** Answers for this sitting. Held in memory only — see DECISIONS.md. */
export interface SessionState {
  responses: PartialRanking[];
  /** Display order per set, fixed once per sitting so answers do not jump
   *  around when you press Back. */
  displayOrder: Quadrant[][];
}

export interface ScreenContext {
  t: Translator;
  instrument: Instrument;
  locale: string;
  state: SessionState;
  announce(message: string): void;
  navigate(hash: string, options?: { replace?: boolean }): void;
  /** Builds an in-app link that keeps the current language. */
  href(path: string, params?: Record<string, string | number | undefined>): string;
}

/** A paragraph carrying the small inline syntax locale strings may use. */
export function richParagraph(source: string, className?: string): HTMLParagraphElement {
  const node = el('p', className ? { class: className } : {});
  node.append(richText(source));
  return node;
}

export function richListItem(source: string): HTMLLIElement {
  const node = el('li');
  node.append(richText(source));
  return node;
}

export function section(...children: (Node | string | false | null | undefined)[]): HTMLElement {
  return el('section', { class: 'section' }, ...children);
}

/** `t` bound to a namespace, to keep the screens readable. */
export function scoped(t: Translator, prefix: string) {
  return (key: string, vars?: Vars): string => t.t(`${prefix}.${key}`, vars);
}
