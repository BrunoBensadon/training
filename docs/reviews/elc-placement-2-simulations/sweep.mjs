// Re-uses sim.mjs functions by import trick: copy the module text minus its top-level report.
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('./sim.mjs', import.meta.url), 'utf8').split('// ---- 1.')[0];
const mod = await import('data:text/javascript,' + encodeURIComponent(src + '\nexport { run, f };'));
const { run, f } = mod;
const which = process.argv[2] ?? 'sweep';
if (which === 'sweep') {
  for (const n of [6, 12, 16]) {
    const taus = Array.from({ length: 16 }, (_, i) => i + 1);
    for (const sigma of [0, 0.35, 0.5, 0.7]) {
      const r = run({ n, sigma, taus });
      console.log(`\n## n=${n} sigma=${sigma}  (P same top overall ${f(r.pSameTop)})`);
      console.log('tau | P(clear) | P(same top | clear) | P(clear elsewhere on retest | clear) | P(true top | clear)');
      for (const s of r.sweep) console.log([s.tau, f(s.pClear), f(s.pSameTopGivenClear), f(s.pClearOtherPointOnRetest), f(s.pTrueTopGivenClear)].join(' | '));
    }
  }
}
if (which === 'format') {
  for (const format of ['rank', 'mole']) for (const model of ['independent', 'bipolar']) for (const sigma of [0.5, 0.7]) for (const n of [6, 12, 16]) {
    const r = run({ n, sigma, model, format });
    console.log([format, model, sigma, n, 'r', f(r.rScore), 'rY', f(r.rY), 'sameTop', f(r.pSameTop), 'tie', f(r.pTopTie), 'trueTop', f(r.pTopIsTrueTop)].join(' '));
  }
}
if (which === 'bias') {
  // Active statements systematically less attractive (author's own suspicion), all persons with no true difference in mean
  for (const shiftA of [0, -0.15, -0.3]) for (const sigma of [0, 0.5]) {
    const r = run({ n: 12, sigma, shift: [shiftA, 0, 0, 0] });
    console.log(`shiftA=${shiftA} sigma=${sigma} share at A,R,T,P = ${r.topShare.join(', ')}`);
  }
}
