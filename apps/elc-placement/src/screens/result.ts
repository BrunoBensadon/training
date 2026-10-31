/**
 * The result.
 *
 * Shows the whole four-way shape, never a bare type label. The highest
 * preference is named only as "where you leaned today", the diagram draws
 * all four scores on the cycle, and when the top two are inside the
 * scoring band the screen says so instead of quietly picking the higher
 * number.
 *
 * The mandated disclaimer sits directly under the heading, before any
 * number, because a caveat at the bottom of a results page is a caveat
 * nobody reads.
 */
import { el } from '@training/ui';
import { ROUTES } from '../router.ts';
import { AXES, AXIS_POLES, PREFERENCES, type Preference } from '../model.ts';
import { BAND, type Result } from '../scoring.ts';
import { circleFigure } from '../circle.ts';
import { richParagraph, scoped, section, type ScreenContext } from './context.ts';

export interface ResultScreenOptions {
  result: Result;
  /** Set when the link was made against a different edition of the items. */
  savedItemsVersion?: string;
  onRestart: () => void;
}

export function resultScreen(context: ScreenContext, options: ResultScreenOptions): HTMLElement {
  const s = scoped(context.t, 'result');
  const { result } = options;
  const { instrument } = context;

  const screen = el('div', {});

  if (options.savedItemsVersion && options.savedItemsVersion !== instrument.version) {
    screen.append(
      section(
        el('p', {
          class: 'note stale',
          text: s('staleVersion', {
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
      ...leaningLines(context, result),
      el('p', { class: 'stand-where', text: standWhere(context, result) }),
    ),
  );

  screen.append(
    section(
      el('h2', { class: 'visually-hidden', text: s('circleTitle') }),
      circleFigure(
        {
          result,
          instrument,
          setCount: instrument.sets.length,
          titleText: s('circleTitle'),
          descriptionText: s('circleDesc'),
          youLabel: s('youAreHere'),
        },
        textAlternative(context, result),
      ),
    ),
  );

  screen.append(
    section(
      el('h2', { text: s('shapeTitle') }),
      el('p', { class: 'prose-note', text: s('shapeLead', { total: result.total }) }),
      shapeTable(context, result),
    ),
  );

  screen.append(
    section(
      el('h2', { text: s('axesTitle') }),
      el('p', { class: 'prose-note', text: s('axesLead') }),
      el('ul', { class: 'plain axes' }, ...axisLines(context, result).map((line) => el('li', { text: line }))),
    ),
  );

  screen.append(saveSection(context, options));

  return screen;
}

function leaningLines(context: ScreenContext, result: Result): HTMLElement[] {
  const s = scoped(context.t, 'result');
  const { instrument } = context;
  const name = (preference: Preference): string => instrument.preferences[preference].name;
  const lines: HTMLElement[] = [];

  if (result.balanced) {
    lines.push(richParagraph(s('leanedBalanced'), 'lead'));
    return lines;
  }

  switch (result.placement.kind) {
    case 'single': {
      const preference = result.placement.preference;
      lines.push(
        richParagraph(
          s('leanedSingle', {
            preference: name(preference),
            short: instrument.preferences[preference].short,
          }),
          'lead',
        ),
      );
      break;
    }
    case 'between': {
      const [first, second] = result.placement.pair;
      lines.push(
        richParagraph(s('leanedBetween', { first: name(first), second: name(second) }), 'lead'),
      );
      break;
    }
    case 'centre':
      lines.push(
        richParagraph(
          s('leanedCentre', { list: result.tiedAtTop.map(name).join(', ') }),
          'lead',
        ),
      );
      break;
  }

  if (result.closeCall.length > 1) {
    const panel = el('div', { class: 'panel close-call' }, el('h2', { text: s('closeCallTitle') }));
    if (result.closeCall.length === 2) {
      panel.append(
        richParagraph(
          s('closeCall', {
            first: name(result.closeCall[0]!),
            second: name(result.closeCall[1]!),
            band: BAND,
          }),
        ),
      );
    } else {
      panel.append(
        richParagraph(
          s('closeCallMany', {
            band: BAND,
            list: result.closeCall.map(name).join(', '),
          }),
        ),
      );
    }
    lines.push(panel);
  }

  return lines;
}

function standWhere(context: ScreenContext, result: Result): string {
  const s = scoped(context.t, 'result');
  const name = (preference: Preference): string => context.instrument.preferences[preference].name;

  switch (result.placement.kind) {
    case 'single':
      return s('standWhere', { where: s('standAt', { preference: name(result.placement.preference) }) });
    case 'between': {
      const [first, second] = result.placement.pair;
      return s('standWhere', {
        where: s('standBetween', { first: name(first), second: name(second) }),
      });
    }
    case 'centre':
      return s('standWhere', { where: s('standCentre') });
  }
}

function shapeTable(context: ScreenContext, result: Result): HTMLElement {
  const s = scoped(context.t, 'result');
  const { instrument } = context;

  const head = el(
    'tr',
    {},
    el('th', { text: s('colPreference'), attrs: { scope: 'col' } }),
    el('th', { text: s('colStage'), attrs: { scope: 'col' } }),
    el('th', { class: 'num', text: s('colScore'), attrs: { scope: 'col' } }),
  );

  const body = el('tbody');
  for (const preference of result.order) {
    const isLead = result.closeCall.includes(preference);
    body.append(
      el(
        'tr',
        { class: isLead ? 'is-lead' : '' },
        el('th', { text: instrument.preferences[preference].name, attrs: { scope: 'row' } }),
        el('td', { text: instrument.preferences[preference].stage }),
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

function axisLines(context: ScreenContext, result: Result): string[] {
  const s = scoped(context.t, 'result');
  const { instrument } = context;

  // AXES, not Object.keys: the reading order should not depend on how a
  // locale file happens to order its keys.
  return AXES.map((axis) => {
    const info = instrument.axes[axis];
    const value = result.axes[axis];
    const { positive, negative } = AXIS_POLES[axis];
    if (value === 0) {
      return s('axisEven', {
        name: info.name,
        positive: instrument.preferences[positive].name,
        negative: instrument.preferences[negative].name,
      });
    }
    return s('axisReading', {
      name: info.name,
      value: Math.abs(value),
      pole: instrument.preferences[value > 0 ? positive : negative].name,
      description: value > 0 ? info.positiveDescription : info.negativeDescription,
    });
  });
}

/** What the diagram says, in words, for anyone not using the diagram. */
function textAlternative(context: ScreenContext, result: Result): string {
  const { instrument } = context;
  const scores = PREFERENCES.map(
    (preference) => `${instrument.preferences[preference].name} ${result.scores[preference]}`,
  ).join('; ');
  return `${standWhere(context, result)} ${scores}. ${axisLines(context, result).join('. ')}.`;
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
        text: s('startOver'),
        attrs: { type: 'button' },
        on: { click: onRestart },
      }),
    ),
  );
}
