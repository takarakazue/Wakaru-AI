const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { serve } = require('./serve.cjs');
let server, browser, base;
before(async () => {
  server = http.createServer(serve);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
});
after(async () => { await browser?.close(); await new Promise(resolve => server.close(resolve)); });
async function page(configured = false, viewport = { width: 1440, height: 1100 }) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  if (configured) await page.route('**/config.js', route => route.fulfill({ contentType: 'application/javascript', body: `window.WAKARU_CONFIG = {endpoint:'https://script.google.com/macros/s/TEST_ONLY/exec'};` }));
  await page.goto(base);
  await page.waitForFunction(() => !document.querySelector('#next-button').disabled);
  return { page, errors };
}
async function finalStep(p) {
  await p.getByLabel('Sim, moro no Japão', { exact: true }).check(); await p.locator('#next-button').click();
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await p.getByLabel('Básico', { exact: true }).check();
  await p.getByLabel('Uso aplicativos de tradução', { exact: true }).check(); await p.locator('#next-button').click();
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await p.getByLabel('Às vezes', { exact: true }).check();
  await p.getByLabel('Precisei pedir ajuda a outra pessoa', { exact: true }).check(); await p.locator('#next-button').click();
}
test('validação, filtro de residência e nenhuma submissão para não residente', async () => {
  const { page: p, errors } = await page(); let posts = 0;
  p.on('request', req => { if (req.method() === 'POST') posts++; });
  await p.locator('#next-button').click();
  assert.equal(await p.locator('#error-residencia').isVisible(), true);
  assert.equal(await p.locator(':focus').getAttribute('name'), 'residencia');
  await p.getByLabel('Não moro no Japão', { exact: true }).check(); await p.locator('#next-button').click();
  assert.equal(await p.locator('#ineligible').isVisible(), true);
  assert.equal(posts, 0);
  await p.locator('#correct-residency').click();
  assert.equal(await p.locator('[data-step="0"]').isVisible(), true);
  assert.deepEqual(errors, []); await p.close();
});
test('revisão, consentimento, privacidade do relato e endpoint ausente', async () => {
  const { page: p, errors } = await page(); await finalStep(p);
  assert.match(await p.locator('#review-list').textContent(), /Básico/);
  await p.locator('#next-button').click(); assert.equal(await p.locator('#error-consentimento').isVisible(), true);
  await p.locator('#consentimento').check();
  await p.locator('#relato').fill('TESTE LOCAL SEM DADOS PESSOAIS');
  assert.match(await p.locator('#review-list').textContent(), /TESTE LOCAL SEM DADOS PESSOAIS/);
  await p.locator('#relato').fill('teste@example.invalid'); await p.locator('#next-button').click();
  assert.equal(await p.locator('#error-relato').isVisible(), true);
  await p.locator('#relato').fill(''); await p.locator('#next-button').click();
  assert.match(await p.locator('#form-status').textContent(), /coleta ainda não foi aberta/);
  assert.equal(await p.locator('#success').isVisible(), false);
  await p.locator('#back-button').click(); assert.equal(await p.getByLabel('Às vezes', { exact: true }).isChecked(), true);
  assert.deepEqual(errors, []); await p.close();
});
test('envio exige confirmação válida; erros, timeout e repetição preservam o código', async () => {
  const { page: p, errors } = await page(true); const posts = [];
  await p.route('https://script.google.com/**', async route => {
    posts.push(JSON.parse(new URLSearchParams(route.request().postData()).get('payload')));
    await route.fulfill({ contentType: 'text/html', body: '<p>Receptor simulado — sem gravação real</p>' });
  });
  await finalStep(p); await p.locator('#consentimento').check();
  await p.clock.install();
  await Promise.all([p.waitForResponse(r => r.url().startsWith('https://script.google.com/')), p.locator('#next-button').click()]);
  assert.equal(posts.length, 1);
  assert.equal(await p.locator('#success').isVisible(), false);
  const id = posts[0].requestId;
  async function message(origin, requestId, ok, code) {
    await p.evaluate(({ origin, requestId, ok, code }) => window.dispatchEvent(new MessageEvent('message', { origin, data: { type: 'wakaru:result', requestId, ok, code } })), { origin, requestId, ok, code });
  }
  await message('https://evil.example', id, true);
  await message('https://script.google.com', 'wrong-id', true);
  assert.equal(await p.locator('#success').isVisible(), false);
  await message('https://script.google.com', id, false, 'SERVICE');
  assert.equal(await p.locator('#next-button').isEnabled(), true);
  assert.equal(await p.locator('#relato').isDisabled(), true);
  await Promise.all([p.waitForResponse(r => r.url().startsWith('https://script.google.com/')), p.locator('#next-button').click()]);
  await p.waitForFunction(() => document.querySelector('#next-button').disabled);
  await p.clock.fastForward(46000);
  assert.match(await p.locator('#form-status').textContent(), /registro pode ter ocorrido/);
  await Promise.all([p.waitForResponse(r => r.url().startsWith('https://script.google.com/')), p.locator('#next-button').click()]);
  assert.equal(posts.length, 3);
  assert.deepEqual(posts[0], posts[1]); assert.deepEqual(posts[1], posts[2]);
  await message('https://n-abc-script.googleusercontent.com', id, true, 'RECORDED');
  assert.equal(await p.locator('#success').isVisible(), true);
  assert.equal(await p.locator('#form-content').isVisible(), false);
  assert.deepEqual(errors, []); await p.close();
});
test('layout móvel e desktop sem transbordamento, screenshots e teclado', async () => {
  for (const width of [320, 390, 768, 1440]) {
    const { page: p, errors } = await page(false, { width, height: width > 720 ? 1100 : 900 });
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Layout ${width}px`);
    await p.keyboard.press('Tab'); assert.equal(await p.locator(':focus').textContent(), 'Pular para a pesquisa');
    await p.keyboard.press('Enter');
    if (width === 390 || width === 1440) {
      fs.mkdirSync(path.join(__dirname, '../test-results'), { recursive: true });
      await p.screenshot({ path: path.join(__dirname, `../test-results/${width}.png`), fullPage: true });
    }
    await finalStep(p);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Conclusão ${width}px`);
    assert.deepEqual(errors, []); await p.close();
  }
});
test('recusa explícita do servidor libera edição para correção', async () => {
  const { page: p } = await page(true);
  let submitted;
  await p.route('https://script.google.com/**', async route => {
    submitted = JSON.parse(new URLSearchParams(route.request().postData()).get('payload'));
    await route.fulfill({ contentType: 'text/html', body: '<p>Mock</p>' });
  });
  await finalStep(p); await p.locator('#consentimento').check();
  await Promise.all([p.waitForResponse(r => r.url().startsWith('https://script.google.com/')), p.locator('#next-button').click()]);
  await p.evaluate(id => window.dispatchEvent(new MessageEvent('message', { origin: 'https://script.google.com', data: { type: 'wakaru:result', requestId: id, ok: false, code: 'INVALID' } })), submitted.requestId);
  assert.equal(await p.locator('#relato').isEnabled(), true);
  assert.equal(await p.locator('#back-button').isVisible(), true);
  assert.equal(await p.locator('#success').isVisible(), false);
  await p.close();
});
test('POST em iframe recebe postMessage real do receptor interceptado', async () => {
  const { page: p } = await page(true);
  await p.route('https://script.google.com/**', async route => {
    const payload = JSON.parse(new URLSearchParams(route.request().postData()).get('payload'));
    const result = { type: 'wakaru:result', requestId: payload.requestId, ok: true, code: 'RECORDED' };
    await route.fulfill({ contentType: 'text/html', body: `<script>window.top.postMessage(${JSON.stringify(result)},${JSON.stringify(base)});</script>` });
  });
  await finalStep(p); await p.locator('#consentimento').check();
  await p.locator('#next-button').click();
  await p.locator('#success').waitFor({ state: 'visible' });
  assert.equal(await p.locator('#form-content').isVisible(), false);
  await p.close();
});
