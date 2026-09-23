/**
 * The printable one-page card.
 *
 * Its own route with its own print rules: on paper this is a single sheet
 * a trainer holds while running the floor exercise, so the navigation, the
 * buttons and the language toggle all come off.
 */
import { el } from '@training/ui';
import { QUADRANTS } from '../model.ts';
import { ROUTES } from '../router.ts';
import { richListItem, scoped, type ScreenContext } from './context.ts';

export function facilitatorScreen(context: ScreenContext): HTMLElement {
  const s = scoped(context.t, 'facilitator');
  const { instrument } = context;

  const quadrantList = el('dl', { class: 'quadrant-list' });
  for (const quadrant of QUADRANTS) {
    const info = instrument.quadrants[quadrant];
    quadrantList.append(
      el('dt', {}, el('span', { class: 'q-name', text: info.name }), el('span', { class: 'q-short', text: info.short })),
      el('dd', { text: info.description }),
    );
  }

  const list = (key: string, className?: string): HTMLElement =>
    el(
      'ul',
      className ? { class: className } : {},
      ...(context.t.raw<string[]>(`facilitator.${key}`) ?? []).map(richListItem),
    );

  return el(
    'article',
    { class: 'card' },
    el(
      'header',
      { class: 'card-head' },
      el('p', { class: 'kicker', text: s('kicker') }),
      el('h1', { text: s('title') }),
      el('p', { class: 'lead', text: s('lead') }),
      el(
        'div',
        { class: 'btn-row no-print' },
        el('button', {
          class: 'btn',
          text: s('printHint'),
          attrs: { type: 'button' },
          on: { click: () => window.print() },
        }),
        el('a', {
          class: 'btn quiet',
          text: context.t.t('about.backToStart'),
          attrs: { href: context.href(ROUTES.intro) },
        }),
      ),
    ),

    el(
      'section',
      { class: 'card-block' },
      el('h2', { text: s('quadrantsTitle') }),
      el('p', { class: 'prose-note', text: s('quadrantsLead') }),
      quadrantList,
    ),

    el(
      'section',
      { class: 'card-block' },
      el('h2', { text: s('promptsTitle') }),
      el('p', { class: 'prose-note', text: s('promptsLead') }),
      el(
        'ol',
        { class: 'prompts' },
        ...(context.t.raw<string[]>('facilitator.prompts') ?? []).map(richListItem),
      ),
    ),

    el(
      'section',
      { class: 'card-block' },
      el('h2', { text: s('lopsidedTitle') }),
      el('p', { class: 'prose-note', text: s('lopsidedLead') }),
      list('lopsided', 'guidance'),
    ),

    el(
      'section',
      { class: 'card-block card-split' },
      el(
        'div',
        {},
        el('h2', { text: s('runningTitle') }),
        list('running', 'timing'),
      ),
      el(
        'div',
        {},
        el('h2', { text: s('sayThisTitle') }),
        el('p', { class: 'note', text: s('sayThis') }),
        el('h2', { text: s('cautionTitle') }),
        el('p', { class: 'prose-note', text: s('caution') }),
      ),
    ),
  );
}
