import { el } from '@training/ui';
import { ROUTES } from '../router.ts';
import { totalPoints } from '../scoring.ts';
import { richListItem, richParagraph, scoped, section, type ScreenContext } from './context.ts';

export function aboutScreen(context: ScreenContext): HTMLElement {
  const s = scoped(context.t, 'about');
  const total = totalPoints(context.instrument.sets.length);

  const block = (titleKey: string, ...body: Node[]): HTMLElement =>
    section(el('h2', { text: s(titleKey) }), el('div', { class: 'prose' }, ...body));

  return el(
    'div',
    {},
    section(
      el('p', { class: 'kicker', text: s('kicker') }),
      el('h1', { text: s('title') }),
    ),
    block('whoTitle', richParagraph(s('who'))),
    block('whatTitle', richParagraph(s('what', { total }))),
    block('notValidatedTitle', richParagraph(s('notValidated'))),
    block(
      'whatWouldItTakeTitle',
      el(
        'ul',
        {},
        ...(context.t.raw<string[]>('about.whatWouldItTake') ?? []).map(richListItem),
      ),
    ),
    block(
      'evidenceTitle',
      richParagraph(s('evidence')),
      el(
        'ul',
        { class: 'citations' },
        ...(context.t.raw<string[]>('about.citations') ?? []).map(richListItem),
      ),
    ),
    block('soWhatTitle', richParagraph(s('soWhat'))),
    block('ipTitle', richParagraph(s('ip'))),
    block('privacyTitle', richParagraph(s('privacy'))),
    section(
      el('div', { class: 'btn-row' },
        el('a', {
          class: 'btn quiet',
          text: s('backToStart'),
          attrs: { href: context.href(ROUTES.intro) },
        }),
        el('a', {
          class: 'btn quiet',
          text: context.t.t('nav.facilitator'),
          attrs: { href: context.href(ROUTES.facilitator) },
        }),
      ),
    ),
  );
}
