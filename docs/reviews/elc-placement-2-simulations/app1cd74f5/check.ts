import { scoreResponses } from './scoring.ts';
const sets: Array<[number, number, number, number]> = [[1,3,4,2],[3,1,4,2],[3,2,4,1],[1,3,4,2],[2,3,4,1],[4,2,3,1]];
const r = scoreResponses(sets.map(([activist, reflector, theorist, pragmatist]) => ({ activist, reflector, theorist, pragmatist })), 6);
console.log(JSON.stringify({ scores: r.scores, axes: r.axes, placement: r.placement, order: r.order, closeCall: r.closeCall }));
