// Mouse-move Self / Each / Targets: relative transform per target, follow-lag stagger,
// targets put back on rest when a row stops driving them.   npx tsx test/mouseMoveTargets.test.ts
import { Group, Mesh, BoxGeometry, MeshStandardMaterial } from 'three';
import { AnimationTargetState } from '../src/utils/animationTargets';
import { PointerHistory, handleTransformMouseMoveTargets, handleMaterialMouseMoveTargets, isTargetedMouseMove } from '../src/utils/mouseMoveTargets';
import type { MouseMoveProperty } from '../src/types/objectSettings';

let fails = 0;
const ok = (cond: boolean, msg: string) => { if (!cond) { fails++; console.log('FAIL', msg); } else console.log('ok  ', msg); };
const near = (a: number, b: number, eps = 1e-4) => Math.abs(a - b) <= eps;

function makeGroup() {
    const g = new Group(); g.userData = { id: 'g', objectType: 'group' };
    const kids = [0, 1, 2].map(i => {
        const m = new Mesh(new BoxGeometry(), new MeshStandardMaterial({ color: '#ff0000' }));
        m.userData = { id: `c${i}`, objectType: 'mesh', baseTransform: { position: [i * 2, 1, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } };
        m.position.set(i * 2, 1, 0);
        g.add(m);
        return m;
    });
    return { g, kids };
}
const row = (over: Partial<MouseMoveProperty> = {}): MouseMoveProperty => ({
    property: 'position', enabled: true,
    propertySettings: { axis: 'x', sensitivity: 1, inverted: false, min: [0, 0, 0], max: [0, 2, 0] },
    ...over,
});

// self rows are not targeted
{
    const { g } = makeGroup();
    ok(!isTargetedMouseMove(g, row()), 'no scope → self');
    ok(isTargetedMouseMove(g, row({ scope: 'each' })), 'each → targeted');
    ok(!isTargetedMouseMove(g, row({ scope: 'targets', targets: [] })), 'targets with none chosen → self');
}

// each: relative offset added to every child's own rest
{
    const { g, kids } = makeGroup();
    const st = new AnimationTargetState(g); const h = new PointerHistory();
    h.push(0, 1, 0);   // pointer at right edge → multiplier 1 → max
    st.beginFrame(); handleTransformMouseMoveTargets(st, [row({ scope: 'each' })], h, 0); st.endFrame();
    ok(kids.every((k, i) => near(k.position.x, i * 2) && near(k.position.y, 3)), 'each: y = rest 1 + offset 2, x kept');
    h.push(0.1, -1, 0);   // left edge → min
    st.beginFrame(); handleTransformMouseMoveTargets(st, [row({ scope: 'each' })], h, 0.1); st.endFrame();
    ok(kids.every(k => near(k.position.y, 1)), 'each: pointer left → back on rest + 0');
}

// targets: only chosen; scale multiplies
{
    const { g, kids } = makeGroup();
    const st = new AnimationTargetState(g); const h = new PointerHistory();
    h.push(0, 1, 0);
    const r = row({ property: 'scale', scope: 'targets', targets: [{ id: 'c1' }], propertySettings: { axis: 'x', sensitivity: 1, min: [1, 1, 1], max: [2, 2, 2] } });
    st.beginFrame(); handleTransformMouseMoveTargets(st, [r], h, 0); st.endFrame();
    ok(near(kids[1].scale.x, 2) && near(kids[0].scale.x, 1) && near(kids[2].scale.x, 1), 'targets: only c1 scaled ×2');
}

// follow lag: last target sees the pointer `total` seconds late
{
    const { g, kids } = makeGroup();
    const st = new AnimationTargetState(g); const h = new PointerHistory();
    const r = row({ scope: 'each', stagger: { order: 'tree', total: 1 } });
    h.push(0, -1, 0); h.push(1, 1, 0);   // pointer swept left → right over 1s
    st.beginFrame(); handleTransformMouseMoveTargets(st, [r], h, 1); st.endFrame();
    // delays 0, 0.5, 1 → pointer x 1, 0, -1 → offsets 2, 1, 0
    ok(near(kids[0].position.y, 3) && near(kids[1].position.y, 2) && near(kids[2].position.y, 1), 'lag: wave 3 / 2 / 1');
}

// a row switched off → its targets go back to rest
{
    const { g, kids } = makeGroup();
    const st = new AnimationTargetState(g); const h = new PointerHistory();
    h.push(0, 1, 0);
    st.beginFrame(); handleTransformMouseMoveTargets(st, [row({ scope: 'each' })], h, 0); st.endFrame();
    st.beginFrame(); handleTransformMouseMoveTargets(st, [row({ scope: 'each', enabled: false })], h, 0); st.endFrame();
    ok(kids.every(k => near(k.position.y, 1)), 'off: back on rest');
}

// material targets: absolute colour, only the chosen child
{
    const { g, kids } = makeGroup();
    const st = new AnimationTargetState(g); const h = new PointerHistory();
    h.push(0, 1, 0);
    const r = row({ property: 'color', scope: 'targets', targets: [{ id: 'c2' }], propertySettings: { axis: 'x', sensitivity: 1, min: '#000000', max: '#00ff00' } });
    st.beginFrame(); handleMaterialMouseMoveTargets(st, [r], h, 0); st.endFrame();
    const c2 = (kids[2].material as MeshStandardMaterial).color, c0 = (kids[0].material as MeshStandardMaterial).color;
    ok(near(c2.g, 1) && near(c2.r, 0) && near(c0.r, 1), 'material: c2 green, c0 untouched');
}

// pointer history interpolation
{
    const h = new PointerHistory(4); const o = { x: 0, y: 0 };
    h.push(0, 0, 0); h.push(1, 1, 1);
    h.sample(0.5, o); ok(near(o.x, 0.5), 'history: linear between samples');
    h.sample(5, o); ok(near(o.x, 1), 'history: newer than newest → newest');
    h.sample(-5, o); ok(near(o.x, 0), 'history: older than oldest → oldest');
    for (let i = 2; i < 10; i++) h.push(i, i, i);
    h.sample(0, o); ok(near(o.x, 6), 'history: ring keeps the last 4');
}

console.log(fails ? `\n${fails} FAILED` : '\nall passed');
process.exit(fails ? 1 : 0);
