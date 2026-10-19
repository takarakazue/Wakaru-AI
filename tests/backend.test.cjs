// Fixtures técnicas criadas somente em memória, nunca enviadas ao Google.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../apps-script/Code.gs'), 'utf8');

function environment({ busy = false, writeError = false, properties = true } = {}) {
  const rows = [];
  let held = false;
  const sheet = {
    getLastRow: () => rows.length,
    appendRow: row => { assert.equal(held, true, 'Gravação exige lock'); if (writeError && rows.length) throw Error('Falha'); rows.push(row); },
    setFrozenRows: () => {},
    getRange: () => ({
      setBackground() { return this; }, setFontColor() { return this; }, setFontWeight() { return this; },
      getValues: () => [rows[0]],
      createTextFinder: id => ({ matchEntireCell() { return this; }, findNext: () => rows.slice(1).find(row => row[1] === id) || null })
    })
  };
  const context = vm.createContext({
    PropertiesService: { getScriptProperties: () => ({ getProperty: name => properties ? name === 'SPREADSHEET_ID' ? 'PLANILHA_DE_TESTE' : 'https://exemplo.github.io' : null }) },
    LockService: { getScriptLock: () => ({ tryLock: () => { held = !busy; return held; }, waitLock: () => { held = true; }, releaseLock: () => { held = false; } }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet, insertSheet: () => sheet }), flush: () => {} },
    HtmlService: { XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' }, createHtmlOutput: html => ({ html, setXFrameOptionsMode() { return this; } }) }
  });
  vm.runInContext(source, context);
  return { context, rows, held: () => held };
}
function fixture(context) {
  return { requestId: '12345678-1234-4123-8123-123456789abc', version: '1.0', answers: { residencia: 'sim', japones: context.WAKARU.choices.japones[0], compreensao: [context.WAKARU.choices.compreensao[0]], frequencia: context.WAKARU.choices.frequencia[0], consequencia: context.WAKARU.choices.consequencia[0], relato: 'TESTE TECNICO LOCAL', consentimento: true } };
}
function post(context, payload) { return context.doPost({ parameter: { payload: JSON.stringify(payload) } }).html; }

test('grava uma resposta válida, confirma e não duplica uma repetição', () => {
  const env = environment();
  const data = fixture(env.context);
  const html = post(env.context, data);
  assert.match(html, /"ok":true/);
  assert.match(html, /https:\/\/exemplo.github.io/);
  assert.equal(env.rows.length, 2);
  assert.equal(env.rows[1][1], data.requestId);
  assert.equal(env.rows[1][3], true);
  assert.match(post(env.context, data), /"ok":true/);
  assert.equal(env.rows.length, 2);
  assert.equal(env.held(), false);
});
test('rejeita não residente, sem consentimento, valores extras e texto identificador', () => {
  for (const change of [
    d => { d.answers.residencia = 'nao'; },
    d => { d.answers.consentimento = false; },
    d => { d.answers.email = 'nao-coletar'; },
    d => { d.answers.japones = 'inexistente'; },
    d => { d.answers.compreensao = []; },
    d => { d.answers.compreensao.push(d.answers.compreensao[0]); },
    d => { d.answers.relato = 'x'.repeat(1201); },
    d => { d.answers.relato = 'teste@example.invalid'; },
    d => { d.answers.relato = '090-0000-0000'; },
    d => { d.requestId = 'invalido'; },
    d => { d.version = '9'; }
  ]) {
    const env = environment(); const data = fixture(env.context); change(data);
    assert.match(post(env.context, data), /"ok":false/);
    assert.equal(env.rows.length, 0);
  }
});
test('trata JSON inválido e payload grande sem gravar', () => {
  const env = environment();
  for (const payload of ['{invalido', 'x'.repeat(16001)]) assert.match(env.context.doPost({ parameter: { payload } }).html, /INVALID/);
  assert.equal(env.rows.length, 0);
});
test('falha de escrita e lock ocupado nunca confirmam sucesso', () => {
  for (const options of [{ busy: true }, { writeError: true }]) {
    const env = environment(options);
    assert.match(post(env.context, fixture(env.context)), /"ok":false/);
    assert.equal(env.rows.length <= 1, true);
    assert.equal(env.held(), false);
  }
});
test('protege célula contra fórmula e resposta HTML contra fechamento de script', () => {
  const env = environment(); const data = fixture(env.context);
  data.answers.relato = '=HYPERLINK("https://example.invalid")';
  post(env.context, data);
  assert.equal(env.rows[1][9][0], "'");
  const html = env.context.reply_('https://exemplo.github.io', '</script><script>ruim()', false, 'INVALID').html;
  assert.equal((html.match(/<script>/g) || []).length, 1);
  assert.match(html, /\\u003c/);
});
test('preparação cria somente cabeçalho; ausência de configuração não expõe detalhes', () => {
  const env = environment(); env.context.prepararPlanilha();
  assert.equal(env.rows.length, 1);
  assert.equal(env.rows[0].length, 10);
  const missing = environment({ properties: false });
  assert.match(post(missing.context, {}), /ainda não configurado/);
  assert.equal(missing.rows.length, 0);
});
