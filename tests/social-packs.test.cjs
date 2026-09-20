const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(file) {
  const source = fs.readFileSync(require('node:path').join(__dirname, '..', file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const exports = {};
  new Function('exports', compiled.outputText)(exports);
  return exports;
}
const { createZip, crc32 } = load('app/social-packs/_lib/zip.ts');
const { wrapText, renderPack, FORMATS, THEMES } = load('app/social-packs/_lib/render-pack.ts');

test('ZIP contains readable local entries and a correct central directory', async () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
  const files = ['post', 'story', 'thumbnail'].map((name, index) => ({ name: `${name}.png`, bytes: new Uint8Array([137, 80, 78, 71, index]) }));
  const buffer = await createZip(files).arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let offset = 0;
  const offsets = [];
  for (const file of files) {
    offsets.push(offset);
    assert.equal(view.getUint32(offset, true), 0x04034b50);
    assert.equal(view.getUint32(offset + 14, true), crc32(file.bytes));
    const nameLength = view.getUint16(offset + 26, true);
    assert.equal(new TextDecoder().decode(bytes.slice(offset + 30, offset + 30 + nameLength)), file.name);
    assert.deepEqual(bytes.slice(offset + 30 + nameLength, offset + 30 + nameLength + file.bytes.length), file.bytes);
    offset += 30 + nameLength + file.bytes.length;
  }
  const directoryStart = offset;
  files.forEach((file, index) => {
    assert.equal(view.getUint32(offset, true), 0x02014b50);
    assert.equal(view.getUint32(offset + 42, true), offsets[index]);
    assert.equal(view.getUint32(offset + 16, true), crc32(file.bytes));
    offset += 46 + new TextEncoder().encode(file.name).length;
  });
  assert.equal(view.getUint32(offset, true), 0x06054b50);
  assert.equal(view.getUint16(offset + 10, true), 3);
  assert.equal(view.getUint32(offset + 16, true), directoryStart);
});

test('long headlines wrap without losing words or overflowing', () => {
  const ctx = { measureText: text => ({ width: [...text].length * 10 }) };
  for (const text of ['An ordinary headline with spaces', 'A'.repeat(90), 'A great launch 🎉 today']) {
    const lines = wrapText(ctx, text, 120);
    assert.ok(lines.every(line => ctx.measureText(line).width <= 120));
    assert.equal(lines.join('').replace(/\s/g, ''), text.replace(/\s/g, ''));
  }
});

test('all formats preserve photo aspect ratio and export exact dimensions', () => {
  for (const format of FORMATS) for (const dimensions of [[600, 1800], [2400, 800]]) for (const mode of ['fit', 'fill']) {
    let drawn;
    const ctx = { fillRect() {}, save() {}, beginPath() {}, rect() {}, clip() {}, restore() {}, fillText() {}, measureText: text => ({ width: text.length * 30 }), drawImage: (...args) => { drawn = args; } };
    const canvas = { getContext: () => ctx };
    renderPack(canvas, { naturalWidth: dimensions[0], naturalHeight: dimensions[1] }, format, THEMES[0], { headline: 'Example headline', detail: 'A detail', label: 'NEW', brand: '@brand' }, { mode, x: 50, y: 50 });
    assert.equal(canvas.width, format.width);
    assert.equal(canvas.height, format.height);
    assert.ok(Math.abs(drawn[3] / drawn[4] - dimensions[0] / dimensions[1]) < .0001);
  }
});
