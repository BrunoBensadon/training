import { el } from '@training/ui';
import { ROUTES } from '../router.ts';
import { richListItem, richParagraph, scoped, section, type ScreenContext } from './context.ts';

export function introScreen(context: ScreenContext): HTMLElement {
  const s = scoped(context.t, 'intro');
  const aboutHref = context.href(ROUTES.about);

  const privacy = context.t.raw<string[]>('intro.privacy') ?? [];
  const what = context.t.raw<string[]>('intro.what') ?? [];

  return el(
    'div',
    {},
    section(
      el('p', { class: 'kicker', text: s('kicker') }),
      el('h1', { text: s('title') }),
      el('p', { class: 'lead', text: s('lead') }),
      el('p', { class: 'time-note', text: s('timeNote') }),
      el(
        'div',
        { class: 'btn-row' },
        el('a', {
          class: 'btn accent',
          text: s('start'),
          attrs: { href: context.href(ROUTES.set(1)) },
        }),
        el('a', {
          class: 'btn quiet',
          text: s('aboutLink'),
          attrs: { href: aboutHref },
        }),
      ),
    ),

    // The privacy statement is the first screen's job, so it is a panel
    // rather than a footnote.
    section(
      el(
        'div',
        { class: 'panel' },
        el('h2', { text: s('privacyTitle') }),
        el('ul', { class: 'plain' }, ...privacy.map((line) => richListItem(line))),
      ),
    ),

    section(
      el('h2', { text: s('whatTitle') }),
      el(
        'div',
        { class: 'prose' },
        ...what.map((line) =>
          richParagraph(line.replace('{aboutHref}', aboutHref)),
        ),
      ),
    ),
  );
}
