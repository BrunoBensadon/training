/**
 * The result.
 *
 * Shows the whole four-way shape, never a bare type label. The primary
 * quadrant is named only as "where you leaned today", the axes are
 * presented as the better-supported reading, and when the top two are
 * inside the scoring band the screen says so instead of quietly picking
 * the higher number.
 *
 * The mandated disclaimer sits directly under the heading, before any
 * number, because a caveat at the bottom of a results page is a caveat
 * nobody reads.
 */
import { el } from '@training/ui';
import { ROUTES } from '../router.ts';
import { QUADRANTS, type Axis, type Quadrant } from '../model.ts';
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
  const name = (quadrant: Quadrant): string => instrument.quadrants[quadrant].name;
  const lines: HTMLElement[] = [];

  if (result.balanced) {
    lines.push(richParagraph(s('leanedBalanced'), 'lead'));
    return lines;
  }

  switch (result.placement.kind) {
    case 'quadrant': {
      const quadrant = result.placement.quadrant;
      lines.push(
        richParagraph(
          s('leanedQuadrant', {
            quadrant: name(quadrant),
            short: instrument.quadrants[quadrant].short.toLowerCase(),
          }),
          'lead',
        ),
      );
      break;
    }
    case 'edge': {
      const [first, second] = result.placement.between;
      lines.push(
        richParagraph(
          s('leanedEdge', {
            first: name(first),
            second: name(second),
            axis: instrument.axes[result.placement.axis].name.toLowerCase(),
          }),
          'lead',
        ),
      );
      break;
    }
    case 'centre':
      lines.push(richParagraph(s('leanedCentre'), 'lead'));
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
  const name = (quadrant: Quadrant): string => context.instrument.quadrants[quadrant].name;

  if (result.balanced || result.placement.kind === 'centre') {
    return s('standWhere', { where: s('standCentre') });
  }
  if (result.placement.kind === 'edge') {
    const [first, second] = result.placement.between;
    return s('standWhere', {
      where: s('standEdge', { first: name(first), second: name(second) }),
    });
  }
  return s('standWhere', { where: name(result.placement.quadrant) });
}

function shapeTable(context: ScreenContext, result: Result): HTMLElement {
  const s = scoped(context.t, 'result');
  const { instrument } = context;

  const head = el(
    'tr',
    {},
    el('th', { text: s('colQuadrant'), attrs: { scope: 'col' } }),
    el('th', { text: s('colDescription'), attrs: { scope: 'col' } }),
    el('th', { class: 'num', text: s('colScore'), attrs: { scope: 'col' } }),
  );

  const body = el('tbody');
  for (const quadrant of result.order) {
    const isLead = result.closeCall.includes(quadrant);
    body.append(
      el(
        'tr',
        { class: isLead ? 'is-lead' : '' },
        el('th', { text: instrument.quadrants[quadrant].name, attrs: { scope: 'row' } }),
        el('td', { text: instrument.quadrants[quadrant].short }),
        el('td', { class: 'num', text: String(result.scores[quadrant]) }),
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

  return (Object.keys(instrument.axes) as Axis[]).map((axis) => {
    const info = instrument.axes[axis];
    const value = result.axes[axis];
    if (value === 0) {
      return s('axisEven', {
        name: info.name,
        positive: info.positive,
        negative: info.negative,
      });
    }
    return s('axisReading', {
      name: info.name,
      value: Math.abs(value),
      pole: value > 0 ? info.positive : info.negative,
      description: value > 0 ? info.positiveDescription : info.negativeDescription,
    });
  });
}

/** What the diagram says, in words, for anyone not using the diagram. */
function textAlternative(context: ScreenContext, result: Result): string {
  const { instrument } = context;
  const scores = QUADRANTS.map(
    (quadrant) => `${instrument.quadrants[quadrant].name} ${result.scores[quadrant]}`,
  ).join('; ');
  return `${axisLines(context, result).join('. ')}. ${scores}.`;
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
