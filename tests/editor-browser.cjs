// Browser smoke test with a synthetic photo/cutout. Requires `next dev -p 3100`.
// Seeds only the photo-loading state so the test doesn't depend on AI downloads.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'overlayit-browser-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let ws;
  try {
    let port;
    for (let attempt = 0; attempt < 100; attempt++) {
      try { port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; break; } catch { await sleep(100); }
    }
    if (!port) throw new Error('Chrome debugging did not start');
    const target = await (await fetch(`http://localhost:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
    let id = 0;
    const pending = new Map();
    ws.addEventListener('message', event => {
      const result = JSON.parse(event.data);
      if (pending.has(result.id)) { const callback = pending.get(result.id); pending.delete(result.id); result.error ? callback.reject(result.error) : callback.resolve(result.result); }
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => { const key = ++id; pending.set(key, { resolve, reject }); ws.send(JSON.stringify({ id: key, method, params })); });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    const until = async expression => { for (let i = 0; i < 120; i++) { if (await evaluate(expression)) return; await sleep(500); } throw new Error(`Timed out: ${expression}`); };
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://localhost:3100/text-behind-image' });
    await until(`!!document.querySelector('main') && Object.keys(document.querySelector('main')).some(k=>k.startsWith('__reactFiber'))`);
    await evaluate(`(() => {
      const main=document.querySelector('main'); let fiber=main[Object.keys(main).find(k=>k.startsWith('__reactFiber'))];
      while(fiber && !(fiber.memoizedState?.memoizedState === 'layers' && fiber.memoizedState?.queue?.dispatch)) fiber=fiber.return;
      if(!fiber) throw Error('Editor state not found');
      const photo=document.createElement('canvas');photo.width=800;photo.height=600;const ctx=photo.getContext('2d');
      ctx.fillStyle='#c84040';ctx.fillRect(0,0,800,600);ctx.fillStyle='#2863d8';ctx.fillRect(280,80,240,520);
      const original=photo.toDataURL();ctx.clearRect(0,0,800,600);ctx.fillStyle='#2863d8';ctx.fillRect(280,80,240,520);
      let hook=fiber.memoizedState.next;hook.queue.dispatch(original);hook=hook.next;hook.queue.dispatch(photo.toDataURL());hook.next.queue.dispatch('ready');
    })()`);
    await until(`!!document.querySelector('canvas') && [...document.querySelectorAll('button')].some(b=>b.textContent.includes('Export PNG')&&!b.disabled)`);
    await evaluate(`document.querySelector('[aria-label="Add text"]').click()`);
    await until(`!!document.querySelector('[aria-label="Text effect"]')`);
    const click = async text => { await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim().endsWith(${JSON.stringify(text)})).click()`); await sleep(150); };
    const whiteCounts = {};
    for (const mode of ['Normal', 'Behind', 'Knockout']) {
      await click(mode);
      await evaluate(`document.querySelector('[aria-label="Preview"]').click()`);
      await until(`!!document.querySelector('[role="dialog"] img')`);
      whiteCounts[mode] = await evaluate(`(async () => {const img=document.querySelector('[role="dialog"] img');await img.decode();const c=document.createElement('canvas');c.width=800;c.height=600;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const pixels=ctx.getImageData(285,220,230,160).data;let white=0;for(let i=0;i<pixels.length;i+=4){if(pixels[i]>220&&pixels[i+1]>220&&pixels[i+2]>220)white++;}return white;})()`);
      await evaluate(`document.querySelector('[aria-label="Close"]').click()`);
      await sleep(150);
    }
    assert.ok(whiteCounts.Normal > whiteCounts.Knockout, 'Normal must fill more of the subject than Knockout');
    assert.ok(whiteCounts.Knockout > whiteCounts.Behind, 'Knockout must leave visible outlines across the subject');
    assert.equal(whiteCounts.Behind, 0, 'Behind text must be hidden by the subject');
    console.log('PASS: Normal / Behind / Knockout exported pixels', whiteCounts);
    await click('Knockout');
    const dragStart = await evaluate(`(() => {const stage=window.Konva.stages[0];const text=stage.find('Text').find(n=>n.listening());const rect=stage.container().getBoundingClientRect();return {x:rect.left+text.x(),y:rect.top+text.y(),nodeX:text.x(),nodeY:text.y()};})()`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: dragStart.x, y: dragStart.y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: dragStart.x, y: dragStart.y, button: 'left', clickCount: 1 });
    for(let step=1;step<=5;step++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: dragStart.x+step*10, y: dragStart.y+step*6, buttons: 1 }); await sleep(40); }
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: dragStart.x+50, y: dragStart.y+30, button: 'left', clickCount: 1 });
    await sleep(200);
    const moved = await evaluate(`window.Konva.stages[0].find('Text').map(n=>({x:n.x(),y:n.y()}))`);
    assert.ok(moved.every(n=>Math.abs(n.x-dragStart.nodeX-50)<2&&Math.abs(n.y-dragStart.nodeY-30)<2), 'Both knockout text passes must follow a drag from the middle of the text');
    assert.equal(await evaluate(`document.querySelector('[aria-label="Editor tools"] [aria-label="Compare"]')===null`), true);
    console.log('PASS: Knockout drags from its interior; both text passes stay aligned; Compare removed from dock');
    await click('Effects');
    await until(`!!document.querySelector('#effect-background-brightness')`);
    await evaluate(`(() => { const input=document.querySelector('#effect-background-brightness');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'-35');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true})); })()`);
    await click('subject');
    assert.equal(await evaluate(`document.querySelector('#effect-subject-brightness').value`), '0');
    await click('Sepia'.toLowerCase());
    await evaluate(`document.querySelector('[aria-label="Preview"]').click()`);
    await until(`!!document.querySelector('[role="dialog"] img')`);
    const result = await evaluate(`(async () => { const image=document.querySelector('[role="dialog"] img');await image.decode();const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);return {width:c.width,height:c.height,background:[...ctx.getImageData(10,10,1,1).data],subject:[...ctx.getImageData(400,500,1,1).data]}; })()`);
    assert.equal(result.width, 800); assert.equal(result.height, 600);
    assert.ok(result.background[0] < 150, 'Background brightness must be reduced');
    assert.ok(result.subject[0] > result.subject[2], 'Sepia should affect the blue subject');
    console.log('PASS: inspector modes, independent subject filter, PNG preview at original dimensions', result);
    await evaluate(`document.querySelector('[aria-label="Close"]').click()`);
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await sleep(700);
    assert.ok(await evaluate(`document.documentElement.scrollWidth <= 390`), 'Mobile editor must not overflow horizontally');
    console.log('PASS: mobile viewport has no horizontal overflow');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await sleep(400);
    await click('Text Layers');
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const screenshotPath = path.join(os.tmpdir(), 'overlayit-effects-review.png');
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    console.log('Review screenshot:', screenshotPath);
  } finally { if(ws) ws.close(); chrome.kill(); }
})().catch(error => { console.error(error); process.exitCode=1; });
