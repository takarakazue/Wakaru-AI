(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const chooser = $('#example');
  const form = $('#check-form');
  let revealed = false;
  const labels = { subject: 'Assunto', action: 'Ação solicitada', deadline: 'Prazo de resposta' };

  function clearHighlights() {
    document.querySelectorAll('.is-highlighted').forEach(node => node.classList.remove('is-highlighted'));
  }
  function reset() {
    revealed = false;
    const missing = chooser.value === 'sem-prazo';
    $('#deadline-row').hidden = missing;
    $('#deadline-source').hidden = missing;
    $('#missing-deadline').hidden = !missing;
    $('#deadline-answer').textContent = missing ? 'O prazo de resposta não está informado.' : 'Até 5 de novembro de 2026.';
    $('#deadline-note').textContent = missing ? 'A data da reunião aparece, mas não é apresentada como prazo de entrega.' : 'A reunião será em 12 de novembro. São datas diferentes.';
    $('#explanation').hidden = true;
    $('#before-explanation').hidden = false;
    $('#compreensao').hidden = true;
    $('#check-result').hidden = true;
    $('#check-error').hidden = true;
    $('#source-status').textContent = '';
    form.reset();
    clearHighlights();
    document.querySelectorAll('#check-form input').forEach(input => input.removeAttribute('aria-invalid'));
  }

  $('#explain').addEventListener('click', () => {
    revealed = true;
    $('#before-explanation').hidden = true;
    $('#explanation').hidden = false;
    $('#compreensao').hidden = false;
    $('#result-title').focus();
  });
  chooser.addEventListener('change', reset);
  $('#restart').addEventListener('click', () => { reset(); $('#explain').focus(); });
  document.querySelectorAll('[data-source]').forEach(button => {
    button.addEventListener('click', () => {
      if (!revealed) return;
      clearHighlights();
      const key = button.dataset.source;
      const source = $(`#source-${key}`);
      source.classList.add('is-highlighted');
      source.focus({ preventScroll: true });
      source.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
      $('#source-status').textContent = `${labels[key]}: trecho destacado no documento original. Você pode voltar à explicação usando Tab.`;
    });
  });
  form.addEventListener('change', event => {
    form.querySelectorAll(`input[name="${event.target.name}"]`).forEach(input => input.removeAttribute('aria-invalid'));
    $('#check-result').hidden = true;
    $('#check-error').hidden = true;
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!revealed) return;
    const data = new FormData(form);
    let firstInvalid;
    ['action', 'deadline'].forEach(name => {
      form.querySelectorAll(`input[name="${name}"]`).forEach(input => {
        if (!data.get(name)) { input.setAttribute('aria-invalid', 'true'); firstInvalid ||= input; }
        else input.removeAttribute('aria-invalid');
      });
    });
    $('#check-error').hidden = !firstInvalid;
    if (firstInvalid) { firstInvalid.focus(); return; }
    const missing = chooser.value === 'sem-prazo';
    const actionCorrect = data.get('action') === 'correta';
    const dateCorrect = data.get('deadline') === (missing ? 'ausente' : '5');
    const result = $('#check-result');
    result.replaceChildren();
    const title = document.createElement('h3');
    title.textContent = actionCorrect && dateCorrect ? 'Você identificou a ação e o prazo deste exemplo.' : 'Vamos conferir o que o documento pede.';
    const action = document.createElement('p');
    action.textContent = `${actionCorrect ? 'Ação identificada.' : 'Reveja a ação.'} É preciso preencher o horário disponível e entregar a ficha ao professor da turma.`;
    const date = document.createElement('p');
    date.textContent = missing ? `${dateCorrect ? 'Informação ausente reconhecida.' : 'O prazo não pode ser deduzido.'} Este comunicado não informa uma data de entrega. Confirme com a escola.` : `${dateCorrect ? 'Prazo identificado.' : 'Atenção às duas datas.'} O prazo de resposta é 5 de novembro de 2026. A reunião acontece em 12 de novembro.`;
    const note = document.createElement('p');
    note.textContent = 'Este retorno vale apenas para o exemplo preparado. Nenhuma escolha foi enviada ou salva.';
    result.append(title, action, date, note);
    result.hidden = false;
  });
  reset();
})();
