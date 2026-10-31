/**
 * The result diagram: the learning cycle, with your profile drawn on it.
 *
 * The four preferences sit at the compass points of the circle, because
 * each is a stage of the cycle: Active at the top, Reflective on the
 * right, Theorist at the bottom, Pragmatist on the left. Arrows on the
 * ring show the direction the cycle runs, clockwise.
 *
 * Your four scores are drawn as a kite, one point on each spoke, so the
 * whole shape is visible rather than one number. A dashed ring marks where
 * a perfectly even spread would put every point. The part of the circle
 * you stand in on the floor is shaded and marked "You".
 *
 * Inline SVG, no canvas, legible in both themes because every colour is a
 * CSS custom property. Colour never carries meaning on its own: every
 * preference is labelled with its name, the marker is labelled, the same
 * numbers are in the table underneath, and the figure has a text
 * alternative. Read with colour removed, nothing is lost.
 */
import { svg, el } from '@training/ui';
import { BEARING, PREFERENCES, type Preference } from './model.ts';
import type { Instrument } from './instrument.ts';
import type { Placement, Result } from './scoring.ts';
import { maxScore } from './scoring.ts';

const WIDTH = 512;
const HEIGHT = 372;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const RADIUS = 128;
/** Gap between the ring and the labels outside it. */
const LABEL_GAP = 14;

export interface CircleOptions {
  result: Result;
  instrument: Instrument;
  setCount: number;
  titleText: string;
  descriptionText: string;
  youLabel: string;
}

/** A point at a compass bearing (0 = up, clockwise) and a distance from the centre. */
function at(bearing: number, distance: number): { x: number; y: number } {
  const radians = (bearing * Math.PI) / 180;
  return {
    x: round(CX + distance * Math.sin(radians)),
    y: round(CY - distance * Math.cos(radians)),
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** The preferences whose part of the circle is shaded. */
function leading(placement: Placement): Preference[] {
  switch (placement.kind) {
    case 'single':
      return [placement.preference];
    case 'between':
      return [...placement.pair];
    case 'centre':
      return [];
  }
}

/** Where "You" goes: at your point on the ring, between two, or the middle. */
function markerBearing(placement: Placement): number | null {
  switch (placement.kind) {
    case 'single':
      return BEARING[placement.preference];
    case 'between': {
      const [first] = placement.pair;
      return (BEARING[first] + 45) % 360;
    }
    case 'centre':
      return null;
  }
}

/** A wedge of the circle 90° wide, centred on a preference's bearing. */
function sectorPath(bearing: number): string {
  const start = at(bearing - 45, RADIUS);
  const end = at(bearing + 45, RADIUS);
  // In screen coordinates y points down, so SVG's positive sweep is
  // clockwise — the direction bearings increase.
  return `M ${CX} ${CY} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y} Z`;
}

/** A small arrowhead on the ring, pointing clockwise. */
function arrowPath(bearing: number): string {
  const radians = (bearing * Math.PI) / 180;
  const tip = at(bearing, RADIUS);
  // Clockwise tangent and outward normal at this bearing, in screen space.
  const tangent = { x: Math.cos(radians), y: Math.sin(radians) };
  const normal = { x: Math.sin(radians), y: -Math.cos(radians) };
  const length = 9;
  const half = 5;
  const point = (along: number, across: number): string =>
    `${round(tip.x + tangent.x * along + normal.x * across)} ${round(tip.y + tangent.y * along + normal.y * across)}`;
  return `M ${point(length / 2, 0)} L ${point(-length / 2, half)} L ${point(-length / 2, -half)} Z`;
}

/** Name and step for each preference, outside the ring at its compass point. */
function labelLayout(preference: Preference): {
  x: number;
  nameY: number;
  stepY: number;
  anchor: 'start' | 'middle' | 'end';
} {
  switch (BEARING[preference]) {
    case 0:
      return { x: CX, nameY: CY - RADIUS - LABEL_GAP - 18, stepY: CY - RADIUS - LABEL_GAP, anchor: 'middle' };
    case 90:
      return { x: CX + RADIUS + LABEL_GAP, nameY: CY - 4, stepY: CY + 14, anchor: 'start' };
    case 180:
      return { x: CX, nameY: CY + RADIUS + LABEL_GAP + 16, stepY: CY + RADIUS + LABEL_GAP + 34, anchor: 'middle' };
    case 270:
      return { x: CX - RADIUS - LABEL_GAP, nameY: CY - 4, stepY: CY + 14, anchor: 'end' };
  }
}

export function resultCircle(options: CircleOptions): SVGSVGElement {
  const { result, instrument, setCount } = options;
  const titleId = 'circle-title';
  const descriptionId = 'circle-desc';
  const lead = leading(result.placement);
  const youBearing = markerBearing(result.placement);

  const root = svg('svg', {
    class: 'circle',
    attrs: {
      viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
      role: 'img',
      'aria-labelledby': `${titleId} ${descriptionId}`,
      focusable: 'false',
    },
  });

  root.append(
    svg('title', { id: titleId, text: options.titleText }),
    svg('desc', { id: descriptionId, text: options.descriptionText }),
  );

  // The four parts of the floor circle. The fill is a tint; the label is
  // the information.
  for (const preference of PREFERENCES) {
    root.append(
      svg('path', {
        class: `sector${lead.includes(preference) ? ' sector-lead' : ''}`,
        attrs: { d: sectorPath(BEARING[preference]), 'data-preference': preference },
      }),
    );
  }

  // The two dialectics, from each preference to the one facing it.
  root.append(
    svg('line', {
      class: 'axis',
      attrs: { x1: CX, y1: CY - RADIUS, x2: CX, y2: CY + RADIUS },
    }),
    svg('line', {
      class: 'axis',
      attrs: { x1: CX - RADIUS, y1: CY, x2: CX + RADIUS, y2: CY },
    }),
  );

  // Where an even spread would put all four points.
  const max = maxScore(setCount) || 1;
  const evenRadius = (result.total / PREFERENCES.length / max) * RADIUS;
  root.append(
    svg('circle', {
      class: 'even-ring',
      attrs: { cx: CX, cy: CY, r: round(evenRadius) },
    }),
  );

  // The cycle itself, and the direction it runs. One arrow between each
  // pair of neighbours — except where "You" stands between two of them.
  root.append(svg('circle', { class: 'ring', attrs: { cx: CX, cy: CY, r: RADIUS } }));
  for (const preference of PREFERENCES) {
    const bearing = (BEARING[preference] + 45) % 360;
    if (bearing === youBearing) continue;
    root.append(svg('path', { class: 'cycle-arrow', attrs: { d: arrowPath(bearing) } }));
  }

  // The profile: one point per preference, as far out as its score.
  const vertices = PREFERENCES.map((preference) =>
    at(BEARING[preference], (result.scores[preference] / max) * RADIUS),
  );
  root.append(
    svg('polygon', {
      class: 'kite',
      attrs: { points: vertices.map(({ x, y }) => `${x},${y}`).join(' ') },
    }),
    ...vertices.map(({ x, y }) => svg('circle', { class: 'kite-point', attrs: { cx: x, cy: y, r: 3.5 } })),
  );

  // Names and steps, outside the ring at each compass point.
  for (const preference of PREFERENCES) {
    const info = instrument.preferences[preference];
    const layout = labelLayout(preference);
    const isLead = lead.includes(preference);
    root.append(
      svg('text', {
        class: `pref-label${isLead ? ' is-lead' : ''}`,
        text: info.name,
        attrs: { x: layout.x, y: layout.nameY, 'text-anchor': layout.anchor },
      }),
      svg('text', {
        class: 'step-label',
        text: info.step,
        attrs: { x: layout.x, y: layout.stepY, 'text-anchor': layout.anchor },
      }),
    );
  }

  // "You": on the ring where you stand, or in the middle. Two concentric
  // shapes so it stays visible against any tint, and labelled, so it is
  // not a coloured dot and nothing else.
  const marker = youBearing === null ? { x: CX, y: CY } : at(youBearing, RADIUS);
  const label = youBearing === null ? { x: CX, y: CY - 20 } : at(youBearing, RADIUS - 26);
  root.append(
    svg('circle', { class: 'marker-halo', attrs: { cx: marker.x, cy: marker.y, r: 12 } }),
    svg('circle', { class: 'marker', attrs: { cx: marker.x, cy: marker.y, r: 6.5 } }),
    svg('text', {
      class: 'marker-label',
      text: options.youLabel,
      attrs: { x: label.x, y: label.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle' },
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
