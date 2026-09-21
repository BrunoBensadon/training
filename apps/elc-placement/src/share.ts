/**
 * Saving a result.
 *
 * The whole result is encoded into the URL **fragment**. A fragment is
 * never sent to a server — not to GitHub Pages, not to anything in front of
 * it — so a saved result is a string that lives only in whatever the
 * trainee chose to keep it in: a bookmark, a screenshot, a printout.
 *
 * There is no upload, no session code, no dashboard. A facilitator sees a
 * result because a trainee shows it to them.
 *
 * What gets encoded is the rank each quadrant received, not which statement
 * was picked. That has a useful consequence: rewording a statement does not
 * invalidate an existing link, because the link never referred to the
 * statement. Only a change to what the sets *mean* does, which is what the
 * items version is for.
 */
import { QUADRANTS, type Quadrant, type Ranking, type Responses } from './model.ts';

/** Bump when the encoding itself changes, not when items change. */
export const ENCODING_VERSION = 1;

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const PERMUTATION_COUNT = 24; // 4!

/**
 * A ranking is a permutation of 1–4 across four quadrants, so there are
 * only 24 of them and each fits in one character. Six sets become six
 * characters.
 */
export function permutationIndex(ranks: readonly number[]): number {
  const remaining = [1, 2, 3, 4];
  let index = 0;
  let factorial = 6; // 3!
  for (let position = 0; position < ranks.length; position += 1) {
    const at = remaining.indexOf(ranks[position]!);
    if (at === -1) throw new Error(`not a permutation of 1-4: ${ranks.join(',')}`);
    remaining.splice(at, 1);
    index += at * factorial;
    factorial /= Math.max(1, ranks.length - 1 - position);
  }
  return index;
}

export function permutationFromIndex(index: number): number[] {
  if (!Number.isInteger(index) || index < 0 || index >= PERMUTATION_COUNT) {
    throw new Error(`permutation index out of range: ${index}`);
  }
  const remaining = [1, 2, 3, 4];
  const out: number[] = [];
  let rest = index;
  let factorial = 6;
  for (let position = 0; position < 4; position += 1) {
    const at = Math.floor(rest / factorial);
    rest -= at * factorial;
    out.push(remaining.splice(at, 1)[0]!);
    factorial /= Math.max(1, 3 - position);
  }
  return out;
}

export function encodeResponses(responses: Responses, itemsVersion: string): string {
  const chars = responses.map((ranking) => {
    const ranks = QUADRANTS.map((quadrant) => ranking[quadrant]);
    return ALPHABET[permutationIndex(ranks)]!;
  });
  return `e${ENCODING_VERSION}:${itemsVersion}:${chars.join('')}`;
}

export type DecodeFailure =
  | { ok: false; reason: 'malformed' }
  | { ok: false; reason: 'unsupported-encoding'; found: string };

export type DecodeResult =
  | { ok: true; responses: Responses; itemsVersion: string }
  | DecodeFailure;

export function decodeResponses(encoded: string): DecodeResult {
  const match = /^e(\d+):([\w.-]+):([0-9a-z]+)$/.exec(encoded.trim());
  if (!match) return { ok: false, reason: 'malformed' };

  const [, version, itemsVersion, body] = match as unknown as [string, string, string, string];
  if (Number(version) !== ENCODING_VERSION) {
    return { ok: false, reason: 'unsupported-encoding', found: version };
  }

  const responses: Responses = [];
  for (const char of body) {
    const index = ALPHABET.indexOf(char);
    if (index < 0 || index >= PERMUTATION_COUNT) return { ok: false, reason: 'malformed' };
    const ranks = permutationFromIndex(index);
    responses.push(
      Object.fromEntries(
        QUADRANTS.map((quadrant, position) => [quadrant, ranks[position]!]),
      ) as Ranking,
    );
  }

  return { ok: true, responses, itemsVersion };
}

/** True when a saved link was made against a different edition of the items. */
export function itemsVersionMatches(saved: string, current: string): boolean {
  return saved === current;
}

export function quadrantAt(position: number): Quadrant {
  return QUADRANTS[position]!;
}
