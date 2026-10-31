// Reference implementation of guide §3D, used to verify the test vectors in §3D8.
const P = ['active', 'reflective', 'theorist', 'pragmatist'];
const adjacent = (a, b) => { const i = P.indexOf(a), j = P.indexOf(b); return (i + 1) % 4 === j || (j + 1) % 4 === i; };
function score(responses) { // responses: array of [rA, rR, rT, rP]
  const S = { active: 0, reflective: 0, theorist: 0, pragmatist: 0 };
  for (const r of responses) P.forEach((p, k) => (S[p] += 5 - r[k]));
  return S;
}
function classify(S, n) {
  const tau = Math.ceil(2 * Math.sqrt(n)), tau2 = Math.ceil(Math.sqrt(n));
  const o = [...P].sort((a, b) => S[b] - S[a] || P.indexOf(a) - P.indexOf(b));
  const [s1, s2, s3, s4] = o.map((p) => S[p]);
  const lowest = s3 - s4 >= tau ? o[3] : null;
  const y = S.active - S.theorist, x = S.pragmatist - S.reflective;
  const tension = (d, pos, neg) => (d >= tau ? pos : d <= -tau ? neg : 'even');
  const t = { y: tension(y, 'active', 'theorist'), x: tension(x, 'pragmatist', 'reflective') };
  let placement;
  if (s1 - s2 >= tau) placement = { kind: 'point', pref: o[0] };
  else if (s2 - s3 >= tau2) {
    const pair = [o[0], o[1]].sort((a, b) => P.indexOf(a) - P.indexOf(b));
    placement = adjacent(o[0], o[1]) ? { kind: 'between', pair } : { kind: 'opposite', pair };
  } else placement = { kind: 'spread' };
  return { tau, tau2, placement, lowest, tensions: t, scores: S };
}
const rep = (k, r) => Array.from({ length: k }, () => r);
const fromScores = (a, r, t, p) => ({ active: a, reflective: r, theorist: t, pragmatist: p });
const cases = {
  1: classify(score(rep(12, [1, 2, 3, 4])), 12),
  2: classify(score([...rep(3, [1, 2, 3, 4]), ...rep(3, [2, 3, 4, 1]), ...rep(3, [3, 4, 1, 2]), ...rep(3, [4, 1, 2, 3])]), 12),
  3: classify(score([...rep(6, [1, 2, 4, 3]), ...rep(6, [2, 1, 3, 4])]), 12),
  4: classify(score([...rep(6, [1, 3, 2, 4]), ...rep(6, [2, 4, 1, 3])]), 12),
  5: classify(fromScores(37, 30, 27, 26), 12),
  6: classify(fromScores(36, 30, 28, 26), 12),
  7: classify(fromScores(36, 31, 26, 27), 12),
  8: classify(fromScores(34, 26, 34, 26), 12),
  9: classify(fromScores(32, 32, 14, 42), 12),
};
for (const [k, v] of Object.entries(cases)) console.log(k, JSON.stringify({ scores: v.scores, placement: v.placement, lowest: v.lowest, tensions: v.tensions }));
// every permutation repeated 12 times -> point at rank-1, lowest at rank-4
const perms = []; (function g(r, t) { if (!r.length) return perms.push(t); r.forEach((v, i) => g([...r.slice(0, i), ...r.slice(i + 1)], [...t, v])); })([1, 2, 3, 4], []);
const ok = perms.every((perm) => { const c = classify(score(rep(12, perm)), 12); return c.placement.kind === 'point' && c.placement.pref === P[perm.indexOf(1)] && c.lowest === P[perm.indexOf(4)]; });
console.log('all 24 permutations x12 -> point at rank 1, lowest at rank 4:', ok);
console.log('thresholds n=6,12,16:', [6, 12, 16].map((n) => [Math.ceil(2 * Math.sqrt(n)), Math.ceil(Math.sqrt(n))]));
