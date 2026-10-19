# Verificação da entrega

Verificação realizada em 19 de outubro de 2026, com Node.js 24.19.0, Playwright e Google Chrome instalado no ambiente local Windows.

## Resultado

**12 testes aprovados**: seis do receptor em ambiente simulado e seis do navegador. As verificações de sintaxe de `app.js` e `config.js` também passaram. O site local respondeu HTTP 200.

| Área | Verificado |
|---|---|
| Validação no servidor | Enumerações, múltipla seleção, campos extras, versão, UUID, consentimento, elegibilidade, limite de relato e padrões comuns de identificadores |
| Gravação | Cabeçalho sem participantes, escrita sob lock, colunas corretas e confirmação após gravação |
| Repetição | Mesmo código não adiciona segunda resposta; falha de escrita ou lock não confirma sucesso |
| Proteção de conteúdo | Neutralização de fórmula no texto livre e escape de conteúdo em resposta HTML |
| Elegibilidade | Não residentes encerram sem POST; opção de corrigir residência |
| Preenchimento | Erros, foco no campo, revisão atualizada, consentimento obrigatório, relato vazio permitido e preservação ao voltar |
| Envio | Endpoint ausente não simula sucesso; carregar iframe não confirma gravação |
| Confirmação | Origem incorreta e código divergente ignorados; erro de serviço, timeout e repetição mantêm o mesmo payload; recusa explícita permite correção |
| Transporte no navegador | POST interceptado devolve uma página que executa `window.top.postMessage`; a interface reconhece a mensagem real do iframe e conclui |
| Responsividade | Larguras de 320, 390, 768 e 1440 px, sem transbordamento horizontal nas etapas |
| Acessibilidade básica | Link de salto operado por teclado, foco de erro e ausência de exceções JavaScript nos fluxos principais |

Capturas de 390 px e 1440 px foram geradas e inspecionadas visualmente. O espaçamento dos títulos no celular foi corrigido após essa inspeção.

## Limites

Nenhuma conta Google, implantação Apps Script ou planilha real foi fornecida. Os testes do servidor usam `vm` com substitutos em memória de `SpreadsheetApp`, `LockService`, `PropertiesService` e `HtmlService`. Os testes do navegador interceptam o endpoint antes de qualquer requisição externa e usam apenas fixtures técnicas. Não houve criação de respostas reais ou fictícias na pesquisa.

A confirmação nativa do Google (incluindo o sandbox próprio do HTML Service), permissões da conta, quotas e gravação numa planilha real **precisam de homologação após a implantação**, seguindo `IMPLANTACAO.md`. O teste de mensagem por iframe valida o mecanismo local, mas não substitui esse teste integrado com Google.

Os fluxos foram testados em Chromium. Não foram feitos auditoria WCAG, testes com leitor de tela real, Safari/iOS ou uma avaliação ética institucional. A ausência de transbordamento e os controles semânticos não equivalem a uma certificação de acessibilidade.

## Reproduzir

Com Node e Playwright/Chromium disponíveis:

```sh
node --check app.js
node --check config.js
node --test tests/backend.test.cjs tests/browser.test.cjs
```

Se usar o Chrome já instalado em vez do Chromium do Playwright, defina `CHROME_PATH` com o caminho do executável. Os testes sobem um servidor temporário em `127.0.0.1`, em porta livre, e fecham-no ao terminar. As capturas vão para `test-results/`, pasta ignorada pelo Git e excluída do ZIP de entrega. Nenhum desses testes escreve em Google Sheets.
