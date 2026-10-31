import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('./sim.mjs', import.meta.url), 'utf8').split('// ---- 1.')[0];
const L = await import('data:text/javascript,' + encodeURIComponent(src + '\nexport { administer, makeTheta, makeDelta, sortedIdx, placement, key, gross, f };'));
const N = 30000;

// Balance-point (Kolb-style two-difference) placement for comparison:
// y = A - T (north positive), x = P - R (west positive). Nine positions like the KLSI 4.0 grid.
function balancePlace(S, rho, kappa) {
  const y = S[0] - S[2], x = S[3] - S[1];
  if (Math.max(Math.abs(x), Math.abs(y)) < rho) return { kind: 'centre' };
  const vert = y >= 0 ? 0 : 2, hor = x >= 0 ? 3 : 1;
  if (Math.abs(y) - Math.abs(x) >= kappa) return { kind: 'point', a: vert };
  if (Math.abs(x) - Math.abs(y) >= kappa) return { kind: 'point', a: hor };
  return { kind: 'arc', a: Math.min(vert, hor), b: Math.max(vert, hor) };
}

function evaluate(n, sigma, model, placer) {
  const delta = L.makeDelta(n, 0.2);
  let same = 0, grossN = 0, pointSame = 0, points = 0;
  const dist = { point: 0, arc: 0, centre: 0 };
  for (let i = 0; i < N; i++) {
    const th = L.makeTheta(sigma, model);
    const S1 = L.administer(th, delta, 'rank'), S2 = L.administer(th, delta, 'rank');
    const p1 = placer(S1), p2 = placer(S2);
    dist[p1.kind]++;
    if (L.key(p1) === L.key(p2)) same++;
    if (L.gross(p1, p2)) grossN++;
    if (p1.kind === 'point') { points++; if (p2.kind === 'point' && p2.a === p1.a) pointSame++; }
  }
  return { same: same / N, gross: grossN / N, point: dist.point / N, arc: dist.arc / N, centre: dist.centre / N, pointKeptAsPoint: pointSame / points };
}

console.log('rule | n | sigma | model | P(point) | P(arc) | P(centre) | P(same position on retest) | P(gross disagreement) | P(point kept same point)');
for (const model of ['independent', 'bipolar']) for (const sigma of [0, 0.5, 0.7]) for (const n of [6, 12, 16]) {
  const tau = Math.ceil(2 * Math.sqrt(n));
  const rules = {
    [`dominant tau=${tau} tau2=${tau}`]: (S) => L.placement(S, tau, tau),
    [`dominant tau=${tau} tau2=${Math.ceil(tau / 2)}`]: (S) => L.placement(S, tau, Math.ceil(tau / 2)),
    [`balance rho=${tau} kappa=${tau}`]: (S) => balancePlace(S, tau, tau),
  };
  for (const [name, placer] of Object.entries(rules)) {
    const r = evaluate(n, sigma, model, placer);
    console.log([name, n, sigma, model, L.f(r.point), L.f(r.arc), L.f(r.centre), L.f(r.same), L.f(r.gross), L.f(r.pointKeptAsPoint)].join(' | '));
  }
}
