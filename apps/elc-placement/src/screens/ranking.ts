/**
 * One set of four statements, ranked 1–4.
 *
 * Drag-to-rank was rejected: it is unreliable on phones, where most
 * trainees are, and it is close to unusable with a screen reader or a
 * switch device. This is four native radio groups instead — one per
 * statement, four ranks each — with the constraint that a rank can only be
 * held by one statement enforced by swapping rather than by blocking.
 *
 * Native radios mean arrow keys, tab order, focus rings and screen-reader
 * announcements all work without being reimplemented. What is not native
 * is the consequence of a choice on the *other* statements, so that is
 * announced through a live region.
 */
import { el } from '@training/ui';
import { ROUTES } from '../router.ts';
import { QUADRANTS, RANKS, isComplete, type Quadrant, type Rank } from '../model.ts';
import { scoped, section, type ScreenContext } from './context.ts';

export interface RankingScreenOptions {
  /** 1-based. */
  setNumber: number;
  onComplete: () => void;
}

export function rankingScreen(
  context: ScreenContext,
  options: RankingScreenOptions,
): HTMLElement {
  const s = scoped(context.t, 'assessment');
  const { setNumber } = options;
  const index = setNumber - 1;
  const sets = context.instrument.sets;
  const set = sets[index]!;
  const total = sets.length;
  const ranking = context.state.responses[index]!;
  const order = context.state.displayOrder[index]!;

  const statusLine = el('p', { class: 'status', attrs: { 'aria-live': 'polite' } });
  const errorLine = el('p', { class: 'form-error', attrs: { role: 'alert' } });
  const inputs = new Map<Quadrant, Map<Rank, HTMLInputElement>>();

  const refresh = (): void => {
    for (const [quadrant, byRank] of inputs) {
      for (const [rank, input] of byRank) {
        input.checked = ranking[quadrant] === rank;
        input.closest('.rank-option')?.classList.toggle('is-chosen', input.checked);
      }
    }
    const remaining = QUADRANTS.filter((quadrant) => ranking[quadrant] === undefined).length;
    statusLine.textContent = remaining === 0 ? s('complete') : s('remaining', { n: remaining });
    statusLine.classList.toggle('is-complete', remaining === 0);
  };

  const assign = (quadrant: Quadrant, rank: Rank): void => {
    const previous = ranking[quadrant];
    if (previous === rank) return;

    const displaced = QUADRANTS.find(
      (candidate) => candidate !== quadrant && ranking[candidate] === rank,
    );

    ranking[quadrant] = rank;

    let message: string;
    if (displaced && previous !== undefined) {
      ranking[displaced] = previous;
      message = s('announceSwapped', {
        rank,
        statement: set.statements[quadrant],
        other: set.statements[displaced],
        otherRank: previous,
      });
    } else if (displaced) {
      delete ranking[displaced];
      message = s('announceDisplaced', {
        rank,
        statement: set.statements[quadrant],
        other: set.statements[displaced],
      });
    } else {
      message = s('announceAssigned', { rank, statement: set.statements[quadrant] });
    }

    errorLine.textContent = '';
    refresh();

    if (isComplete(ranking)) message = `${message} ${s('announceComplete')}`;
    context.announce(message);
  };

  const statementList = el('ol', { class: 'statements' });

  for (const quadrant of order) {
    const groupName = `set-${set.id}-${quadrant}`;
    const labelId = `${groupName}-label`;
    const byRank = new Map<Rank, HTMLInputElement>();
    inputs.set(quadrant, byRank);

    // A radiogroup labelled by the statement, rather than a fieldset:
    // native radios keep arrow-key navigation and screen-reader output,
    // and a legend inside a CSS grid is unreliable across browsers.
    const options = el('div', {
      class: 'ranks',
      attrs: { role: 'radiogroup', 'aria-labelledby': labelId },
    });
    for (const rank of RANKS) {
      const input = el('input', {
        attrs: {
          type: 'radio',
          name: groupName,
          value: rank,
          'aria-label': s(`rankNames.${rank}`),
        },
        on: {
          change: () => assign(quadrant, rank),
        },
      });
      byRank.set(rank, input);

      options.append(
        el(
          'label',
          { class: 'rank-option' },
          input,
          el('span', { class: 'rank-digit', attrs: { 'aria-hidden': 'true' }, text: String(rank) }),
        ),
      );
    }

    statementList.append(
      el(
        'li',
        { class: 'statement' },
        el('p', { class: 'statement-text', id: labelId, text: set.statements[quadrant] }),
        options,
      ),
    );
  }

  const goNext = (): void => {
    if (!isComplete(ranking)) {
      errorLine.textContent = s('incomplete');
      const firstUnranked = QUADRANTS.find((quadrant) => ranking[quadrant] === undefined);
      const target = firstUnranked && inputs.get(firstUnranked)?.get(1);
      target?.focus();
      return;
    }
    if (setNumber >= total) {
      options.onComplete();
      return;
    }
    context.navigate(context.href(ROUTES.set(setNumber + 1)));
  };

  const clear = (): void => {
    for (const quadrant of QUADRANTS) delete ranking[quadrant];
    errorLine.textContent = '';
    refresh();
    inputs.get(order[0]!)?.get(1)?.focus();
  };

  const buttons = el(
    'div',
    { class: 'btn-row' },
    el('button', {
      class: 'btn quiet',
      text: s('back'),
      attrs: { type: 'button' },
      on: {
        click: () => {
          context.navigate(
            setNumber === 1
              ? context.href(ROUTES.intro)
              : context.href(ROUTES.set(setNumber - 1)),
          );
        },
      },
    }),
    el('button', {
      class: 'btn quiet',
      text: s('clear'),
      attrs: { type: 'button' },
      on: { click: clear },
    }),
    el('button', {
      class: 'btn accent',
      text: setNumber >= total ? s('finish') : s('next'),
      attrs: { type: 'button' },
      on: { click: goNext },
    }),
  );

  const screen = el(
    'div',
    {},
    section(
      el('p', { class: 'kicker', text: s('progress', { n: setNumber, total }) }),
      progressBar(setNumber, total),
      el('h1', { class: 'set-prompt', text: set.prompt }),
      el('p', { class: 'instruction', text: s('instruction') }),
      rankScale(context),
      statementList,
      statusLine,
      errorLine,
      buttons,
      // The flip side of keeping answers in memory only: say so, rather
      // than letting someone find out by reloading.
      el('p', { class: 'leave-warning', text: s('leaveWarning') }),
    ),
  );

  refresh();
  return screen;
}

/** Decorative: the text beside it already says "set 2 of 6". */
function progressBar(setNumber: number, total: number): HTMLElement {
  const bar = el('div', { class: 'progress', attrs: { 'aria-hidden': 'true' } });
  for (let i = 1; i <= total; i += 1) {
    bar.append(el('span', { class: `pip${i <= setNumber ? ' is-done' : ''}` }));
  }
  return bar;
}

/** The 1..4 key above the columns. Hidden from assistive technology
 *  because each radio already carries the full name as its label. */
function rankScale(context: ScreenContext): HTMLElement {
  const s = scoped(context.t, 'assessment');
  return el(
    'div',
    { class: 'rank-scale', attrs: { 'aria-hidden': 'true' } },
    el('span', { class: 'end', text: `1 · ${s('mostLikeMe')}` }),
    el('span', { class: 'end', text: `4 · ${s('leastLikeMe')}` }),
  );
}
