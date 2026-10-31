import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('./sim.mjs', import.meta.url), 'utf8').split('// ---- 1.')[0];
const L = await import('data:text/javascript,' + encodeURIComponent(src + '\nexport { administer, makeTheta, makeDelta, sortedIdx, f };'));
const N = 40000;
// Current app at 1cd74f5: activist=0, reflector=1, theorist=2, pragmatist=3; perceiving = (0+1)-(2+3); processing=(0+3)-(1+2)
function app(S) {
  const per = S[0] + S[1] - S[2] - S[3], pro = S[0] + S[3] - S[1] - S[2];
  const order = [0, 1, 2, 3].sort((a, b) => S[b] - S[a] || a - b);
  const close = order.filter((q) => S[order[0]] - S[q] <= 3).length > 1;
  let place;
  if (per === 0 && pro === 0) place = 'centre';
  else if (per === 0 || pro === 0) place = 'edge';
  else place = `Q${Math.sign(per)}${Math.sign(pro)}`;
  // does the named quadrant equal the top-scoring quadrant?
  const quadOf = { 'Q11': 0, 'Q1-1': 1, 'Q-1-1': 2, 'Q-11': 3 };
  return { place, close, quadIsTop: place.startsWith('Q') ? quadOf[place] === order[0] : null, top: order[0] };
}
for (const sigma of [0, 0.5, 0.7]) {
  const delta = L.makeDelta(6, 0.2);
  let q = 0, qNoClose = 0, qNoCloseDiff = 0, qNoCloseOpp = 0, mismatch = 0, close = 0;
  for (let i = 0; i < N; i++) {
    const th = L.makeTheta(sigma, 'independent');
    const a = app(L.administer(th, delta, 'rank')), b = app(L.administer(th, delta, 'rank'));
    if (a.close) close++;
    if (a.place.startsWith('Q')) {
      q++;
      if (a.quadIsTop === false) mismatch++;
      if (!a.close) {
        qNoClose++;
        if (b.place.startsWith('Q') && b.place !== a.place) qNoCloseDiff++;
      }
    }
  }
  console.log(`sigma=${sigma}: P(quadrant)=${L.f(q / N)} P(close-call shown)=${L.f(close / N)} P(quadrant named != top-scoring quadrant | quadrant)=${L.f(mismatch / q)} P(quadrant & no close-call)=${L.f(qNoClose / N)} P(other quadrant on retest | quadrant, no close-call)=${L.f(qNoCloseDiff / qNoClose)}`);
}
