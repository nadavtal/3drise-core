import { bakeTrack, expandStagger, compileExpr, noise1d, orderStagger } from '../src/animations/trackGenerators';

let fails = 0;
const ok = (cond: boolean, msg: string) => { if (!cond) { fails++; console.log('FAIL', msg); } else console.log('ok  ', msg); };
const near = (a: number, b: number, eps = 1e-3) => Math.abs(a - b) <= eps;
let n = 0; const makeId = () => `k${n++}`;

// tween
{
    const k = bakeTrack({ type: 'tween', to: 1 }, { duration: 2, base: 0, makeId });
    ok(k.length === 2 && k[0].t === 0 && k[0].value === 0 && k[0].ease === 'easeInOutCubic' && k[1].t === 2 && k[1].value === 1, 'tween basic');
    const y = bakeTrack({ type: 'tween', to: 1, cycles: 2, yoyo: true }, { duration: 2, base: 0, makeId });
    ok(y.map(x => x.value).join() === '0,1,0' && y[1].t === 1, 'tween yoyo 2 cycles');
    const r = bakeTrack({ type: 'tween', to: 1, cycles: 2 }, { duration: 2, base: 0, makeId });
    ok(r.map(x => x.value).join() === '0,1,0,1' && r[1].ease === 'step' && near(r[1].t, 0.99), 'tween repeat lands on `to` before restart');
    const c = bakeTrack({ type: 'tween', to: '#ffffff' }, { duration: 1, base: '#000000', makeId });
    ok(c[1].value === '#ffffff', 'tween colour');
    const v = bakeTrack({ type: 'tween', from: [0, 0, 0], to: [1, 2, 3], ease: 'easeOutBack' }, { duration: 1, base: [9, 9, 9], makeId });
    ok(JSON.stringify(v[0].value) === '[0,0,0]' && v[0].ease === 'easeOutBack', 'tween from overrides base, vector');
    const b = bakeTrack({ type: 'tween', to: true }, { duration: 1, base: false, makeId });
    ok(b[0].value === false && b[0].ease === 'step' && b[1].value === true, 'tween boolean = step');
    ok(bakeTrack({ type: 'tween' }, { duration: 1, base: 0 }).length === 0, 'tween without `to` → []');
    const into = bakeTrack({ type: 'tween', from: [0.001, 0.001, 0.001] }, { duration: 1, base: [2, 2, 2], makeId });
    ok(JSON.stringify(into[0].value) === '[0.001,0.001,0.001]' && JSON.stringify(into[1].value) === '[2,2,2]', 'tween from + to:null → into the authored value');
}
// pulse
{
    const k = bakeTrack({ type: 'pulse', to: 2, cycles: 3 }, { duration: 3, base: 1, makeId });
    ok(k.length === 7 && k[1].value === 2 && near(k[1].t, 0.5) && k[6].value === 1 && k[6].t === 3, 'pulse 3 cycles');
}
// spin
{
    const k = bakeTrack({ type: 'spin', period: 2 }, { duration: 4, base: [0, 0.5, 0], makeId });
    ok(k.length === 2 && k[0].ease === 'linear' && near((k[1].value as number[])[1], 0.5 + 4 * Math.PI), 'spin y 2 revolutions');
    const x = bakeTrack({ type: 'spin', axis: 'x', cycles: 1 }, { duration: 1, base: [0, 0, 0], makeId });
    ok(near((x[1].value as number[])[0], 2 * Math.PI), 'spin axis x by cycles');
}
// oscillate
{
    const k = bakeTrack({ type: 'oscillate', amp: [0, 0.5, 0], freq: 1 }, { duration: 1, base: [1, 2, 3], makeId });
    ok(k.length === 21 && k[0].ease === 'linear' && k[20].ease === undefined, 'oscillate 20Hz samples, last key no ease');
    const v5 = k[5].value as number[];
    ok(near(v5[0], 1) && near(v5[1], 2.5) && near(v5[2], 3), 'oscillate peak at quarter period, other axes still');
    const s = bakeTrack({ type: 'oscillate', amp: 1, cycles: 2 }, { duration: 4, base: 0, makeId });
    ok(near(s[Math.round(s.length * 0.125)].value as number, 1, 0.05), 'oscillate cycles → freq');
    const w = bakeTrack({ type: 'oscillate', amp: 1, start: 1, end: 2 }, { duration: 4, base: 0, makeId });
    ok(w[0].t === 1 && w[w.length - 1].t === 2, 'oscillate window');
    const cap = bakeTrack({ type: 'oscillate', amp: 1 }, { duration: 100, base: 0, makeId, maxKeys: 50 });
    ok(cap.length === 50, 'maxKeys cap');
}
// orbit
{
    const k = bakeTrack({ type: 'orbit', period: 4 }, { duration: 4, base: [3, 1, 0], sceneCenter: [0, 0, 0], makeId });
    const first = k[0].value as number[], q = k[20].value as number[];
    ok(near(first[0], 3) && near(first[2], 0) && near(first[1], 1), 'orbit starts where the object is');
    ok(near(q[0], 0) && near(q[2], 3) && near(q[1], 1), 'orbit quarter turn, keeps height');
    const t = bakeTrack({ type: 'orbit', period: 4, tilt: 0.5 }, { duration: 1, base: [2, 0, 0], makeId });
    ok(near((t[20].value as number[])[1], 1), 'orbit tilt bobs by tilt*radius');
    const t2 = bakeTrack({ type: 'orbit', period: 4, tilt: 0.5 }, { duration: 1, base: [0, 2, 6], makeId });
    ok(near((t2[0].value as number[])[1], 2) && near((t2[20].value as number[])[1], 5), 'orbit tilt is zero at the start angle');
    ok(bakeTrack({ type: 'orbit' }, { duration: 1, base: 1 }).length === 0, 'orbit on scalar → []');
}
// noise
{
    const a = noise1d(1.3, 7, 2), b = noise1d(1.3, 7, 2), c = noise1d(1.3, 8, 2);
    ok(a === b && a !== c && Math.abs(a) <= 1, 'noise deterministic by seed, bounded');
    const k = bakeTrack({ type: 'noise', amp: 0.1, seed: 3 }, { duration: 2, base: [0, 0, 0], makeId });
    ok(k.every(x => (x.value as number[]).every(v => Math.abs(v) <= 0.1)), 'noise amplitude bound');
    const i0 = bakeTrack({ type: 'noise', amp: 1, seed: 3 }, { duration: 1, base: 0, i: 0, makeId });
    const i1 = bakeTrack({ type: 'noise', amp: 1, seed: 3 }, { duration: 1, base: 0, i: 1, makeId });
    ok(i0[3].value !== i1[3].value, 'noise differs per stagger index');
}
// expr
{
    const f = compileExpr('base + 2*sin(PI/2) - -1 + 2^3 + clamp(5,0,1) + mod(7,3) + lerp(0,10,0.5)');
    ok(near(f({ base: 1 }), 1 + 2 + 1 + 8 + 1 + 1 + 5), 'expr arithmetic & functions');
    let threw = false; try { compileExpr('foo(1)'); } catch { threw = true; } ok(threw, 'expr unknown function throws');
    threw = false; try { compileExpr('1 +'); } catch { threw = true; } ok(threw, 'expr syntax error throws');
    threw = false; try { compileExpr('window.x'); } catch { threw = true; } ok(threw, 'expr rejects dots');
    threw = false; try { compileExpr('a')({}); } catch { threw = true; } ok(threw, 'expr unknown variable throws at eval');
    ok(compileExpr('1/0')({}) === 0, 'expr divide by zero → 0');
    const k = bakeTrack({ type: 'expr', expr: 'base + k + i' }, { duration: 1, base: [0, 0, 0], i: 2, makeId });
    ok(JSON.stringify(k[0].value) === '[2,3,4]', 'expr per component k and i');
    const u = bakeTrack({ type: 'expr', expr: 'u' }, { duration: 2, base: 0, makeId });
    ok(near(u[u.length - 1].value as number, 1) && near(u[0].value as number, 0), 'expr u 0..1');
}
// stagger
{
    const objects = {
        a: { id: 'a', position: [0, 0, 0], base: 1 },
        b: { id: 'b', position: [2, 0, 0], base: 1 },
        c: { id: 'c', position: [1, 0, 0], base: 1 },
    };
    const spec = { targets: ['a', 'b', 'c', 'zzz'], offset: 0.1, order: 'byX' as const, track: { path: 'meshSettings.scale', gen: { type: 'tween' as const, to: 2 } } };
    const tr = expandStagger(spec, objects, { duration: 1, makeId });
    ok(tr.map(t => t.state).join() === 'a,c,b', 'stagger byX, unknown dropped');
    ok(tr[2].keys[0].t === 0.2 && tr[2].keys[1].t === 1.2, 'stagger shift by index*offset');
    const d = orderStagger({ ...spec, order: 'distanceFrom', origin: [2, 0, 0] }, objects);
    ok(d.join() === 'b,c,a', 'stagger distanceFrom');
    const r1 = orderStagger({ ...spec, order: 'random', seed: 5 }, objects), r2 = orderStagger({ ...spec, order: 'random', seed: 5 }, objects);
    ok(r1.join() === r2.join() && r1.length === 3, 'stagger random deterministic');
    const keys = expandStagger({ ...spec, track: { path: 'p', keys: [{ id: 'x', t: 0, value: 0 }, { id: 'y', t: 1, value: 1 }] } }, objects, { duration: 1, makeId });
    ok(keys[1].keys[0].id !== 'x' && keys[1].keys[1].t === 1.1, 'stagger key template cloned with fresh ids');
}

console.log(fails ? `\n${fails} FAILED` : '\nall passed');
process.exit(fails ? 1 : 0);
