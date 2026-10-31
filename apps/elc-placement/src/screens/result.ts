/**
 * The result.
 *
 * Content and order follow docs/reviews/elc-placement-2-content-guide.md
 * §3E. The screen never names a single part of the cycle unless the
 * placement is a clear `point`; it says where to stand in the same words
 * the diagram uses; it gives the margin a quiz of this length can see; and
 * it shows the whole four-way shape, never a bare type label.
 *
 * The mandated disclaimer sits directly under the heading, before any
 * number, because a caveat at the bottom of a results page is a caveat
 * nobody reads.
 */
import { el } from '@training/ui';
import { ROUTES } from '../router.ts';
import { PREFERENCES, TENSIONS, TENSION_POLES, type Preference } from '../model.ts';
import { maxScore, midScore, minScore, type Placement, type Result } from '../scoring.ts';
import { circleFigure } from '../circle.ts';
import { richListItem, richParagraph, scoped, section, type ScreenContext } from './context.ts';

export interface ResultScreenOptions {
  result: Result;
  /** Set when the link was made against a different revision of the
   *  same edition of the items: still scoreable, but worded differently. */
  savedItemsVersion?: string;
  onRestart: () => void;
}

export function resultScreen(context: ScreenContext, options: ResultScreenOptions): HTMLElement {
  const s = scoped(context.t, 'result');
  const { result } = options;
  const { instrument } = context;
  const n = result.setCount;

  const screen = el('div', {});

  if (options.savedItemsVersion && options.savedItemsVersion !== instrument.version) {
    screen.append(
      section(
        el('p', {
          class: 'note stale',
          text: s('revisedVersion', {
            saved: options.savedItemsVersion,
            current: instrument.version,
          }),
        }),
      ),
    );
  }

  screen.append(
    section(
      el('p', { class: 'kicker', text: s('kicker') }),
      el('h1', { text: s('title') }),
      el('div', { class: 'panel disclaimer' }, el('p', { text: s('disclaimer') })),
      ...leanLines(context, result),
      richParagraph(standSentence(context, result.placement), 'stand-where'),
      ...lowestLine(context, result),
      el('p', { class: 'prose-note margin-note', text: s('margin', { tau: result.clearLead }) }),
    ),
  );

  screen.append(
    section(
      el('h2', { class: 'visually-hidden', text: s('circleTitle') }),
      circleFigure(
        {
          result,
          instrument,
          titleText: s('circleTitle'),
          descriptionText: s('circleDesc'),
          youLabel: s('youAreHere'),
          middleLabel: s('middle'),
        },
        textAlternative(context, result),
      ),
    ),
  );

  screen.append(
    section(
      el('h2', { text: s('shapeTitle') }),
      el('p', {
        class: 'prose-note',
        text: s('shapeLead', {
          min: minScore(n),
          max: maxScore(n),
          mid: midScore(n),
          total: result.total,
        }),
      }),
      shapeTable(context, result),
    ),
  );

  screen.append(section(tensionsBlock(context, result)));

  screen.append(saveSection(context, options));

  return screen;
}

/** The preferences a placement names, in the order it names them. */
export function placedPreferences(placement: Placement): Preference[] {
  switch (placement.kind) {
    case 'point':
      return [placement.preference];
    case 'between':
    case 'opposite':
      return [...placement.pair];
    case 'spread':
      return [];
  }
}

function leanLines(context: ScreenContext, result: Result): HTMLElement[] {
  const s = scoped(context.t, 'result');
  const { preferences } = context.instrument;
  const { placement } = result;
  const lines: HTMLElement[] = [];

  switch (placement.kind) {
    case 'point':
      lines.push(
        richParagraph(
          s('leanPoint', {
            n: result.setCount,
            name: preferences[placement.preference].name,
            lead: result.lead,
          }),
          'lead',
        ),
      );
      break;
    case 'between':
    case 'opposite': {
      const [first, second] = placement.pair;
      lines.push(
        richParagraph(
          s(placement.kind === 'between' ? 'leanBetween' : 'leanOpposite', {
            first: preferences[first].name,
            second: preferences[second].name,
          }),
          'lead',
        ),
      );
      break;
    }
    case 'spread':
      lines.push(richParagraph(s('leanSpread'), 'lead'));
      break;
  }

  for (const preference of placedPreferences(placement)) {
    const info = preferences[preference];
    lines.push(
      richParagraph(
        s('describe', { name: info.name, step: info.step, description: info.description }),
        'describe',
      ),
    );
  }

  return lines;
}

/** Where to stand, in the words the diagram and the facilitator card use. */
export function standSentence(context: ScreenContext, placement: Placement): string {
  const s = scoped(context.t, 'result');
  const { preferences } = context.instrument;
  switch (placement.kind) {
    case 'point': {
      const info = preferences[placement.preference];
      return s('standPoint', { name: info.name, where: info.where });
    }
    case 'between':
    case 'opposite': {
      const [first, second] = placement.pair;
      return s(placement.kind === 'between' ? 'standBetween' : 'standOpposite', {
        first: preferences[first].name,
        second: preferences[second].name,
      });
    }
    case 'spread':
      return s('standSpread');
  }
}

function lowestLine(context: ScreenContext, result: Result): HTMLElement[] {
  if (!result.lowest) return [];
  const s = scoped(context.t, 'result');
  return [
    richParagraph(
      s('lowest', {
        name: context.instrument.preferences[result.lowest.preference].name,
        gap: result.lowest.gap,
      }),
      'lowest',
    ),
  ];
}

function shapeTable(context: ScreenContext, result: Result): HTMLElement {
  const s = scoped(context.t, 'result');
  const { preferences } = context.instrument;
  const placed = placedPreferences(result.placement);

  const head = el(
    'tr',
    {},
    el('th', { text: s('colPreference'), attrs: { scope: 'col' } }),
    el('th', { text: s('colStage'), attrs: { scope: 'col' } }),
    el('th', { class: 'num', text: s('colScore'), attrs: { scope: 'col' } }),
  );

  const body = el('tbody');
  for (const preference of result.order) {
    body.append(
      el(
        'tr',
        { class: placed.includes(preference) ? 'is-lead' : '' },
        el('th', { text: preferences[preference].name, attrs: { scope: 'row' } }),
        el('td', { text: preferences[preference].step }),
        el('td', { class: 'num', text: String(result.scores[preference]) }),
      ),
    );
  }

  return el(
    'table',
    { class: 'data shape' },
    el('caption', { text: s('tableCaption') }),
    el('thead', {}, head),
    body,
  );
}

/** Kolb's two tensions, secondary: collapsed until asked for. */
function tensionsBlock(context: ScreenContext, result: Result): HTMLElement {
  const s = scoped(context.t, 'result');
  return el(
    'details',
    { class: 'tensions' },
    el('summary', { text: s('tensionsTitle') }),
    el('p', { class: 'prose-note', text: s('tensionsLead') }),
    el('ul', { class: 'plain tension-list' }, ...tensionLines(context, result).map(richListItem)),
  );
}

function tensionLines(context: ScreenContext, result: Result): string[] {
  const s = scoped(context.t, 'result');
  const { preferences } = context.instrument;
  // TENSIONS, not Object.keys: the reading order should not depend on
  // how anything happens to order its keys.
  return TENSIONS.map((tension) => {
    const { positive, negative } = TENSION_POLES[tension];
    const ends = { a: preferences[positive].name, b: preferences[negative].name };
    const reading = result.tensions[tension];
    if (reading.kind === 'even') return s('tensionEven', { ...ends, tau: result.clearLead });
    return s('tensionLean', { ...ends, name: preferences[reading.towards].name, d: reading.by });
  });
}

/** What the diagram says, in words, for anyone not using the diagram. */
function textAlternative(context: ScreenContext, result: Result): string {
  const s = scoped(context.t, 'result');
  const n = result.setCount;
  const scores = PREFERENCES.map(
    (preference) => `${context.instrument.preferences[preference].name} ${result.scores[preference]}`,
  ).join(', ');
  return plain(
    s('circleAlt', {
      scores,
      min: minScore(n),
      max: maxScore(n),
      mid: midScore(n),
      stand: standSentence(context, result.placement),
    }),
  );
}

/** Drops the bold markers the rich-text strings use. */
function plain(text: string): string {
  return text.replace(/\*\*/g, '');
}

/**
 * A link made with an earlier edition of the items. Its ranks belong to
 * statements and a model that no longer exist, so it is not re-scored.
 */
export function staleLinkScreen(
  context: ScreenContext,
  savedVersion: string,
  onRestart: () => void,
): HTMLElement {
  const s = scoped(context.t, 'result');
  return section(
    el('h1', { text: s('staleTitle') }),
    el('p', {
      class: 'prose-note',
      text: s('staleVersion', { saved: savedVersion, n: context.instrument.sets.length }),
    }),
    el(
      'div',
      { class: 'btn-row' },
      el('button', {
        class: 'btn accent',
        text: s('startOver', { n: context.instrument.sets.length }),
        attrs: { type: 'button' },
        on: { click: onRestart },
      }),
    ),
  );
}

function saveSection(context: ScreenContext, options: ResultScreenOptions): HTMLElement {
  const s = scoped(context.t, 'result');
  const feedback = el('p', { class: 'status', attrs: { 'aria-live': 'polite' } });

  const copyButton = el('button', {
    class: 'btn',
    text: s('copy'),
    attrs: { type: 'button' },
    on: {
      click: () => {
        const link = window.location.href;
        void navigator.clipboard
          ?.writeText(link)
          .then(() => {
            feedback.textContent = s('copied');
          })
          .catch(() => {
            feedback.textContent = s('copyFailed');
          });
        if (!navigator.clipboard) feedback.textContent = s('copyFailed');
      },
    },
  });

  return section(
    el('h2', { text: s('saveTitle') }),
    el('p', { class: 'prose-note', text: s('saveLead') }),
    el(
      'div',
      { class: 'btn-row no-print' },
      copyButton,
      el('button', {
        class: 'btn',
        text: s('print'),
        attrs: { type: 'button' },
        on: { click: () => window.print() },
      }),
      el('button', {
        class: 'btn quiet',
        text: s('restart'),
        attrs: { type: 'button' },
        on: { click: options.onRestart },
      }),
    ),
    feedback,
    el(
      'p',
      { class: 'after-note no-print' },
      el('a', {
        class: 'more',
        text: context.t.t('intro.aboutLink'),
        attrs: { href: context.href(ROUTES.about) },
      }),
    ),
  );
}

export function badLinkScreen(context: ScreenContext, onRestart: () => void): HTMLElement {
  const s = scoped(context.t, 'result');
  return section(
    el('h1', { text: s('badLinkTitle') }),
    el('p', { class: 'prose-note', text: s('badLink') }),
    el(
      'div',
      { class: 'btn-row' },
      el('button', {
        class: 'btn accent',
        text: s('startOver', { n: context.instrument.sets.length }),
        attrs: { type: 'button' },
        on: { click: onRestart },
      }),
    ),
  );
}
