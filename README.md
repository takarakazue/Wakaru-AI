# Wakaru AI — pesquisa acadêmica

Site estático em português, sem build e sem dependências de produção, pronto para GitHub Pages. Identidade: musgo `#425B4A`, sálvia `#849B83`, creme `#F6F2E9`, areia `#D9C7AC` e carvão `#303831`. Marca vetorial: documento com folha e texto “wakaru AI”.

## Começar

1. Extraia o ZIP e use o conteúdo de `wakaru-ai/` como raiz do repositório.
2. Siga [IMPLANTACAO.md](IMPLANTACAO.md) para preparar uma planilha privada, implantar o Apps Script e configurar `config.js`.
3. Publique a raiz no GitHub Pages. Os caminhos relativos funcionam tanto em `usuario.github.io` quanto em `usuario.github.io/repositorio/`.
4. Faça a verificação de ponta a ponta descrita no guia antes de divulgar a pesquisa.

**Este HTML personalizado não é Google Forms.** O Google Forms não recebe nem gerencia este questionário. O fluxo é: site → POST para Google Apps Script → Google Sheets → confirmação ao site. Não há Google Forms, `entry.id`, respostas fictícias ou dependência de endpoints internos do Forms.

O projeto está pronto para configurar e publicar. Não existe endpoint, conta Google ou repositório predefinido. Com `endpoint: ''`, o formulário permite conhecer a interface, mas bloqueia o envio com uma mensagem explícita. Não simula sucesso.

## Arquivos

| Arquivo | Uso |
|---|---|
| `index.html` | Estrutura, introdução, questionário e privacidade |
| `styles.css` | Layout responsivo, foco visível e redução de movimento |
| `app.js` | Etapas, validação, revisão e envio confirmado |
| `config.js` | URL pública `/exec` e contato público opcional |
| `assets/logo.svg` | Ícone original vetorial, também usado como favicon |
| `apps-script/Code.gs` | Código a copiar para o editor do Google Apps Script |
| `.nojekyll` | Publicação estática direta |
| `tests/backend.test.cjs` | Testes locais do receptor com serviços Google simulados |
| `tests/browser.test.cjs` | Testes de interface com Playwright, sem envio ao Google |
| `tests/serve.cjs` | Servidor local opcional, apenas em `127.0.0.1` |
| `TESTES.md` | Escopo e limites de verificação |

## Questionário e método

São seis perguntas: residência atual no Japão; nível de japonês; meios de compreensão de documentos (múltipla seleção); frequência de dificuldade nos últimos seis meses; principal consequência; relato opcional. Somente residentes seguem para as demais perguntas. O consentimento é separado, obrigatório e desmarcado inicialmente.

**Contexto disponível:** a conversa “Ideias e execução” foi consultada, mas as respostas antigas do assistente estavam disponíveis apenas como referências internas, sem o texto das perguntas. A redação e as alternativas entregues são uma proposta baseada nos seis temas expressamente fornecidos no pedido atual, e não uma transcrição recuperada. A equipe deve revisar sua adequação ao instrumento acadêmico antes da coleta.

“Não tive dificuldade”, “não houve consequência” e “não lidei com documentos” têm alternativas próprias para não forçar relatos negativos. O site não apresenta resultados, números de participantes, citações ou testemunhos inventados. O objetivo de validação da ideia é exposto sem prometer um serviço de tradução funcional.

Para alterar alternativas, mantenha `choices` em `app.js` e `WAKARU.choices` em `Code.gs` idênticos, atualize a versão nos dois arquivos e reimplante o script. Não mude o questionário no meio da coleta sem registrar a mudança metodológica.

## Privacidade e operação

- Não há campos de nome, e-mail, telefone, endereço ou identificação, login, analytics, fontes remotas ou cookies próprios. As respostas ficam apenas na memória da página antes do envio; recarregar perde o preenchimento.
- Não residentes não geram requisição ao receptor. O servidor também rejeita residência diferente de `sim` e ausência de consentimento.
- São salvos as seis respostas, consentimento booleano, versão, data/hora do servidor e UUID aleatório de envio. O UUID identifica uma tentativa, não uma pessoa, e evita duplicação por repetição de envio.
- Um relato livre pode conter dados pessoais mesmo sem solicitação. A interface orienta a não informá-los e cliente/servidor bloqueiam padrões comuns de e-mail e sequências telefônicas. Isso não detecta nomes, endereços ou todos os identificadores; a equipe deve revisar e remover identificadores antes de analisar ou compartilhar trechos. Não prometa anonimato absoluto.
- A aplicação não armazena IP, agente de usuário ou localização técnica. GitHub e Google podem processar dados de conexão segundo suas políticas. Não publique a planilha, suas respostas ou exportações no GitHub.
- Defina antes da divulgação os responsáveis, o contato, o prazo de retenção e o processo de descarte, conforme as exigências da instituição. Inclua esses dados verdadeiros no texto de privacidade. Não foi inventado um responsável, uma aprovação ética nem um prazo institucional.
- Sem identificação, pode ser impossível localizar uma resposta após o envio. Essa limitação é informada antes do consentimento. Não há exclusão automática programada.

## Envio e confirmação

O cliente cria um formulário técnico temporário que faz POST em um iframe oculto. O Apps Script valida, obtém um lock, verifica o código de envio na coluna B, grava, executa `SpreadsheetApp.flush()` e devolve uma página com `postMessage` para a origem configurada. O site valida a origem Google, o tipo e o UUID da mensagem. **Carregar o iframe não significa que a resposta foi gravada.** Não usamos `fetch(..., {mode: 'no-cors'})`, que impediria conferir a resposta.

Se a confirmação demorar mais de 45 segundos ou houver falha de serviço, os campos ficam travados para preservar a mesma tentativa. “Confirmar envio” repete o mesmo payload e o mesmo código; o servidor não adiciona outra linha para esse código. Não recarregue a página nem abra outra aba durante uma confirmação pendente: isso cria uma nova tentativa. Uma recusa explícita de validação libera a edição novamente.

O receptor público não é protegido por uma senha no JavaScript. `SITE_ORIGIN` restringe o destino da confirmação, **não autentica quem envia POST**. Validação, lock e idempotência não impedem spam distribuído ou envios automatizados com novos UUIDs. Para grande divulgação, avalie um receptor com limitação de taxa e verificação adicional; Apps Script tem quotas. Não acrescente um “segredo” público a `config.js` como se fosse autenticação.

## Acessibilidade

HTML semântico em `pt-BR`, fieldsets e legends, labels associados, controles nativos acessíveis por teclado, foco visível, link de salto, indicação textual de campos obrigatórios, erros associados por `aria-describedby`, status anunciado, foco no título ao mudar de etapa e progresso nomeado. A interface respeita `prefers-reduced-motion`; a marca não depende de cor para indicar seleção. Sem JavaScript, há orientação explícita e o envio permanece desabilitado. Não se declara certificação WCAG: os testes não substituem uma auditoria com tecnologias assistivas reais.

## Desenvolvimento e testes

Requer Node.js apenas para servir ou testar localmente, não para publicar:

```sh
node tests/serve.cjs
node --test tests/backend.test.cjs
node --test tests/browser.test.cjs
```

O teste de navegador requer `playwright` e um Chromium disponível. Em um ambiente próprio: `npm install --no-save playwright` e `npx playwright install chromium`. Não envie `node_modules/` ao GitHub. Veja detalhes em [TESTES.md](TESTES.md).

Fontes oficiais consultadas para a implantação: [Web Apps — Google Apps Script](https://developers.google.com/apps-script/guides/web), [restrições do HTML Service](https://developers.google.com/apps-script/guides/html/restrictions) e [fonte de publicação do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
