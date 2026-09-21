const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require(process.env.COCOS_TYPESCRIPT || 'C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const code = fs.readFileSync(path.join(__dirname, '../assets/scripts/runner/RunnerModel.ts'), 'utf8');
const mod = { exports: {} };
new Function('exports', 'module', ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(mod.exports, mod);
const { RunnerModel, LANES } = mod.exports;
function fresh() { const r = new RunnerModel(); r.reset(1234); r.items = []; return r; }
function obstacle(r, y = 0, art = 'rock-pile') { r.items.push({ id: -1, x: 0, y, kind: 'obstacle', art, radius: 43, taken: false }); }
function advance(r, seconds) { for (let i = 0; i < Math.round(seconds * 60); i++) r.tick(1 / 60); }
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS ' + name); }
test('low obstacle can be cleared with a timed jump', () => {
  const r = fresh(); obstacle(r, 105); assert.equal(r.jump(), true); advance(r, 1);
  assert.equal(r.lives, 3); assert.equal(r.height, 0);
  assert.equal(r.events.filter(e => e.type === 'land').length, 1);
});
test('successful jump does not hit when landing past the obstacle', () => {
  const r = fresh(); obstacle(r, 200); assert.equal(r.jump(), true); advance(r, 1.2);
  assert.equal(r.lives, 3); assert.equal(r.height, 0);
  assert.equal(r.events.some(e => e.type === 'hit'), false);
});
test('slightly late jump still clears before the obstacle body', () => {
  const r = fresh(); obstacle(r, 80); assert.equal(r.jump(), true); advance(r, 1);
  assert.equal(r.lives, 3); assert.equal(r.events.some(e => e.type === 'hit'), false);
});
test('cart can be cleared without a landing hit', () => {
  const r = fresh(); obstacle(r, 150, 'cart'); assert.equal(r.jump(), true); advance(r, 1.2);
  assert.equal(r.lives, 3); assert.equal(r.events.some(e => e.type === 'hit'), false);
});
test('ground collision damages once and reduces weight', () => {
  const r = fresh(); r.weight = 50; obstacle(r); r.tick(1/60);
  assert.equal(r.lives, 2); assert.ok(r.weight < 43); r.tick(1/60); assert.equal(r.lives, 2);
});
test('late jump does not erase a ground collision', () => {
  const r = fresh(); obstacle(r); r.jump(); r.tick(1/60); assert.equal(r.lives, 2);
});
test('too-early jump still hits after landing on the obstacle', () => {
  const r = fresh(); r.jump(); advance(r, 1);
  obstacle(r, r.travel + 20); r.tick(1/60); assert.equal(r.lives, 2);
});
test('pause freezes airborne state and blocks controls/powers', () => {
  const r = fresh(); r.jump(); advance(r, 0.2); r.pause();
  const before = JSON.stringify(r); r.tick(1); r.move(1); assert.equal(r.jump(), false); assert.equal(r.use('boot'), false);
  assert.equal(JSON.stringify(r), before); r.resume(); advance(r, 0.8); assert.equal(r.height, 0);
});
test('no double jump; reset clears motion and power state', () => {
  const r = fresh(); r.jump(); assert.equal(r.jump(), false); advance(r, 0.2); r.use('boot'); r.reset(4);
  assert.equal(r.height, 0); assert.equal(r.weight, 12); assert.equal(r.powers.boot, 0); assert.equal(r.jump(), true);
});
test('shield consumes once while boot protects throughout its duration', () => {
  const r = fresh(); r.use('shield'); obstacle(r); r.tick(1/60); assert.equal(r.lives, 3); assert.equal(r.powers.shield, 0);
  const b = fresh(); b.use('boot'); obstacle(b); b.tick(1/60); assert.equal(b.lives, 3); assert.ok(b.powers.boot > 0);
});
test('fifty coins award the mission exactly once and grow the ball', () => {
  const r = fresh(); for (let i = 0; i < 51; i++) r.items.push({ id: -i-1, x:0, y:0, kind:'coin', art:'coin', radius:20, taken:false });
  r.tick(1/60); assert.equal(r.coins, 51); assert.equal(r.missionComplete, true); assert.equal(r.events.filter(e=>e.type==='mission').length, 1); assert.ok(r.ballScale > 1);
});
test('seeded generation always leaves a lane open in each obstacle row', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const r = new RunnerModel(); r.reset(seed); r.lives = 10000;
    for (let step = 0; step < 100; step++) {
      r.tick(0.1); const rows = new Map();
      for (const i of r.items.filter(i => i.kind === 'obstacle')) { if (!rows.has(i.y)) rows.set(i.y, new Set()); rows.get(i.y).add(i.x); }
      for (const xs of rows.values()) assert.ok(LANES.some(x => !xs.has(x)));
    }
  }
});
test('over state cannot move, jump, tick, or use a charge', () => {
  const r = fresh(); r.lives=1; obstacle(r); r.tick(1/60); assert.equal(r.state, 'over');
  const before=JSON.stringify(r); r.tick(1); r.move(1); r.jump(); r.use('magnet'); assert.equal(JSON.stringify(r), before);
});
console.log(`${checks} runner checks passed`);
