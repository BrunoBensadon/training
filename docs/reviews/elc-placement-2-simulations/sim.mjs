// Monte Carlo precision study for a 4-preference forced-choice (ipsative) instrument.
// Thurstonian response model: utility = theta_p + delta_bp + eps,  eps ~ N(0,1) per statement per occasion.
// Preferences: 0 = Active (CE, North), 1 = Reflective (RO, East), 2 = Theorist (AC, South), 3 = Pragmatist (AE, West).
// Usage: node sim.mjs [N]

const N = Number(process.env.SIM_N ?? 20000);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rand = mulberry32(20261031);
function normal() {
  let u = 0;
  while (u === 0) u = rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const ADJ = (a, b) => (a + 1) % 4 === b || (b + 1) % 4 === a;

/** Score one administration. format: 'rank' (4,3,2,1) or 'mole' (most=2, least=0, others=1). */
function administer(theta, delta, format) {
  const S = [0, 0, 0, 0];
  for (const d of delta) {
    const u = [0, 1, 2, 3].map((p) => theta[p] + d[p] + normal());
    const order = [0, 1, 2, 3].sort((a, b) => u[b] - u[a]);
    if (format === 'rank') {
      S[order[0]] += 4; S[order[1]] += 3; S[order[2]] += 2; S[order[3]] += 1;
    } else {
      S[order[0]] += 2; S[order[1]] += 1; S[order[2]] += 1; S[order[3]] += 0;
    }
  }
  return S;
}

function sortedIdx(S) {
  // random tie-break so ties are not silently biased
  const jitter = [rand(), rand(), rand(), rand()];
  return [0, 1, 2, 3].sort((a, b) => S[b] - S[a] || jitter[a] - jitter[b]);
}

/** Recommended placement. tau = clear-lead threshold, tau2 = pair-lead threshold. */
function placement(S, tau, tau2) {
  const o = sortedIdx(S);
  const [s1, s2, s3] = [S[o[0]], S[o[1]], S[o[2]]];
  if (s1 - s2 >= tau) return { kind: 'point', a: o[0] };
  if (s2 - s3 >= tau2 && ADJ(o[0], o[1])) {
    const a = Math.min(o[0], o[1]), b = Math.max(o[0], o[1]);
    return { kind: 'arc', a, b };
  }
  return { kind: 'centre' };
}
const key = (pl) => (pl.kind === 'point' ? `P${pl.a}` : pl.kind === 'arc' ? `A${pl.a}${pl.b}` : 'C');
function gross(p1, p2) {
  if (p1.kind === 'centre' || p2.kind === 'centre') return false;
  const set = (p) => (p.kind === 'point' ? [p.a] : [p.a, p.b]);
  const s1 = set(p1), s2 = set(p2);
  return !s1.some((x) => s2.includes(x));
}

/** Current (1cd74f5) quadrant model: pair sums, sign -> quadrant / edge / centre. Indices mapped
 * activist=0, reflector=1, theorist=2, pragmatist=3 (same structural roles as in the app). */
function quadrantKey(S) {
  const perceiving = S[0] + S[1] - S[2] - S[3];
  const processing = S[0] + S[3] - S[1] - S[2];
  return `${Math.sign(perceiving)},${Math.sign(processing)}`;
}

function corr(x, y) {
  const n = x.length;
  let mx = 0, my = 0;
  for (let i = 0; i < n; i++) { mx += x[i]; my += y[i]; }
  mx /= n; my /= n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx, b = y[i] - my;
    sxy += a * b; sxx += a * a; syy += b * b;
  }
  return sxy / Math.sqrt(sxx * syy);
}
const sd = (arr) => {
  const m = arr.reduce((s, v) => s + v, 0) / arr.length;
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
};

function makeTheta(sigma, model) {
  if (model === 'independent') return [0, 1, 2, 3].map(() => sigma * normal());
  // bipolar: CE vs AC and RO vs AE share an opposing component (corr -0.5 within pair)
  const g = normal(), t = normal(), w = Math.SQRT1_2;
  return [
    sigma * (-w * g + w * normal()),
    sigma * (-w * t + w * normal()),
    sigma * (w * g + w * normal()),
    sigma * (w * t + w * normal()),
  ];
}

function makeDelta(n, sdDelta, shift = [0, 0, 0, 0]) {
  return Array.from({ length: n }, () => [0, 1, 2, 3].map((p) => sdDelta * normal() + shift[p]));
}

function run({ n, sigma, model = 'independent', format = 'rank', sdDelta = 0.2, shift, taus = [], tau2 = null, pilotN = N }) {
  const delta = makeDelta(n, sdDelta, shift);
  const S1 = [], S2 = [], thetas = [];
  for (let i = 0; i < pilotN; i++) {
    const th = makeTheta(sigma, model);
    thetas.push(th);
    S1.push(administer(th, delta, format));
    S2.push(administer(th, delta, format));
  }
  const out = { n, sigma, model, format };
  // retest correlation of single preference scores and of the two difference scores
  const rs = [0, 1, 2, 3].map((p) => corr(S1.map((s) => s[p]), S2.map((s) => s[p])));
  out.rScore = rs.reduce((a, b) => a + b, 0) / 4;
  const yN = (S) => S[0] - S[2], xW = (S) => S[3] - S[1];
  out.rY = corr(S1.map(yN), S2.map(yN));
  out.rX = corr(S1.map(xW), S2.map(xW));
  // within-person SEM of a single preference score and of a difference between two preferences
  out.semScore = sd(S1.map((s, i) => s[0] - S2[i][0])) / Math.SQRT2;
  out.semDiff = sd(S1.map((s, i) => s[0] - s[1] - (S2[i][0] - S2[i][1]))) / Math.SQRT2;
  // top ties, same top on retest, validity
  let tie = 0, sameTop = 0, valid = 0;
  for (let i = 0; i < pilotN; i++) {
    const o1 = sortedIdx(S1[i]), o2 = sortedIdx(S2[i]);
    if (S1[i][o1[0]] === S1[i][o1[1]]) tie++;
    if (o1[0] === o2[0]) sameTop++;
    const tTop = [0, 1, 2, 3].reduce((b, p) => (thetas[i][p] > thetas[i][b] ? p : b), 0);
    if (o1[0] === tTop) valid++;
  }
  out.pTopTie = tie / pilotN;
  out.pSameTop = sameTop / pilotN;
  out.pTopIsTrueTop = valid / pilotN;
  // current quadrant model agreement (only meaningful as a comparison)
  let qSame = 0, qLine = 0;
  for (let i = 0; i < pilotN; i++) {
    const k1 = quadrantKey(S1[i]);
    if (k1.includes('0')) qLine++;
    if (k1 === quadrantKey(S2[i])) qSame++;
  }
  out.quadSame = qSame / pilotN;
  out.quadOnLineOrCentre = qLine / pilotN;
  // threshold sweep for "clear lead"
  out.sweep = taus.map((tau) => {
    let clear = 0, clearSame = 0, clearFlipClear = 0, clearValid = 0;
    for (let i = 0; i < pilotN; i++) {
      const o1 = sortedIdx(S1[i]);
      const L = S1[i][o1[0]] - S1[i][o1[1]];
      if (L < tau) continue;
      clear++;
      const o2 = sortedIdx(S2[i]);
      if (o2[0] === o1[0]) clearSame++;
      const L2 = S2[i][o2[0]] - S2[i][o2[1]];
      if (o2[0] !== o1[0] && L2 >= tau) clearFlipClear++;
      const tTop = [0, 1, 2, 3].reduce((b, p) => (thetas[i][p] > thetas[i][b] ? p : b), 0);
      if (o1[0] === tTop) clearValid++;
    }
    return {
      tau,
      pClear: clear / pilotN,
      pSameTopGivenClear: clear ? clearSame / clear : NaN,
      pClearOtherPointOnRetest: clear ? clearFlipClear / clear : NaN,
      pTrueTopGivenClear: clear ? clearValid / clear : NaN,
    };
  });
  // full placement rule agreement
  if (tau2 !== null) {
    out.placement = taus.map((tau) => {
      let same = 0, grossN = 0;
      const dist = {};
      for (let i = 0; i < pilotN; i++) {
        const p1 = placement(S1[i], tau, tau2), p2 = placement(S2[i], tau, tau2);
        dist[p1.kind] = (dist[p1.kind] ?? 0) + 1;
        if (key(p1) === key(p2)) same++;
        if (gross(p1, p2)) grossN++;
      }
      for (const k of Object.keys(dist)) dist[k] = +(dist[k] / pilotN).toFixed(3);
      return { tau, tau2, pSamePlace: same / pilotN, pGross: grossN / pilotN, dist };
    });
  }
  // share placed at each cardinal point (dominant preference, ties random)
  const share = [0, 0, 0, 0];
  for (let i = 0; i < pilotN; i++) share[sortedIdx(S1[i])[0]]++;
  out.topShare = share.map((v) => +(v / pilotN).toFixed(3));
  return out;
}

const f = (x, d = 3) => (Number.isFinite(x) ? x.toFixed(d) : 'NaN');

// ---- 1. Calibration: what does each signal level imply for retest r at 12 blocks?
console.log('# 1. Signal calibration (rank format, independent traits, item sd 0.2)');
console.log('sigma | n | r(score) | r(y=A-T) | SEM score | SEM diff | P(top tie) | P(same top) | P(top=true top) | quad same | quad on line');
for (const sigma of [0, 0.35, 0.5, 0.7, 1.0]) {
  for (const n of [6, 12, 16]) {
    const r = run({ n, sigma });
    console.log(
      [sigma, n, f(r.rScore), f(r.rY), f(r.semScore, 2), f(r.semDiff, 2), f(r.pTopTie), f(r.pSameTop), f(r.pTopIsTrueTop), f(r.quadSame), f(r.quadOnLineOrCentre)].join(' | '),
    );
  }
}
