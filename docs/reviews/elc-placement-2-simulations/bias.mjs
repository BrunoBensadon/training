import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('./sim.mjs', import.meta.url), 'utf8').split('// ---- 1.')[0];
const { run, f } = await import('data:text/javascript,' + encodeURIComponent(src + '\nexport { run, f };'));
// Clean bias experiment: no random item noise, only a systematic shift on Active statements.
for (const sigma of [0.5, 0.7]) for (const shiftA of [0, -0.1, -0.2, -0.3]) {
  const r = run({ n: 12, sigma, sdDelta: 0, shift: [shiftA, 0, 0, 0] });
  // mean Active points per block (4..1 scale) -> mean rank = 5 - points
  console.log(`sigma=${sigma} shiftA=${shiftA}: top share A,R,T,P = ${r.topShare.join(', ')}`);
}
