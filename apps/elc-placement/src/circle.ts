/**
 * The result diagram: the learning cycle, with your profile drawn on it.
 *
 * The four preferences sit at the compass points of the circle, because
 * each is a stage of the cycle: Active at the top, Reflective on the
 * right, Theorist at the bottom, Pragmatist on the left. Arrows on the
 * ring show the direction the cycle runs, clockwise.
 *
 * Your four scores are drawn as a kite, one point on each spoke — at the
 * centre for "last in every set", on the ring for "first in every set" —
 * so the whole shape is visible rather than one number. A dashed ring
 * marks the middle score. The marker says where to stand: at a point, on
 * the ring between two neighbours, or in the centre. The specification is
 * docs/reviews/elc-placement-2-content-guide.md §3F.
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
import { maxScore, minScore } from './scoring.ts';

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
  titleText: string;
  descriptionText: string;
  youLabel: string;
  /** Label for the dashed ring at the middle score. */
  middleLabel: string;
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

/** The labels to highlight: every preference the placement names. */
function named(placement: Placement): Preference[] {
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

/** The parts of the floor circle to shade: only where someone stands on
 *  the circle. Opposite and spread results stand in the centre. */
function shaded(placement: Placement): Preference[] {
  return placement.kind === 'point' || placement.kind === 'between' ? named(placement) : [];
}

/** Where the marker goes: at your point on the ring, halfway between two
 *  neighbours on the ring, or (null) the centre. */
function markerBearing(placement: Placement): number | null {
  switch (placement.kind) {
    case 'point':
      return BEARING[placement.preference];
    case 'between':
      // The pair is listed clockwise, so the midpoint is 45° on from the first.
      return (BEARING[placement.pair[0]] + 45) % 360;
    case 'opposite':
    case 'spread':
      return null;
  }
}

/*
 * Labels inside the ring are kept apart by side. Each score is written on
 * the clockwise side of its own spoke; the "stand here" label for a
 * compass point goes on the anticlockwise side of that spoke. So the two
 * can never meet, however long or short the kite's arms are.
 */

/** Where a score is written beside its kite point. */
function scoreLabel(
  preference: Preference,
  vertex: { x: number; y: number },
): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } {
  switch (BEARING[preference]) {
    case 0:
      return { x: vertex.x + 16, y: vertex.y + 4, anchor: 'start' };
    case 90:
      return { x: vertex.x, y: vertex.y + 24, anchor: 'middle' };
    case 180:
      return { x: vertex.x - 16, y: vertex.y + 4, anchor: 'end' };
    case 270:
      return { x: vertex.x, y: vertex.y - 15, anchor: 'middle' };
  }
}

/**
 * Where the marker's label goes: inside the ring, on the anticlockwise
 * side of a compass point's spoke; inward along the diagonal between two
 * points, where no spoke runs; and below-right of the centre, the corner
 * no score label uses.
 */
function markerLabel(bearing: number | null): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } {
  switch (bearing) {
    case null:
      return { x: CX + 14, y: CY + 44, anchor: 'start' };
    case 0:
      return { x: CX - 16, y: CY - RADIUS + 26, anchor: 'end' };
    case 90:
      return { x: CX + RADIUS - 14, y: CY - 14, anchor: 'end' };
    case 180:
      return { x: CX + 16, y: CY + RADIUS - 18, anchor: 'start' };
    case 270:
      return { x: CX - RADIUS + 14, y: CY + 30, anchor: 'start' };
    default: {
      const { x, y } = at(bearing, RADIUS - 32);
      return { x, y, anchor: 'middle' };
    }
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
  const { result, instrument } = options;
  const n = result.setCount;
  const titleId = 'circle-title';
  const descriptionId = 'circle-desc';
  const highlighted = named(result.placement);
  const floor = shaded(result.placement);
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

  // The four parts of the floor circle, faint; the part you stand in is
  // tinted. The fill is a tint; the label is the information.
  for (const preference of PREFERENCES) {
    root.append(
      svg('path', {
        class: `sector${floor.includes(preference) ? ' sector-lead' : ''}`,
        attrs: { d: sectorPath(BEARING[preference]), 'data-preference': preference },
      }),
    );
  }

  // The two tensions, from each preference to the one facing it.
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

  // The middle score, where an even spread puts every point.
  const middle = at(160, RADIUS / 2 + 4);
  root.append(
    svg('circle', { class: 'even-ring', attrs: { cx: CX, cy: CY, r: RADIUS / 2 } }),
    svg('text', {
      class: 'even-label',
      text: options.middleLabel,
      attrs: { x: middle.x + 6, y: middle.y + 10, 'text-anchor': 'start' },
    }),
  );

  // The cycle itself, and the direction it runs. One arrow between each
  // pair of neighbours — except where the marker stands between two.
  root.append(svg('circle', { class: 'ring', attrs: { cx: CX, cy: CY, r: RADIUS } }));
  for (const preference of PREFERENCES) {
    const bearing = (BEARING[preference] + 45) % 360;
    if (bearing === youBearing) continue;
    root.append(svg('path', { class: 'cycle-arrow', attrs: { d: arrowPath(bearing) } }));
  }

  // The profile: one point per preference, from the centre (last in every
  // set) to the ring (first in every set).
  const min = minScore(n);
  const span = maxScore(n) - min || 1;
  const vertices = PREFERENCES.map((preference) => ({
    preference,
    ...at(BEARING[preference], ((result.scores[preference] - min) / span) * RADIUS),
  }));
  root.append(
    svg('polygon', {
      class: 'kite',
      attrs: { points: vertices.map(({ x, y }) => `${x},${y}`).join(' ') },
    }),
  );
  for (const vertex of vertices) {
    const label = scoreLabel(vertex.preference, vertex);
    root.append(
      svg('circle', { class: 'kite-point', attrs: { cx: vertex.x, cy: vertex.y, r: 3.5 } }),
      svg('text', {
        class: 'score-label',
        text: String(result.scores[vertex.preference]),
        attrs: { x: label.x, y: label.y, 'text-anchor': label.anchor },
      }),
    );
  }

  // Names and steps, outside the ring at each compass point.
  for (const preference of PREFERENCES) {
    const info = instrument.preferences[preference];
    const layout = labelLayout(preference);
    root.append(
      svg('text', {
        class: `pref-label${highlighted.includes(preference) ? ' is-lead' : ''}`,
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

  // The marker: where to stand. Two concentric shapes so it stays visible
  // against any tint, and labelled, so it is not a coloured dot and
  // nothing else. Never at a balance point: see the guide, §3F5.
  const marker = youBearing === null ? { x: CX, y: CY } : at(youBearing, RADIUS);
  const label = markerLabel(youBearing);
  root.append(
    svg('circle', { class: 'marker-halo', attrs: { cx: marker.x, cy: marker.y, r: 12 } }),
    svg('circle', { class: 'marker', attrs: { cx: marker.x, cy: marker.y, r: 6.5 } }),
    svg('text', {
      class: 'marker-label',
      text: options.youLabel,
      attrs: { x: label.x, y: label.y, 'text-anchor': label.anchor },
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
