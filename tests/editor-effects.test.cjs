const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const ts = require('typescript');
const cache = new Map();
function load(file) {
  const resolved = path.resolve(__dirname, '..', file);
  if (cache.has(resolved)) return cache.get(resolved);
  const exports = {};
  cache.set(resolved, exports);
  const js = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function('exports', 'require', js)(exports, name => name.startsWith('.') ? load(path.resolve(path.dirname(resolved), name + '.ts')) : require(name));
  return exports;
}
const { useEditorStore: store, clearEditorHistory } = load('app/text-behind-image/_lib/editor-store.ts');
const { defaultEffects, hasEffects } = load('app/text-behind-image/_lib/image-effects.ts');

test('background and subject effects are independent, resettable and undoable', () => {
  store.getState().resetDocument(); clearEditorHistory();
  store.getState().updateEffects('background', { brightness: -35, blur: 8 });
  assert.deepEqual(store.getState().effects.subject, defaultEffects());
  assert.equal(hasEffects(store.getState().effects.background), true);
  store.getState().updateEffects('subject', { sepia: true });
  store.temporal.getState().undo();
  assert.equal(store.getState().effects.subject.sepia, false);
  assert.equal(store.getState().effects.background.brightness, -35);
  store.temporal.getState().redo();
  assert.equal(store.getState().effects.subject.sepia, true);
  store.getState().resetEffects('background');
  assert.deepEqual(store.getState().effects.background, defaultEffects());
  assert.equal(store.getState().effects.subject.sepia, true);
  store.temporal.getState().undo();
  assert.equal(store.getState().effects.background.blur, 8);
});

test('knockout duplicates correctly, moves to normal on bring forward, and restores on undo', () => {
  store.getState().resetDocument(); clearEditorHistory();
  store.getState().addTextLayer();
  const id = store.getState().textLayers[0].id;
  store.getState().updateTextLayer(id, { textEffect: 'knockout', placement: 'behind', outlineWidth: 3 });
  store.getState().duplicateTextLayer(store.getState().textLayers[0]);
  assert.equal(store.getState().textLayers[1].textEffect, 'knockout');
  assert.equal(store.getState().textLayers[1].outlineWidth, 3);
  store.getState().bringLayerToFront('text', id);
  assert.equal(store.getState().textLayers[0].textEffect, 'normal');
  assert.equal(store.getState().textLayers[0].placement, 'front');
  store.temporal.getState().undo();
  assert.equal(store.getState().textLayers[0].textEffect, 'knockout');
  store.getState().sendLayerBehind('text', id);
  assert.equal(store.getState().textLayers[0].textEffect, 'behind');
  store.getState().resetDocument();
  assert.deepEqual(store.getState().effects, { background: defaultEffects(), subject: defaultEffects() });
});
