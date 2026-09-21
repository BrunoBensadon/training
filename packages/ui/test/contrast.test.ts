/**
 * The dark palette is new work — the site it is derived from has no dark
 * mode — so the contrast ratios written into tokens.css are checked rather
 * than asserted in a comment. If someone nudges a token, this fails.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const tokensCss = readFileSync(
  fileURLToPath(new URL('../styles/tokens.css', import.meta.url)),
  'utf8',
);

/** Pulls the custom properties out of the first block matching a selector. */
function palette(selector: string): Record<string, string> {
  const start = tokensCss.indexOf(selector);
  if (start === -1) throw new Error(`selector not found in tokens.css: ${selector}`);
  const open = tokensCss.indexOf('{', start);
  const close = tokensCss.indexOf('}', open);
  const body = tokensCss.slice(open + 1, close);
  const out: Record<string, string> = {};
  for (const match of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    out[match[1]!.trim()] = match[2]!.trim();
  }
  return out;
}

const light = palette(':root {');
const dark = palette(':root[data-theme="dark"]');

/**
 * Resolves a token the way the cascade does: a theme block only overrides
 * some tokens, the rest come from :root. Indirection (`var(--muted)`) is
 * then resolved against the theme, so a token defined once in :root still
 * picks up the theme's value.
 */
function resolve(tokens: Record<string, string>, name: string, depth = 0): string {
  if (depth > 8) throw new Error(`token indirection loops: ${name}`);
  const raw = tokens[name] ?? light[name];
  if (!raw) throw new Error(`token not defined: ${name}`);
  const indirect = /^var\((--[\w-]+)\)$/.exec(raw);
  if (indirect) return resolve(tokens, indirect[1]!, depth + 1);
  if (!/^#[0-9a-f]{6}$/i.test(raw)) {
    throw new Error(`token ${name} is not a plain hex colour: ${raw}`);
  }
  return raw;
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * `foreground on background, at least this ratio`.
 * 4.5 is AA for body text, 3 is AA for large text and for the borders that
 * identify a control (WCAG 1.4.11).
 */
const pairings: ReadonlyArray<[string, string, number]> = [
  ['--ink', '--paper', 7],
  ['--ink', '--paper-2', 7],
  ['--ink', '--paper-3', 7],
  ['--ink-soft', '--paper', 4.5],
  ['--ink-soft', '--paper-2', 4.5],
  ['--ink-soft', '--paper-3', 4.5],
  ['--muted', '--paper', 4.5],
  ['--muted', '--paper-2', 4.5],
  ['--muted', '--paper-3', 4.5],
  ['--accent', '--paper', 4.5],
  ['--accent', '--paper-2', 4.5],
  ['--accent', '--paper-3', 4.5],
  ['--accent-2', '--paper', 4.5],
  ['--control-on-fill', '--control-fill', 4.5],
  // The control border carries "this is something you can operate".
  ['--control-edge', '--paper', 3],
  ['--control-edge', '--paper-2', 3],
];

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme meets WCAG 2.1 AA', (themeName, tokens) => {
  it.each(pairings)('%s on %s clears %s:1', (fg, bg, minimum) => {
    const ratio = contrast(resolve(tokens, fg), resolve(tokens, bg));
    expect(
      ratio,
      `${themeName}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${minimum}:1`,
    ).toBeGreaterThanOrEqual(minimum);
  });
});

describe('the two themes stay comparable', () => {
  it('keeps the accent at a similar contrast rank in both themes', () => {
    const lightRatio = contrast(resolve(light, '--accent'), resolve(light, '--paper'));
    const darkRatio = contrast(resolve(dark, '--accent'), resolve(dark, '--paper'));
    // A layout that reads in one theme should read in the other; a big
    // gap here means the dark theme has drifted into being its own design.
    expect(Math.abs(lightRatio - darkRatio)).toBeLessThan(1.5);
  });

  it('derives dark from the warm palette rather than inverting to black', () => {
    const paper = resolve(dark, '--paper');
    const r = parseInt(paper.slice(1, 3), 16);
    const b = parseInt(paper.slice(5, 7), 16);
    expect(r, 'dark paper should stay warm (red channel above blue)').toBeGreaterThan(b);
    expect(luminance(paper), 'dark paper should not be pure black').toBeGreaterThan(0);
  });
});
