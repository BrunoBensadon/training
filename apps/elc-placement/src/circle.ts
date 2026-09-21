/**
 * The result diagram.
 *
 * Inline SVG, no canvas, legible in both themes because every colour is a
 * CSS custom property rather than a baked-in value.
 *
 * Colour never carries meaning on its own: each quadrant is labelled with
 * its name inside the diagram, the axis poles are labelled at the ends,
 * and the marker is labelled too. The same information appears again in
 * the table underneath, and the whole figure has a text alternative. Read
 * with colour removed, nothing is lost.
 */
import { svg, el } from '@training/ui';
import type { Axis, Quadrant } from './model.ts';
import { QUADRANT_POLES } from './model.ts';
import type { Instrument } from './instrument.ts';
import type { Result } from './scoring.ts';
import { axisRange } from './scoring.ts';

const SIZE = 420;
const CENTRE = SIZE / 2;
const RADIUS = 168;
/** Keep the marker inside the ring even at the extremes. */
const MARKER_REACH = RADIUS - 26;

export interface CircleOptions {
  result: Result;
  instrument: Instrument;
  setCount: number;
  titleText: string;
  descriptionText: string;
  youLabel: string;
}

function quadrantCentre(quadrant: Quadrant): { x: number; y: number } {
  const poles = QUADRANT_POLES[quadrant];
  const offset = RADIUS * 0.52;
  return {
    x: CENTRE + poles.processing * offset,
    y: CENTRE - poles.perceiving * offset,
  };
}

function markerPosition(result: Result, setCount: number): { x: number; y: number } {
  const range = axisRange(setCount) || 1;
  return {
    x: CENTRE + (result.axes.processing / range) * MARKER_REACH,
    y: CENTRE - (result.axes.perceiving / range) * MARKER_REACH,
  };
}

/** The quadrants to draw as "where you leaned", which may be none, one or two. */
function highlighted(result: Result): Quadrant[] {
  switch (result.placement.kind) {
    case 'quadrant':
      return [result.placement.quadrant];
    case 'edge':
      return [...result.placement.between];
    case 'centre':
      return [];
  }
}

export function resultCircle(options: CircleOptions): SVGSVGElement {
  const { result, instrument, setCount } = options;
  const titleId = 'circle-title';
  const descriptionId = 'circle-desc';
  const lead = highlighted(result);

  const root = svg('svg', {
    class: 'circle',
    attrs: {
      viewBox: `0 0 ${SIZE} ${SIZE}`,
      role: 'img',
      'aria-labelledby': `${titleId} ${descriptionId}`,
      focusable: 'false',
    },
  });

  root.append(
    svg('title', { id: titleId, text: options.titleText }),
    svg('desc', { id: descriptionId, text: options.descriptionText }),
  );

  // Quadrant wedges. The fill is a tint; the label is the information.
  for (const quadrant of Object.keys(QUADRANT_POLES) as Quadrant[]) {
    const poles = QUADRANT_POLES[quadrant];
    const isLead = lead.includes(quadrant);
    const startX = CENTRE + poles.processing * RADIUS;
    const endY = CENTRE - poles.perceiving * RADIUS;
    // Screen coordinates put y downwards, so sweep 1 (SVG's positive
    // angle direction) draws clockwise. Getting this backwards bends each
    // wedge inwards and turns the circle into a four-pointed star.
    const sweep = poles.processing * poles.perceiving > 0 ? 0 : 1;

    root.append(
      svg('path', {
        class: `wedge${isLead ? ' wedge-lead' : ''}`,
        attrs: {
          d: `M ${CENTRE} ${CENTRE} L ${startX} ${CENTRE} A ${RADIUS} ${RADIUS} 0 0 ${sweep} ${CENTRE} ${endY} Z`,
        },
      }),
    );
  }

  root.append(
    svg('circle', {
      class: 'ring',
      attrs: { cx: CENTRE, cy: CENTRE, r: RADIUS },
    }),
    svg('line', {
      class: 'axis',
      attrs: { x1: CENTRE - RADIUS, y1: CENTRE, x2: CENTRE + RADIUS, y2: CENTRE },
    }),
    svg('line', {
      class: 'axis',
      attrs: { x1: CENTRE, y1: CENTRE - RADIUS, x2: CENTRE, y2: CENTRE + RADIUS },
    }),
  );

  // Quadrant names, inside the wedge they belong to.
  for (const quadrant of Object.keys(QUADRANT_POLES) as Quadrant[]) {
    const { x, y } = quadrantCentre(quadrant);
    root.append(
      svg('text', {
        class: `wedge-label${lead.includes(quadrant) ? ' is-lead' : ''}`,
        text: instrument.quadrants[quadrant].name,
        attrs: { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'middle' },
      }),
    );
  }

  // Axis poles, labelled at the ends so the diagram reads without the key.
  const poleLabels: Array<{ axis: Axis; text: string; x: number; y: number; anchor: string }> = [
    {
      axis: 'perceiving',
      text: instrument.axes.perceiving.positive,
      x: CENTRE,
      y: CENTRE - RADIUS - 12,
      anchor: 'middle',
    },
    {
      axis: 'perceiving',
      text: instrument.axes.perceiving.negative,
      x: CENTRE,
      y: CENTRE + RADIUS + 24,
      anchor: 'middle',
    },
    {
      axis: 'processing',
      text: instrument.axes.processing.negative,
      x: CENTRE - RADIUS - 8,
      y: CENTRE - 10,
      anchor: 'start',
    },
    {
      axis: 'processing',
      text: instrument.axes.processing.positive,
      x: CENTRE + RADIUS + 8,
      y: CENTRE - 10,
      anchor: 'end',
    },
  ];
  for (const label of poleLabels) {
    root.append(
      svg('text', {
        class: 'pole-label',
        text: label.text,
        attrs: { x: label.x, y: label.y, 'text-anchor': label.anchor },
      }),
    );
  }

  // The marker. Two concentric shapes so it stays visible against any
  // wedge tint, and labelled, so it is not a coloured dot and nothing else.
  const { x, y } = markerPosition(result, setCount);
  root.append(
    svg('circle', { class: 'marker-halo', attrs: { cx: x, cy: y, r: 13 } }),
    svg('circle', { class: 'marker', attrs: { cx: x, cy: y, r: 6.5 } }),
    svg('text', {
      class: 'marker-label',
      text: options.youLabel,
      attrs: {
        x,
        y: y - 20,
        'text-anchor': 'middle',
      },
    }),
  );

  return root;
}

/**
 * The figure plus its caption, and a text alternative that is in the page
 * rather than only in the SVG — the numbers underneath say the same thing
 * in words for anyone who cannot use the picture.
 */
export function circleFigure(options: CircleOptions, alternative: string): HTMLElement {
  return el(
    'figure',
    { class: 'circle-figure' },
    resultCircle(options),
    el('figcaption', { class: 'visually-hidden', text: alternative }),
  );
}
