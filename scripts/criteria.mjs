// Lists which acceptance criteria have tests, and which M0 exit criteria are covered.
// Run after the suites: node scripts/criteria.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const found = new Map();
for (const f of walk('tests')) {
  if (!/\.(test|spec)\.ts$/.test(f)) continue;
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/(test(?:\.fixme|\.skip)?)\(\s*[`'"]test_F(\d+)_AC(\d+)/g)) {
    const id = `F-${m[2]}.AC-${m[3]}`, parked = m[1] !== 'test';
    const e = found.get(id) || { files: new Set(), parked: false };
    e.files.add(f); e.parked ||= parked; found.set(id, e);
  }
}
// M0 exit check, SPEC.md section 13.
const M0 = ['F-1.AC-1', 'F-1.AC-2', 'F-1.AC-3', 'F-2.AC-1', 'F-2.AC-2', 'F-5.AC-1', 'F-5.AC-2', 'F-6.AC-1', 'F-6.AC-2', 'F-6.AC-3', 'F-7.AC-1', 'F-7.AC-2', 'F-7.AC-3', 'F-7.AC-4', 'F-20.AC-1', 'F-20.AC-3'];
console.log('\nM0 exit criteria');
for (const id of M0) { const e = found.get(id); console.log(`  ${!e ? 'MISSING' : e.parked ? 'PARKED ' : 'tested '}  ${id}`); }
// Milestone MD (SPEC.md D-18).
const MD = ['F-15.AC-6', 'F-19.AC-5'];
console.log('\nMD design criteria');
for (const id of MD) { const e = found.get(id); console.log(`  ${!e ? 'MISSING' : e.parked ? 'PARKED ' : 'tested '}  ${id}`); }
// Milestone MW (SPEC.md D-19).
const MW = ['F-22.AC-1', 'F-22.AC-2', 'F-22.AC-3', 'F-22.AC-4', 'F-22.AC-5', 'F-22.AC-6', 'F-22.AC-7'];
console.log('\nMW workbook criteria');
for (const id of MW) { const e = found.get(id); console.log(`  ${!e ? 'MISSING' : e.parked ? 'PARKED ' : 'tested '}  ${id}`); }
// Milestone MG (SPEC.md D-23).
const MG = ['F-23.AC-1', 'F-23.AC-2', 'F-23.AC-3', 'F-23.AC-4', 'F-23.AC-5', 'F-8.AC-4'];
console.log('\nMG grade-level criteria');
for (const id of MG) { const e = found.get(id); console.log(`  ${!e ? 'MISSING' : e.parked ? 'PARKED ' : 'tested '}  ${id}`); }
const extra = [...found.keys()].filter(k => ![...M0, ...MD, ...MW, ...MG].includes(k)).sort();
if (extra.length) console.log('Also tested: ' + extra.join(', '));
