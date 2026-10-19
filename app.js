/* Sem bibliotecas externas, cookies, analytics ou persistência de respostas no navegador. */
(() => {
  'use strict';
  const choices = {
    japones: ['Nenhum ou quase nenhum', 'Básico', 'Intermediário', 'Avançado', 'Fluente ou nativo'],
    compreensao: ['Leio e compreendo por conta própria', 'Uso aplicativos de tradução', 'Uso ferramentas de inteligência artificial', 'Peço ajuda a familiares, amigos ou conhecidos', 'Busco ajuda profissional ou de serviços de apoio', 'Adio ou evito lidar com o documento', 'Outra forma'],
    frequencia: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre', 'Não precisei lidar com documentos nesse período'],
    consequencia: ['Não houve consequência', 'Precisei pedir ajuda a outra pessoa', 'Gastei mais tempo para resolver a situação', 'Senti insegurança, ansiedade ou receio de errar', 'Atrasei ou deixei de realizar alguma ação', 'Tive prejuízo financeiro ou perdi um prazo', 'Outra consequência', 'Não se aplica: não tive dificuldade ou não lidei com documentos']
  };
  const titles = ['Primeiro, vamos nos conhecer.', 'O idioma no seu dia a dia.', 'Quando a compreensão faz falta.', 'Um pouco mais da sua experiência.'];
  const descriptions = ['Esta pesquisa é para quem mora no Japão. Não há respostas certas ou erradas.', 'Cada pessoa encontra seu caminho. Conte como você costuma lidar com o idioma.', 'Pense nos documentos que recebeu ou precisou ler nos últimos 6 meses.', 'O relato é opcional. Antes de enviar, revise suas respostas e leia o consentimento.'];
  const names = ['Começo', 'Idioma', 'Experiência', 'Conclusão'];
  const questions = { residencia: 'Residência no Japão', japones: 'Nível de japonês', compreensao: 'Como compreende documentos', frequencia: 'Frequência de dificuldade', consequencia: 'Principal consequência', relato: 'Relato opcional' };
  const form = document.querySelector('#survey-form');
  const next = document.querySelector('#next-button');
  const back = document.querySelector('#back-button');
  const status = document.querySelector('#form-status');
  let step = 0;
  let pending = null;
  let timer;
  let sending = false;
  let completed = false;
  const config = window.WAKARU_CONFIG || {};

  Object.entries(choices).forEach(([name, options]) => {
    const host = document.querySelector(`#${name}-options`);
    options.forEach(value => {
      const label = document.createElement('label');
      label.className = 'choice';
      const input = document.createElement('input');
      input.type = name === 'compreensao' ? 'checkbox' : 'radio';
      input.name = name;
      input.value = value;
      if (input.type === 'radio') input.required = true;
      if (name === 'compreensao') input.setAttribute('aria-describedby', 'ajuda-hint');
      const text = document.createElement('span');
      text.textContent = value;
      const marker = document.createElement('span');
      marker.className = 'radio-art';
      marker.setAttribute('aria-hidden', 'true');
      label.append(input, text, marker);
      host.append(label);
    });
  });

  function answers() {
    const data = new FormData(form);
    return {
      residencia: data.get('residencia') || '',
      japones: data.get('japones') || '',
      compreensao: data.getAll('compreensao'),
      frequencia: data.get('frequencia') || '',
      consequencia: data.get('consequencia') || '',
      relato: String(data.get('relato') || '').trim(),
      consentimento: document.querySelector('#consentimento').checked
    };
  }

  function clearError(name) {
    const error = document.querySelector(`#error-${name}`);
    if (error) error.hidden = true;
    form.querySelectorAll(`[name="${name}"]`).forEach(input => {
      input.removeAttribute('aria-invalid');
      const ids = (input.getAttribute('aria-describedby') || '').split(' ').filter(id => id && id !== `error-${name}`);
      if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
      else input.removeAttribute('aria-describedby');
    });
  }

  function error(name, message) {
    const element = document.querySelector(`#error-${name}`);
    element.textContent = message;
    element.hidden = false;
    form.querySelectorAll(`[name="${name}"]`).forEach(input => {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', `${input.getAttribute('aria-describedby') || ''} error-${name}`.trim());
    });
  }

  function validate() {
    const data = answers();
    const required = [['residencia'], ['japones', 'compreensao'], ['frequencia', 'consequencia'], ['consentimento']][step];
    let valid = true;
    required.forEach(name => {
      clearError(name);
      if (!data[name] || (Array.isArray(data[name]) && !data[name].length)) {
        error(name, name === 'consentimento' ? 'Para participar, leia e marque o consentimento.' : 'Selecione uma opção para continuar.');
        valid = false;
      }
    });
    if (step === 3) {
      clearError('relato');
      if (data.relato.length > 1200 || /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\d ()-]{7,}\d)/i.test(data.relato)) {
        error('relato', 'Use até 1.200 caracteres e remova e-mails, telefones ou sequências de números pessoais.');
        valid = false;
      }
    }
    if (!valid) form.querySelector('[aria-invalid="true"]')?.focus();
    return valid;
  }

  function render(focus = true) {
    document.querySelectorAll('.step').forEach((element, index) => { element.hidden = index !== step; });
    document.querySelector('#step-label').textContent = `Etapa ${step + 1} de 4 · ${names[step]}`;
    document.querySelector('#step-count').textContent = `0${step + 1} / 04`;
    document.querySelector('#progress-fill').style.width = `${(step + 1) * 25}%`;
    const progress = document.querySelector('[role="progressbar"]');
    progress.setAttribute('aria-valuenow', String(step + 1));
    progress.setAttribute('aria-valuetext', `Etapa ${step + 1} de 4`);
    document.querySelector('#survey-title').textContent = titles[step];
    document.querySelector('#step-description').textContent = descriptions[step];
    back.hidden = step === 0;
    next.textContent = step === 3 ? 'Enviar respostas →' : 'Continuar →';
    status.hidden = true;
    if (step === 3) updateReview();
    if (focus) document.querySelector('#survey-title').focus();
  }

  function updateReview() {
    const list = document.querySelector('#review-list');
    list.replaceChildren();
    const data = answers();
    Object.entries(questions).forEach(([key, title]) => {
      const term = document.createElement('dt');
      const value = document.createElement('dd');
      term.textContent = title;
      value.textContent = key === 'residencia' ? 'Sim, moro no Japão' : Array.isArray(data[key]) ? data[key].join('; ') : data[key] || 'Não informado';
      list.append(term, value);
    });
  }

  function showResult(id) {
    document.querySelector('#form-content').hidden = true;
    document.querySelector(`#${id}`).hidden = false;
    document.querySelector(`#${id} h2`).focus();
  }

  function notify(message) {
    status.textContent = message;
    status.hidden = false;
  }

  function lockAnswers() {
    form.querySelectorAll('input, textarea').forEach(input => { input.disabled = true; });
    back.hidden = true;
  }

  function validEndpoint(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'script.google.com' && /^\/macros\/s\/[\w-]+\/exec$/.test(url.pathname) && !url.search && !url.hash;
    } catch { return false; }
  }

  function submit() {
    if (!validEndpoint(config.endpoint)) {
      notify('A coleta ainda não foi aberta: o endereço de envio precisa ser configurado pela equipe. Nenhuma resposta foi enviada.');
      return;
    }
    if (!pending) {
      if (!window.crypto?.randomUUID) {
        notify('Abra a pesquisa pelo endereço HTTPS publicado para enviar suas respostas com segurança.');
        return;
      }
      pending = { requestId: crypto.randomUUID(), version: '1.0', answers: answers() };
    }
    lockAnswers();
    sending = true;
    next.disabled = true;
    next.textContent = 'Enviando…';
    form.setAttribute('aria-busy', 'true');
    notify('Enviando suas respostas. Aguarde a confirmação de registro.');
    // Um POST de formulário funciona entre origens sem depender de fetch opaco/CORS.
    // O backend confirma a gravação por postMessage; load do iframe não significa sucesso.
    const transport = document.createElement('form');
    transport.method = 'POST';
    transport.action = config.endpoint;
    transport.target = 'wakaru-response';
    transport.hidden = true;
    const payload = document.createElement('input');
    payload.type = 'hidden';
    payload.name = 'payload';
    payload.value = JSON.stringify(pending);
    transport.append(payload);
    document.body.append(transport);
    timer = window.setTimeout(() => finishFailure('Ainda não recebemos a confirmação. O registro pode ter ocorrido. Use “Confirmar envio” para repetir com o mesmo código, sem duplicar sua resposta.'), 45000);
    transport.submit();
    transport.remove();
  }

  function finishFailure(message) {
    window.clearTimeout(timer);
    sending = false;
    form.removeAttribute('aria-busy');
    next.disabled = false;
    next.textContent = 'Confirmar envio →';
    notify(message);
  }

  window.addEventListener('message', event => {
    // HTML Service pode usar script.google.com ou um subdomínio isolado do Google.
    const trusted = /^https:\/\/(?:script\.google\.com|(?:[a-z0-9-]+\.)?script\.googleusercontent\.com|[a-z0-9-]+-script\.googleusercontent\.com)$/.test(event.origin);
    const data = event.data;
    if (!trusted || completed || !pending || !data || data.type !== 'wakaru:result' || data.requestId !== pending.requestId) return;
    if (data.ok === true) {
      window.clearTimeout(timer);
      sending = false;
      completed = true;
      form.reset();
      pending = null;
      showResult('success');
    } else if (data.ok === false) {
      if (data.code === 'INVALID') {
        pending = null;
        form.querySelectorAll('input, textarea').forEach(input => { input.disabled = false; });
        back.hidden = false;
        finishFailure('O servidor recusou as respostas. Revise as opções, o consentimento e o relato, removendo dados pessoais antes de tentar novamente.');
        next.textContent = 'Enviar respostas →';
      } else {
        finishFailure('O serviço não conseguiu confirmar o registro. Tente novamente em alguns instantes com “Confirmar envio”. Suas respostas foram mantidas nesta página.');
      }
    }
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (sending || completed) return;
    if (pending) { submit(); return; }
    if (!validate()) return;
    if (step === 0 && answers().residencia === 'nao') { showResult('ineligible'); return; }
    if (step < 3) { step++; render(); }
    else submit();
  });
  back.addEventListener('click', () => { if (!sending && !pending && step > 0) { step--; render(); } });
  document.querySelector('#correct-residency').addEventListener('click', () => {
    document.querySelector('#ineligible').hidden = true;
    document.querySelector('#form-content').hidden = false;
    step = 0;
    render();
  });
  form.addEventListener('change', event => { if (event.target.name) clearError(event.target.name); });
  document.querySelector('#relato').addEventListener('input', event => {
    document.querySelector('#relato-count').textContent = `${event.target.value.length.toLocaleString('pt-BR')} / 1.200 caracteres`;
    clearError('relato');
    updateReview();
  });
  if (typeof config.contatoPesquisa === 'string' && config.contatoPesquisa.trim()) {
    const contact = document.querySelector('#research-contact');
    contact.textContent = `Equipe responsável / contato da pesquisa: ${config.contatoPesquisa.trim()}`;
    contact.hidden = false;
  }
  next.disabled = false;
  render(false);
})();
