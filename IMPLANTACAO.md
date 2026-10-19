# Implantar a pesquisa

## 1. Preparar a planilha e o script

1. Em sua conta Google, crie uma planilha **privada**. Não habilite “Publicar na Web” nem compartilhamento público.
2. Na planilha, abra **Extensões → Apps Script**. Substitua o conteúdo de `Code.gs` pelo arquivo `apps-script/Code.gs` desta entrega e salve.
3. No Apps Script, abra **Configurações do projeto → Propriedades do script** e adicione:

| Propriedade | Exemplo / conteúdo |
|---|---|
| `SPREADSHEET_ID` | A parte entre `/d/` e `/edit` da URL da planilha |
| `SITE_ORIGIN` | `https://seuusuario.github.io` |

Use valores reais. `SITE_ORIGIN` não inclui `/repositorio`, caminhos, parâmetros ou barra final. Para domínio próprio, use `https://pesquisa.seudominio.com`. Um script aceita uma origem de confirmação por vez. Pré-visualizações em outra origem não receberão a confirmação da implantação de produção.

4. Selecione a função **prepararPlanilha** no editor e clique em **Executar**. Autorize o acesso solicitado à sua planilha. A função cria a aba `Respostas` com cabeçalhos, sem inserir participantes. Se a aba já contiver cabeçalhos diferentes, use uma planilha ou aba adequada; o script recusa a gravação em estrutura incompatível.
5. Confira a aba. Não renomeie ou reorganize as colunas durante a coleta. O código do envio precisa permanecer na coluna B.

## 2. Publicar o Apps Script

1. Clique em **Implantar → Nova implantação**.
2. Selecione o tipo **App da Web / Aplicativo da Web**.
3. Em **Executar como**, selecione **Eu** (responsável pela planilha).
4. Em **Quem tem acesso**, selecione **Qualquer pessoa**, permitindo participação sem login. Contas institucionais podem restringir essa opção; nesse caso, peça orientação ao administrador ou use uma conta autorizada pela instituição. Uma implantação que exija login não atende à experiência proposta.
5. Implante e copie a URL pública que termina em `/exec`. Não use `/dev`.
6. Abra a URL `/exec` em janela anônima. Deve aparecer “Receptor Wakaru AI”. Isso verifica acesso público, mas ainda não comprova gravação.

`ALLOWALL` é usado apenas para a página técnica de confirmação poder carregar no iframe do site. Ela não mostra respostas nem permite ler a planilha. A confirmação usa `postMessage` com a origem exata configurada; não use `*` como destino.

Ao mudar o código, salve e vá em **Implantar → Gerenciar implantações → Editar → Nova versão → Implantar**. Salvar o arquivo sozinho não atualiza uma implantação versionada. Se criar outra implantação, atualize a URL no site.

## 3. Configurar o site

Edite `config.js`:

```js
window.WAKARU_CONFIG = Object.freeze({
  endpoint: 'https://script.google.com/macros/s/SEU_ID_DE_IMPLANTACAO/exec',
  contatoPesquisa: 'Contato institucional real da equipe'
});
```

O exemplo é apenas formato, não um endpoint funcional. Não coloque ID da planilha, senha, token OAuth ou chave privada nesse arquivo. A URL de envio é pública por definição.

Antes da divulgação, complete a seção de privacidade em `index.html` com a identificação verdadeira da equipe/instituição, contato, prazo de retenção e procedimento de descarte definidos para a pesquisa. Valide consentimento e instrumento conforme as regras acadêmicas aplicáveis. Não publique marcadores de exemplo como se fossem dados reais.

## 4. Publicar no GitHub Pages

1. Crie um repositório e envie o **conteúdo** de `wakaru-ai/` para sua raiz. `index.html`, `config.js` e `.nojekyll` devem estar nessa raiz. Não envie o ZIP como substituto dos arquivos.
2. Abra **Settings → Pages → Build and deployment**.
3. Escolha **Deploy from a branch**, selecione a branch que contém os arquivos (normalmente `main`) e a pasta **/(root)**; salve.
4. Aguarde a implantação e abra a URL indicada pelo GitHub, geralmente `https://seuusuario.github.io/repositorio/`.
5. Confira que a origem corresponde a `SITE_ORIGIN`. Use HTTPS e abra o site diretamente, sem incorporá-lo em outro iframe. A página técnica do Apps Script envia a confirmação para a janela superior.

Não é necessário workflow, npm, Jekyll, servidor próprio ou variável de ambiente do GitHub. Em repositórios públicos, considere colocar apenas os arquivos públicos do site e a documentação; o script desta entrega não contém segredos.

## 5. Verificação real antes de convidar participantes

Use primeiro uma **planilha separada de homologação** e uma implantação configurada para ela. Não misture testes com dados da pesquisa.

1. Sem preencher, tente continuar: a validação deve indicar a pergunta e mover o foco.
2. Escolha “Não moro no Japão”: deve encerrar sem criar linha na planilha.
3. Faça uma submissão técnica claramente identificada como teste no relato (por exemplo, `TESTE TECNICO — EXCLUIR`), sem dados pessoais e com consentimento. Isso é teste, não resposta de participante; não utilize na análise.
4. Espere a tela de confirmação e confira uma única linha na planilha, com todas as colunas corretas. Só a tela do receptor `/exec` não basta.
5. Em homologação, desligue a rede após enviar ou interrompa a confirmação. Ao restabelecer, use “Confirmar envio” e verifique que o mesmo código aparece uma única vez.
6. Teste no celular e em janela anônima, sem conta Google conectada. Restrições do navegador, extensões ou da conta Workspace podem impedir o iframe ou o app público. O site deve manter uma mensagem de pendência, jamais anunciar sucesso sem confirmação.
7. Exclua os registros técnicos de homologação. Configure a implantação final para a planilha de coleta e confirme as propriedades antes da divulgação. Não preencha exemplos como se fossem respostas reais.

## Diagnóstico

| Sintoma | Verificação |
|---|---|
| “A coleta ainda não foi aberta” | `endpoint` está vazio, inválido ou não é URL `/exec` |
| Solicitação de login no receptor | Reimplante com execução como proprietário e acesso para qualquer pessoa |
| Linha gravada, mas sem confirmação | `SITE_ORIGIN` deve coincidir exatamente com a origem HTTPS do site; confira bloqueios do iframe e não incorpore o site em outra página |
| Serviço não confirma | Verifique ID/permissões da planilha, cabeçalhos, autorização do script e quotas; consulte o painel Execuções sem registrar respostas nos logs |
| Servidor recusa respostas | Opções e versão precisam ser iguais no cliente e servidor; revise consentimento e padrões de dados pessoais no relato |
| Mudanças não aparecem | Publique nova versão do Apps Script e espere a atualização do GitHub Pages; recarregue após terminar qualquer tentativa pendente |

O endpoint público pode receber spam. `SITE_ORIGIN` é destino de mensagem, não bloqueio de origem de requisições. Não coloque uma chave no frontend para tentar torná-lo privado. Restrinja o acesso à planilha à equipe; monitore a coleta e encerre a implantação quando terminar.

Referências: [Apps Script Web Apps](https://developers.google.com/apps-script/guides/web), [HTML Service e sandbox](https://developers.google.com/apps-script/guides/html/restrictions), [publicação por branch no GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
