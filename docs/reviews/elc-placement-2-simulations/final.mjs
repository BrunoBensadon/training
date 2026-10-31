import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('./sim.mjs', import.meta.url), 'utf8').split('// ---- 1.')[0];
const L = await import('data:text/javascript,' + encodeURIComponent(src + '\nexport { administer, makeTheta, makeDelta, f };'));
const N = 40000;
const ADJ = (a, b) => (a + 1) % 4 === b || (b + 1) % 4 === a;
// Exact recommended rule (spec section D), canonical tie order for display only.
function classify(S, n) {
  const tau = Math.ceil(2 * Math.sqrt(n)), tau2 = Math.ceil(Math.sqrt(n));
  const o = [0, 1, 2, 3].sort((a, b) => S[b] - S[a] || a - b);
  const [s1, s2, s3, s4] = o.map((p) => S[p]);
  const W = S.reduce((acc, s) => acc + (s - 2.5 * n) ** 2, 0) / (5 * n * n);
  const consistent = 3 * n * W >= 7.815;
  const low = s3 - s4 >= tau ? o[3] : null;
  if (s1 - s2 >= tau) return { k: 'point', a: o[0], low, consistent };
  if (s2 - s3 >= tau2) {
    if (ADJ(o[0], o[1])) return { k: 'between', a: Math.min(o[0], o[1]), b: Math.max(o[0], o[1]), low, consistent };
    return { k: 'centre-opposite', a: Math.min(o[0], o[1]), b: Math.max(o[0], o[1]), low, consistent };
  }
  return { k: 'centre-spread', low, consistent };
}
const pos = (c) => (c.k === 'point' ? `P${c.a}` : c.k === 'between' ? `B${c.a}${c.b}` : 'C');
const cards = (c) => (c.k === 'point' ? [c.a] : c.k === 'between' ? [c.a, c.b] : []);
console.log('n | sigma | point | between | centre-opp | centre-spread | spread&inconsistent(W) | clearLow | same position | neighbour-or-same | gross | point->same point | point->other point');
for (const n of [12, 16]) for (const sigma of [0, 0.35, 0.5, 0.7]) {
  const delta = L.makeDelta(n, 0.2);
  const c = { point: 0, between: 0, 'centre-opposite': 0, 'centre-spread': 0 };
  let incons = 0, low = 0, same = 0, near = 0, gross = 0, pp = 0, pSame = 0, pOther = 0;
  for (let i = 0; i < N; i++) {
    const th = L.makeTheta(sigma, 'independent');
    const a = classify(L.administer(th, delta, 'rank'), n), b = classify(L.administer(th, delta, 'rank'), n);
    c[a.k]++;
    if (a.k === 'centre-spread' && !a.consistent) incons++;
    if (a.low !== null) low++;
    if (pos(a) === pos(b)) same++;
    const ca = cards(a), cb = cards(b);
    const isGross = ca.length && cb.length && !ca.some((x) => cb.includes(x));
    if (isGross) gross++; else near++;
    if (a.k === 'point') { pp++; if (b.k === 'point' && b.a === a.a) pSame++; if (b.k === 'point' && b.a !== a.a) pOther++; }
  }
  console.log([n, sigma, ...Object.values(c).map((v) => L.f(v / N)), L.f(incons / N), L.f(low / N), L.f(same / N), L.f(near / N), L.f(gross / N), L.f(pSame / pp), L.f(pOther / pp)].join(' | '));
}
