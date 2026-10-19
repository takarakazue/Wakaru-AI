/**
 * Wakaru AI — receptor para Google Sheets, versão 1.0.
 * Configure SPREADSHEET_ID e SITE_ORIGIN nas propriedades do script.
 * Não publique a planilha nem credenciais. Consulte ../IMPLANTACAO.md.
 */
var WAKARU = {
  sheet: 'Respostas',
  headers: ['recebido_em', 'codigo_envio', 'versao', 'consentimento', 'residencia_japao', 'nivel_japones', 'compreensao_documentos', 'frequencia_dificuldade_6_meses', 'principal_consequencia', 'relato_opcional'],
  choices: {
    japones: ['Nenhum ou quase nenhum', 'Básico', 'Intermediário', 'Avançado', 'Fluente ou nativo'],
    compreensao: ['Leio e compreendo por conta própria', 'Uso aplicativos de tradução', 'Uso ferramentas de inteligência artificial', 'Peço ajuda a familiares, amigos ou conhecidos', 'Busco ajuda profissional ou de serviços de apoio', 'Adio ou evito lidar com o documento', 'Outra forma'],
    frequencia: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre', 'Não precisei lidar com documentos nesse período'],
    consequencia: ['Não houve consequência', 'Precisei pedir ajuda a outra pessoa', 'Gastei mais tempo para resolver a situação', 'Senti insegurança, ansiedade ou receio de errar', 'Atrasei ou deixei de realizar alguma ação', 'Tive prejuízo financeiro ou perdi um prazo', 'Outra consequência', 'Não se aplica: não tive dificuldade ou não lidei com documentos']
  }
};

function settings_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_ID');
  var origin = props.getProperty('SITE_ORIGIN');
  // A origem inclui somente protocolo + domínio (sem caminho ou barra final).
  if (!id || !origin || !/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(origin)) throw new Error('CONFIG');
  return { id: id, origin: origin };
}

/** Execute uma vez no editor para autorizar o acesso e preparar a aba. */
function prepararPlanilha() {
  var settings = settings_();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try { sheet_(settings.id); SpreadsheetApp.flush(); }
  finally { lock.releaseLock(); }
}

function sheet_(id) {
  var book = SpreadsheetApp.openById(id);
  var sheet = book.getSheetByName(WAKARU.sheet) || book.insertSheet(WAKARU.sheet);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(WAKARU.headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, WAKARU.headers.length).setBackground('#425B4A').setFontColor('#F6F2E9').setFontWeight('bold');
  } else {
    var headers = sheet.getRange(1, 1, 1, WAKARU.headers.length).getValues()[0];
    if (JSON.stringify(headers) !== JSON.stringify(WAKARU.headers)) throw new Error('HEADERS');
  }
  return sheet;
}

function validPayload_(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (Object.keys(data).sort().join(',') !== 'answers,requestId,version') return false;
  if (typeof data.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.requestId) || data.version !== '1.0') return false;
  var a = data.answers;
  if (!a || typeof a !== 'object' || Array.isArray(a)) return false;
  if (Object.keys(a).sort().join(',') !== 'compreensao,consentimento,consequencia,frequencia,japones,relato,residencia') return false;
  if (a.residencia !== 'sim' || a.consentimento !== true) return false;
  if (!['japones', 'frequencia', 'consequencia'].every(function(key) { return WAKARU.choices[key].indexOf(a[key]) !== -1; })) return false;
  if (!Array.isArray(a.compreensao) || a.compreensao.length < 1 || a.compreensao.length > WAKARU.choices.compreensao.length) return false;
  if (!a.compreensao.every(function(value, index, values) { return WAKARU.choices.compreensao.indexOf(value) !== -1 && values.indexOf(value) === index; })) return false;
  if (typeof a.relato !== 'string' || a.relato.length > 1200) return false;
  // Barreira básica, não uma garantia de anonimização de texto livre.
  if (/[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\d ()-]{7,}\d)/i.test(a.relato)) return false;
  return true;
}

function safeCell_(value) {
  var text = String(value).trim();
  // Impede que texto livre seja interpretado como fórmula da planilha.
  return /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
}

function doPost(e) {
  var origin;
  var requestId = '';
  var lock;
  var locked = false;
  try {
    var settings = settings_();
    origin = settings.origin;
    var raw = e && e.parameter && e.parameter.payload;
    if (typeof raw !== 'string' || raw.length > 16000) return reply_(origin, requestId, false, 'INVALID');
    var data;
    try { data = JSON.parse(raw); }
    catch (_) { return reply_(origin, requestId, false, 'INVALID'); }
    if (data && typeof data.requestId === 'string' && data.requestId.length <= 64) requestId = data.requestId;
    if (!validPayload_(data)) return reply_(origin, requestId, false, 'INVALID');
    lock = LockService.getScriptLock();
    locked = lock.tryLock(15000);
    if (!locked) return reply_(origin, requestId, false, 'BUSY');
    var sheet = sheet_(settings.id);
    // A verificação e a gravação usam o mesmo lock. Repetir o código não cria outra linha.
    if (sheet.getLastRow() > 1) {
      var existing = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).createTextFinder(requestId).matchEntireCell(true).findNext();
      if (existing) return reply_(origin, requestId, true, 'RECORDED');
    }
    var a = data.answers;
    sheet.appendRow([new Date(), requestId, data.version, true, a.residencia, safeCell_(a.japones), safeCell_(a.compreensao.join('; ')), safeCell_(a.frequencia), safeCell_(a.consequencia), safeCell_(a.relato)]);
    SpreadsheetApp.flush();
    return reply_(origin, requestId, true, 'RECORDED');
  } catch (_) {
    // Não registra respostas nem expõe IDs, dados internos ou mensagens de exceção.
    if (origin) return reply_(origin, requestId, false, 'SERVICE');
    return HtmlService.createHtmlOutput('<p>Serviço ainda não configurado.</p>');
  } finally {
    if (locked && lock) lock.releaseLock();
  }
}

function reply_(origin, requestId, ok, code) {
  var message = JSON.stringify({ type: 'wakaru:result', requestId: requestId, ok: ok, code: code });
  // Escapa conteúdo para contexto de script, inclusive tentativas de fechar a tag.
  function escape_(text) { return text.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'); }
  var html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Confirmação Wakaru AI</title></head><body><p>Processamento concluído. Volte à pesquisa para verificar o resultado.</p><script>window.top.postMessage(' + escape_(message) + ',' + escape_(JSON.stringify(origin)) + ');</script></body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Verificação de disponibilidade, sem ler ou divulgar respostas. */
function doGet() {
  return HtmlService.createHtmlOutput('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Wakaru AI</title><p>Receptor Wakaru AI. Responda pelo site da pesquisa.</p></html>');
}
