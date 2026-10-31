// @vitest-environment jsdom
/**
 * The diagram's orientation, pinned.
 *
 * The first version drew the four preferences as quadrants — Activist
 * north-east, Reflector north-west, Theorist south-west, Pragmatist
 * south-east. They are stages of the cycle and belong at its compass
 * points, running clockwise. This reads positions out of the rendered SVG
 * so the picture cannot drift back without a test failing.
 */
import { describe, expect, it } from 'vitest';
import { resultCircle } from '../src/circle.ts';
import type { Instrument } from '../src/instrument.ts';
import { PREFERENCES, type Preference, type Ranking, type Responses } from '../src/model.ts';
import { scoreResponses } from '../src/scoring.ts';

const NAMES: Record<Preference, string> = {
  active: 'Active',
  reflective: 'Reflective',
  theorist: 'Theorist',
  pragmatist: 'Pragmatist',
};

const instrument: Instrument = {
  version: 'test',
  instruction: '',
  sets: [],
  preferences: Object.fromEntries(
    PREFERENCES.map((preference) => [
      preference,
      { name: NAMES[preference], stage: '', step: preference, short: '', description: '' },
    ]),
  ) as Instrument['preferences'],
  axes: {
    perceiving: { name: 'Perceiving', positiveDescription: '', negativeDescription: '' },
    processing: { name: 'Processing', positiveDescription: '', negativeDescription: '' },
  },
};

function rank(active: number, reflective: number, theorist: number, pragmatist: number): Ranking {
  return { active, reflective, theorist, pragmatist };
}

function draw(responses: Responses): SVGSVGElement {
  return resultCircle({
    result: scoreResponses(responses),
    instrument,
    setCount: responses.length,
    titleText: 'title',
    descriptionText: 'description',
    youLabel: 'You',
  });
}

function centreOf(svg: SVGSVGElement): { x: number; y: number } {
  const ring = svg.querySelector('circle.ring')!;
  return { x: Number(ring.getAttribute('cx')), y: Number(ring.getAttribute('cy')) };
}

function labelPosition(svg: SVGSVGElement, name: string): { x: number; y: number } {
  const label = [...svg.querySelectorAll('text.pref-label')].find((node) => node.textContent === name);
  if (!label) throw new Error(`no label ${name}`);
  return { x: Number(label.getAttribute('x')), y: Number(label.getAttribute('y')) };
}

const sixTimes = (ranking: Ranking): Responses => Array.from({ length: 6 }, () => ({ ...ranking }));

describe('the result circle', () => {
  it('puts Active north, Reflective east, Theorist south and Pragmatist west', () => {
    const svg = draw(sixTimes(rank(1, 2, 3, 4)));
    const centre = centreOf(svg);

    const active = labelPosition(svg, 'Active');
    expect(active.x).toBe(centre.x);
    expect(active.y).toBeLessThan(centre.y);

    const reflective = labelPosition(svg, 'Reflective');
    expect(reflective.x).toBeGreaterThan(centre.x);

    const theorist = labelPosition(svg, 'Theorist');
    expect(theorist.x).toBe(centre.x);
    expect(theorist.y).toBeGreaterThan(centre.y);

    const pragmatist = labelPosition(svg, 'Pragmatist');
    expect(pragmatist.x).toBeLessThan(centre.x);
  });

  it('draws the four scores as a kite, each point on its own spoke', () => {
    // Active 24, Reflective 18, Theorist 12, Pragmatist 6.
    const svg = draw(sixTimes(rank(1, 2, 3, 4)));
    const centre = centreOf(svg);
    const points = svg
      .querySelector('polygon.kite')!
      .getAttribute('points')!
      .split(' ')
      .map((pair) => pair.split(',').map(Number) as [number, number]);
    expect(points).toHaveLength(4);

    const [north, east, south, west] = points as [
      [number, number],
      [number, number],
      [number, number],
      [number, number],
    ];
    // On the spokes.
    expect(north[0]).toBeCloseTo(centre.x);
    expect(east[1]).toBeCloseTo(centre.y);
    expect(south[0]).toBeCloseTo(centre.x);
    expect(west[1]).toBeCloseTo(centre.y);
    // Further out for a higher score.
    const reach = (x: number, y: number): number => Math.hypot(x - centre.x, y - centre.y);
    expect(reach(...north)).toBeGreaterThan(reach(...east));
    expect(reach(...east)).toBeGreaterThan(reach(...south));
    expect(reach(...south)).toBeGreaterThan(reach(...west));
  });

  it('marks "You" at the top for an Active result, and shades only that part', () => {
    const svg = draw(sixTimes(rank(1, 2, 3, 4)));
    const centre = centreOf(svg);
    const marker = svg.querySelector('circle.marker')!;
    expect(Number(marker.getAttribute('cx'))).toBeCloseTo(centre.x);
    expect(Number(marker.getAttribute('cy'))).toBeLessThan(centre.y);

    const shaded = [...svg.querySelectorAll('path.sector-lead')].map((node) =>
      node.getAttribute('data-preference'),
    );
    expect(shaded).toEqual(['active']);
  });

  it('marks "You" in the middle when no single part fits', () => {
    // Active and Theorist level at the top: opposite each other.
    const svg = draw([rank(1, 3, 2, 4), rank(2, 4, 1, 3)]);
    const centre = centreOf(svg);
    const marker = svg.querySelector('circle.marker')!;
    expect(Number(marker.getAttribute('cx'))).toBe(centre.x);
    expect(Number(marker.getAttribute('cy'))).toBe(centre.y);
    expect(svg.querySelectorAll('path.sector-lead')).toHaveLength(0);
  });

  it('shows the cycle running clockwise, with one arrow between each pair of neighbours', () => {
    const svg = draw(sixTimes(rank(1, 2, 3, 4)));
    expect(svg.querySelectorAll('path.cycle-arrow')).toHaveLength(4);
  });
});
