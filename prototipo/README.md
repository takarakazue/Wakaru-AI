# Wakaru AI — primeiro protótipo

Demonstração estática em português, com documento escolar fictício em japonês e explicação previamente preparada. Não utiliza IA, OCR, upload, conta, APIs, cookies, analytics, Google Sheets ou armazenamento de respostas.

## Abrir

Abra `index.html` no navegador. Não precisa instalar dependências. Os arquivos também podem ser hospedados como uma subpasta `prototipo/` no repositório do site já existente: nesse caso, mantenha todos os arquivos e `assets/` juntos, sem substituir a raiz do formulário. A URL esperada seria `https://takarakazue.github.io/Wakaru-AI/prototipo/`, somente depois de publicar essa pasta. Nenhuma publicação foi realizada por esta entrega.

## Experiência

1. Examinar o comunicado fictício.
2. Abrir a explicação em português, com assunto, ação e prazo.
3. Consultar o trecho correspondente no original.
4. Responder a duas perguntas locais de compreensão.
5. Trocar para o exemplo sem prazo e verificar que a explicação reconhece a ausência da informação, sem inventá-la.

Os dois documentos são fictícios, produzidos para esta demonstração. As datas não são compromissos reais. A explicação está escrita no código e não é resultado de processamento automático. O teste local não mede precisão de IA nem constitui um estudo de usabilidade concluído.

## Por que esse foco

Leitura preliminar do arquivo privado fornecido `Wakaru-AI.xlsx`, aba `Respostas`, linhas 2 a 5, em 19/10/2026. Não foram modificados ou publicados os registros originais.

- São quatro respostas, com residência no Japão e consentimento registrados. Não há relato marcado como teste nessa exportação.
- Frequência de dificuldade: duas pessoas marcaram “Sempre”, uma “Às vezes” e uma “Raramente”.
- Três selecionaram ajuda de familiares, amigos ou conhecidos; duas selecionaram aplicativos de tradução e duas ferramentas de IA. A questão aceita múltiplas escolhas.
- Consequência principal: uma resposta para gasto de tempo, uma para necessidade de ajuda, uma sem consequência e uma “não se aplica”. Não há maioria em uma consequência específica.
- Os três relatos preenchidos abordam situações distintas: formulário de atendimento de saúde, documentos escolares em conversa presencial e documentos recebidos em casa, incluindo seguro de automóvel.

A escolha do comunicado escolar parte de uma situação observada em um relato e permite testar assunto, ação e prazo num exemplo simples. O questionário não comparou esses três elementos nem mostrou que a escola é o contexto mais frequente. Sua prioridade é uma hipótese de design, não uma conclusão estatística. Não foram inseridos relatos, nomes ou códigos de participantes nos arquivos públicos do protótipo.

## Teste com pessoas

Continue a pesquisa enquanto testa. Convide voluntários, explique que o conteúdo é fictício e que não existe IA funcionando nesta versão. Não peça documentos pessoais, informações médicas, dados de filhos ou outros identificadores.

Antes de mostrar a explicação, apresente a tarefa: “Você recebeu este comunicado da escola. Descubra do que se trata, o que precisa fazer e até quando precisa responder.” Não diga onde clicar. Observe se a pessoa encontra a explicação, distingue as datas e consulta o original. Só apresente o quiz depois da exploração. O retorno do quiz ensina a resposta; se a pessoa repetir, não trate a nova tentativa como primeira compreensão.

Registre manualmente, sem nomes: cenário, se completou a tarefa sem ajuda, interpretação de assunto/ação/prazo, se precisou de intervenção e dúvidas percebidas. Meça o tempo apenas com procedimento igual para todos; este protótipo não o mede. A versão sem prazo deve ser apresentada como outra tarefa: a resposta esperada é reconhecer que a informação não existe no documento.

Como referência inicial, 3 a 5 sessões podem revelar problemas de navegação e linguagem. Esse número é uma decisão prática para a primeira rodada, não uma garantia de validação ou representatividade. Não interprete acertos no exemplo preparado como evidência de que uma IA lê documentos reais com precisão.

Antes das sessões, defina o que levará a uma mudança: confundir o dia da reunião com o prazo, não encontrar a ação ou assumir uma data ausente são falhas que justificam revisar a interface. Depois, teste outra versão e descreva os aprendizados, inclusive os negativos.

## Próxima etapa técnica

Após observar a compreensão e revisar o protótipo, planeje separadamente OCR, tradução, extração de campos e avaliação com gabarito revisado por alguém competente em japonês. O mecanismo precisa preservar informações ausentes e permitir conferir o original. Esta entrega não contém chave de API nem integração de IA oculta.

## Verificação desta versão

Verificada em Chrome no Windows, com larguras de 320, 390, 768 e 1440 px. Em cada largura foram conferidos: abertura da explicação, destaque e foco no original, validação das duas perguntas, retorno para respostas certas e erradas, reconhecimento de prazo ausente e reinício do exemplo. Sem transbordamento horizontal, exceções JavaScript, requisições externas, POSTs ou uso de armazenamento local nos fluxos testados. Capturas desktop e celular foram inspecionadas visualmente. A verificação cobre o protótipo preparado; não constitui teste com participantes, auditoria de acessibilidade ou avaliação da precisão de IA.
