# Cobrança

Como o Entrais recebe dinheiro, do clique até `plano_expira_em` mudar.

Este arquivo é a fonte de verdade de duas coisas ao mesmo tempo: o que o código
faz, e o que os termos de uso prometem. Quando o preço, o ciclo ou a regra de
devolução mudar, muda aqui, em `lib/pagamento/precos.ts` e em `app/termos`, no
mesmo commit. Termo que promete uma coisa e código que faz outra é o único bug
deste produto que vira problema jurídico.

## Os dois planos

| | gratuito | pago |
| --- | --- | --- |
| páginas por conta | 1 | 5 |
| itens no cardápio | 20 | 500 |
| fotos por item | 3 | 10 |
| fotos na galeria | 12 | 100 |
| links | 8 | 30 |
| intervalos por dia | 3 | 4 |
| escolher a letra | | sim |
| assinatura do entrais no rodapé | fica | sai |
| números | dois, dos últimos 7 dias | histórico, por dia, por botão |

Os limites moram numa função só no banco, `limite_do_plano`, e são conferidos
por gatilho `BEFORE INSERT`. Mudar um número é mudar uma linha. Limite que
morasse só na tela seria decoração: o painel escreve direto no banco pelo
navegador.

**Rebaixar nunca apaga conteúdo.** Quem tinha 400 itens continua com 400, porque
os gatilhos só barram o próximo. Apagar o trabalho de alguém porque o cartão
venceu é o pior comportamento possível, e o schema foi escrito para permitir a
versão boa.

## Preços

| ciclo | centavos | na tela |
| --- | --- | --- |
| mensal | `1990` | R$ 19,90 por mês |
| anual | `17900` | R$ 179 por ano |

Dinheiro é sempre inteiro em centavos, em todo o produto. O decimal que a API
do Mercado Pago pede nasce em `emReais()`, dentro de `lib/pagamento/mercadopago.ts`,
e morre no `JSON.stringify` da mesma chamada. Nenhum float atravessa a fronteira
do módulo.

O anual economiza `12 × 1990 − 17900 = 5980` centavos, o equivalente a três
meses (`3 × 1990 = 5970`). É por isso que a peça de venda pode dizer "três meses
por conta nossa" com número que fecha, e `precos.test.ts` guarda a frase: mexeu
no preço e a conta ficou menor que a promessa, o teste cai antes de a tela
mentir.

## Os três meios, e por que só um renova sozinho

| meio | teste grátis | renovação | o que cria no Mercado Pago |
| --- | --- | --- | --- |
| crédito | 7 dias | automática | `POST /preapproval` |
| Pix | | a pessoa refaz | `POST /v1/payments` |
| débito | | a pessoa refaz | `POST /v1/payments`, com desafio 3DS |

O crédito é o único meio em que o banco autoriza a cobrança futura junto com a
autorização de hoje. É por isso que ele é o único com teste grátis e o único com
recorrência: no Pix e no débito, cada ciclo é uma decisão nova da pessoa, e um
teste ali seria uma semana de graça seguida de silêncio.

Recorrência em débito não existe no Brasil. **Toda renovação em débito e em Pix é
uma compra nova, feita pela pessoa**, e o painel precisa avisar antes de vencer.
A perda de assinante por esquecimento é maior que no crédito, e isso é custo
assumido, não descuido.

## Interface própria, e o que isso custou

O Mercado Pago tem três níveis de integração. O Checkout Pro manda a pessoa para
o site deles. O Bricks põe componentes deles dentro da nossa página. O Checkout
Transparente com Secure Fields deixa a tela inteiramente nossa.

Escolhido o terceiro: nosso HTML, nossos tokens de cor de `app/globals.css`,
nosso texto. O que é deles são três iframes do tamanho de um input, injetados
dentro das nossas `div`, para número do cartão, validade e código de segurança.

Esses três iframes são a razão de o número do cartão nunca tocar nosso servidor,
o que mantém o projeto em PCI DSS SAQ-A, um formulário de autoavaliação. Aceitar
o número num input nosso jogaria o projeto em SAQ-D, com pentest e varredura
trimestral: custo que um produto de R$ 19,90 por mês não paga.

O Pix não tem nem iframe. O servidor chama `POST /v1/payments`, recebe `qr_code`
e `qr_code_base64`, e o QR é desenhado na nossa própria tela.

## Qualidade da integração, e o que a nota compra

O painel deles dá uma nota de 0 a 100 à integração, com 73 de mínimo, e mede o
quanto o corpo da cobrança alimenta o antifraude. Ela vale dinheiro: integração
magra recusa cartão de cliente legítimo, e recusa de cartão bom é venda perdida
com o cliente achando que a culpa é dele.

A documentação viva deles publica os cinco aspectos medidos (experiência de
compra, conciliação financeira, aprovação de pagamentos, escalabilidade e
segurança) e separa as tarefas em obrigatórias, recomendadas e boas práticas.
**O peso item a item eles não publicam:** a nota e a lista do que ajustar
aparecem só no painel, em Suas integrações, e a medição roda entre os dias 1 e 7
de cada mês, com o resultado no dia 10.

### O que sai daqui hoje

| campo | onde | por quê |
| --- | --- | --- |
| `X-meli-session-id` | cabeçalho de `/v1/payments` e `/preapproval` | identificador do aparelho, o item de maior peso do antifraude |
| `statement_descriptor` | corpo de `/v1/payments` | o nome que a pessoa lê na fatura, e reconhecer é o que evita estorno |
| `additional_info.items` | corpo de `/v1/payments` | o que foi comprado: id, título, descrição, `category_id: "service"`, quantidade e preço |
| `additional_info.payer` | corpo de `/v1/payments` | primeiro nome e resto, do nome que o login com o Google devolveu |
| `external_reference` | os dois corpos | já existia, e é como o webhook acha o negócio |
| `notification_url` | os dois corpos | já existia, e é o que faz o aviso chegar na prévia da branch |
| `description` | corpo de `/v1/payments` | já existia |

O identificador do aparelho vem do navegador. A documentação deles descreve um
script separado, o `security.js`, que publica a variável global
`MP_DEVICE_SESSION_ID`, e diz na mesma página que quem já carrega o SDK deles
dispensa esse script, porque o SDK obtém o identificador sozinho. A tela do
cartão já carrega o SDK, então ela só lê a variável. O caminho inteiro é
`componentes/painel/CamposCartao.tsx`, campo `idDoAparelho` do FormData,
`app/painel/plano/acoes.ts`, e cabeçalho em `lib/pagamento/mercadopago.ts`.

O valor nasce em navegador e termina em cabeçalho HTTP, então ele passa por uma
régua de formato antes de virar cabeçalho: letra, número, ponto, hífen e
sublinhado passam, e o resto some. Sem essa régua, uma quebra de linha no valor
vira um cabeçalho a mais no pedido, e o `fetch` levanta com cara de provedor
fora do ar. Ver `idDeAparelhoLimpo`.

### O que fica de fora, e por quê

**Telefone e endereço do pagador.** O produto tem o e-mail do login, o nome do
login e o CPF que a pessoa digita no formulário do cartão. Telefone e endereço
dela, o produto nunca pediu. Campo vazio ou inventado é pior que campo ausente:
piora a nota, porque a medição compara com o cadastro, e é mentira sobre uma
pessoa.

**O nome do titular e o CPF do cartão continuam apagados do FormData** antes de
cruzar para o servidor, como sempre estiveram. Eles servem ao token e só a ele.
O que mudou é que agora existe um motivo escrito: o corpo do `/preapproval`
aceita oito campos contados, e `additional_info` fica fora da lista, então
guardar documento de terceiro no nosso servidor compraria zero ponto.

**`additional_info` e `statement_descriptor` no `/preapproval`.** A referência
da API deles lista `preapproval_plan_id`, `reason`, `external_reference`,
`payer_email`, `card_token_id`, `back_url`, `status` e `auto_recurring`, mais o
`notification_url` que já mandamos. Os dois campos ficam de fora porque não
existem ali. Quem faz o papel de descritor na assinatura é o `reason`.

**O identificador do aparelho no Pix.** A tela do Pix é servidor puro, sem
JavaScript nenhum, e é isso que a mantém em pé quando script de terceiro falha.
Carregar o SDK deles ali só para colher o identificador custaria esse
comportamento e um script novo no painel, e o Pix não passa por autorização de
banco, que é onde o identificador paga. O campo existe em `DadosAvulso` e o
caminho está pronto para o dia em que o débito voltar a ser possível na conta.

### O que ficou medido, e o que ficou por medir

Medido contra o sandbox, com `npm run pagamento`: o Pix cria a cobrança e a
leitura de volta traz `additional_info` inteiro, com o item e o nome do pagador.
O `statement_descriptor` volta nulo **no Pix**, que é `payment_type_id:
bank_transfer` e não tem fatura de cartão para descrever; o campo continua indo
porque o mesmo `/v1/payments` serve o débito.

Por medir: o cartão inteiro. `POST /v1/payments` com cartão volta `400
excludes_by_rule` nesta conta em modo de teste, e `/preapproval` com
`card_token_id` volta 404, então nem a assinatura nem o cabeçalho do aparelho
saindo numa cobrança de verdade puderam ser exercitados. Ver o prompt 3 em
`PROMPT-MERCADOPAGO.md`, que é o que destrava a conta.

## O caminho de cada compra

### Crédito

1. A pessoa escolhe o ciclo em `/painel/plano`. Os campos do cartão são os
   Secure Fields, e o navegador dela troca o número por um token direto com o
   Mercado Pago.
2. A Server Action chama `assinarComCartao`, que faz `POST /preapproval` com
   `status: "authorized"`, `free_trial` de 7 dias, e `external_reference` com o
   id do negócio. O `X-Idempotency-Key` é um uuid gerado antes da chamada, e é
   ele que faz clique duplo e retry de rede cobrarem uma vez só. Junto vai o
   `X-meli-session-id`, com o identificador do aparelho que a tela colheu.
3. **A Server Action não escreve plano nenhum.** Ela termina ali.
4. O Mercado Pago manda o aviso `subscription_preapproval`. O webhook consulta o
   preapproval, lê `external_reference`, e chama `abrir_assinatura` com o fim do
   teste. O negócio vira `plano = 'pago'` com `plano_expira_em` em 7 dias.
5. No oitavo dia o Mercado Pago cobra sozinho e manda
   `subscription_authorized_payment`. O webhook consulta a fatura e a
   assinatura, e chama `registrar_cobranca_paga` com a próxima data de cobrança.
   **É este aviso que estende o plano todo mês.**

### Pix

1. A Server Action chama `cobrarUmaVez` com `payment_method_id: "pix"`, e leva
   junto o `additional_info` com o item comprado e o nome de quem paga, e o
   `statement_descriptor`. Ver a seção de qualidade da integração, acima.
2. A resposta traz o código para colar e o QR em PNG base64, que a tela desenha
   como estado da própria página, e nunca num modal: modal morre a cada recarga,
   e esta tela se recarrega sozinha.

   O código **não é guardado no banco**: é segredo em repouso, com ganho
   pequeno, e expira em trinta minutos de qualquer jeito. O que atravessa a
   recarga é só o id do pagamento, num cookie `httpOnly` com caminho
   `/painel/plano` e trinta minutos de vida, e a tela relê o código no Mercado
   Pago a cada render. O segredo continua fora do banco, que é a propriedade
   que importa.
3. A tela espera se recarregando a cada dez segundos, e não com polling em
   JavaScript pedindo estado: o QR é estático e o recarregamento é barato. Ver
   a nota sobre a recarga, mais abaixo.
4. O aviso chega no tópico `payment`. O webhook consulta, confirma
   `status: approved`, e chama `registrar_cobranca_paga` com o fim do ciclo
   contado do instante da aprovação.

### Débito, e o desafio 3DS

No Brasil o débito autentica por 3DS praticamente sempre. `POST /v1/payments`
com o token do débito volta assim quando o banco quer desafiar:

```json
{ "status": "pending",
  "status_detail": "pending_challenge",
  "three_ds_info": { "external_resource_url": "https://acs...", "creq": "eyJ0..." } }
```

Isso é resposta de sucesso, e não recusa: `pending_challenge` significa que o
banco vai perguntar alguma coisa para a pessoa. A tela monta um formulário com
`method="POST"`, `action` no `external_resource_url`, um campo escondido `creq`,
e `target` num iframe nosso, e envia sozinho. Quem desenha o que aparece dentro
do iframe é o banco (código por SMS, aprovação no aplicativo).

O resultado **não volta pelo iframe**. Ele chega pelo webhook, no tópico
`payment`, quando o pagamento sai de `pending` para `approved` ou `rejected`. A
tela de espera é a mesma do Pix, porque o problema é idêntico.

O Mercado Pago sugere resolver isso com o Status Screen Brick, que é componente
deles. Não usamos: o formulário e o iframe são umas quinze linhas, e o Brick
traria layout de terceiro para dentro do checkout.

## O webhook

`app/api/pagamento/webhook/route.ts`, `runtime = "nodejs"` porque a conferência
da assinatura usa `node:crypto`.

A ordem dos passos é a parte mais importante do arquivo, e cada um fecha um
jeito conhecido de o dinheiro sair errado:

1. **Ler o corpo como texto cru**, antes de qualquer `JSON.parse`. O HMAC é
   sobre bytes, e reserializar o objeto muda os bytes.
2. **Conferir a assinatura.** Este endereço é público: sem esta linha, qualquer
   pessoa manda um POST e ganha plano pago. Recusa devolve 401 sem corpo,
   porque mensagem de erro num endereço público é manual de como acertar o HMAC.
3. **Travar a idempotência**, com um insert em `avisos_pagamento`. Chave repetida
   significa aviso já tratado: 200 e para.
4. **Buscar o recurso na API do Mercado Pago.** O corpo do aviso é um cutucão, e
   nada dele vira dado.
5. **Aplicar por tópico**, sempre por função do banco.
6. **`revalidatePath`** na página pública e no painel.

### Onde ele é registrado, e com quais valores

O passo a passo para quem for clicar está em `PROMPT-MERCADOPAGO.md`, no molde dos
prompts de extensão que o projeto já usa. O que segue aqui são os valores e a
razão de cada um.

O Mercado Pago entrega aviso para endereço cadastrado no painel deles, por
aplicação. Registro por código fica de fora nesta versão: dava para mandar
`notification_url` em cada cobrança, e o segredo que assina o aviso nasce no
painel do mesmo jeito, então o painel é o lugar de uma coisa só.

Caminho: **Suas integrações**, a aplicação, **Webhooks**, **Configurar
notificações**. A tela tem duas abas, **Modo produtivo** e **Modo de teste**, e
cada uma guarda URL, eventos e segredo próprios. Com chave de teste no
`MERCADOPAGO_ACCESS_TOKEN`, a aba que vale é a de teste, e o segredo a copiar é
o dela.

**URL**, enquanto o checkout vive na branch:

```
https://ministe-git-claude-app-check-e61198-nicollesothe-8601s-projects.vercel.app/api/pagamento/webhook
```

Quando isto chegar na `main`:

```
https://ministe.vercel.app/api/pagamento/webhook
```

**Eventos**, os que a tela oferecer entre estes três, que são os que
`tipoDoAviso` conhece:

| o que chega no corpo | o que o webhook faz |
| --- | --- |
| `payment` | Pix e débito, mais estorno e chargeback |
| `subscription_preapproval` | a assinatura nascendo, pausando, encerrando |
| `subscription_authorized_payment` | a renovação mensal do crédito |

Qualquer outro evento marcado por engano custa nada: o tópico cai em `outro`,
o webhook responde 200 e a reentrega para ali.

**A tela deles oferece menos caixas do que isso.** Conferido em agosto de 2026,
naquela aplicação: existiam `payment`, com o rótulo "Pagamentos (legacy)", e
`subscription_authorized_payment`, com o rótulo "Planos e assinaturas".
`subscription_preapproval` não aparecia em lugar nenhum, e é justamente ele que
abre o teste de sete dias.

Por isso a cobrança pede o aviso por dentro, e não só pelo painel: tanto o
`POST /preapproval` quanto o `POST /v1/payments` levam `notification_url`
apontando para este deploy. Vale por cobrança, chega assinado com o mesmo
segredo, e a idempotência de `avisos_pagamento` absorve a entrega dupla se o
painel também mandar. `lib/site.ts` tem o `urlDesteDeploy`, que numa prévia de
branch é o endereço da prévia, e nunca o domínio de produção: o aviso precisa
voltar para o código que criou a cobrança.

**O segredo** que a tela mostra depois de salvar vai para a Vercel como
`MERCADOPAGO_WEBHOOK_SECRET`, sem `NEXT_PUBLIC_`, e depois disso o projeto
precisa de um deploy novo: variável de servidor entra na função quando a função
nasce, e a que está rodando continua com o valor de antes.

**Como conferir sem esperar pagamento nenhum**, direto do terminal:

```
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  <URL>/api/pagamento/webhook \
  -H 'content-type: application/json' -d '{"type":"payment","data":{"id":"1"}}'
```

- **401** é o certo: a rota está de pé e recusou a assinatura ausente.
- **405** aparece no GET, porque só POST existe ali.
- **404** quer dizer que a URL aponta para um deploy sem esta rota, que é o caso
  da `main` enquanto a cobrança viver na branch.

### O que um 200 do simulador prova, linha por linha

Conferido em 21 de agosto de 2026, com o tópico `payment` e um id inventado:

```
mercadopago /v1/payments/123456 {"status":404,"motivo":"cobranca_ausente","dizem":"Payment not found"}
{"onde":"pagamento/webhook","topico":"pagamento","decisao":"sem acao: cobranca_ausente"}
```

São quatro provas numa linha só, e vale saber ler:

1. **O HMAC conferiu.** Sem linha `mercadopago aviso` antes, quer dizer que a
   assinatura passou.
2. **A chave de serviço funciona.** A trava de idempotência é um insert em
   `avisos_pagamento`, e ela acontece antes de qualquer outra coisa. Chave
   ausente teria virado 500 com `sem chave de servico`.
3. **O token de acesso funciona.** O `404 Payment not found` é resposta
   autenticada: token recusado devolveria 401, que vira `chave_ausente` e 500.
4. **O id inventado é tratado como definitivo.** 200 encerra a reentrega, em vez
   de deixar o Mercado Pago repetindo um aviso que nunca vai resolver.

Um detalhe para a próxima vez: o simulador manda sempre o mesmo `id`, e a trava
guarda esse id. Simular de novo com o mesmo número responde 200 na hora, com
`aviso repetido`, sem exercitar nada. Para repetir o teste de verdade, apague a
linha de `avisos_pagamento` ou use outro id.

### O manifesto do HMAC

Causa número um de "a assinatura nunca bate":

```
id:<data.id em minúsculas>;request-id:<x-request-id>;ts:<ts>;
```

Três detalhes que a documentação diz e que somem quando alguém escreve de
memória: o ponto e vírgula final existe, inclusive depois do `ts`; o `data.id`
vai em minúsculas, porque os ids novos em formato ULID chegam maiúsculos; e
pedaço com valor vazio sai fora inteiro, junto com o rótulo e o ponto e vírgula
dele.

A comparação usa `timingSafeEqual`. Comparar hash com `===` vaza, pelo tempo de
resposta, quantos caracteres iniciais o palpite acertou, e num endereço público
isso é um oráculo que responde a noite inteira.

Avisos com carimbo de tempo fora de uma janela de cinco minutos são recusados.
Sem isso, quem grampeasse um aviso legítimo uma vez poderia reenviar o mesmo
pacote, com a mesma assinatura, para sempre.

### A chave da trava é o id do aviso, e não o do objeto

O mesmo pagamento gera vários avisos ao longo da vida: aprovado hoje, estornado
em outubro. Os dois carregam o mesmo `data.id`. Travar por ele faria o estorno
ser engolido como repetição do aprovado, deixando no ar quem pediu o dinheiro de
volta. A chave é o `id` do topo do aviso, e dois testes em
`lib/pagamento/aviso.test.ts` ficam vermelhos quando a distinção some.

### A assinatura dobrada, e as quatro travas

A tela gera a chave de idempotência por tentativa e não tem onde gravá-la antes:
a 009 tira a escrita de `cobrancas` de quem está logado, e a 011 diz que a tela
não escreve a linha da assinatura. Então duas tentativas viram dois preapproval
diferentes no Mercado Pago, o segundo aviso bate no índice
`assinaturas_viva_idx`, e sem tratamento o webhook devolveria 500 para sempre
enquanto a pessoa seria cobrada duas vezes no oitavo dia.

Quatro travas, e nenhuma sozinha resolve:

1. O botão do checkout desabilita enquanto envia, o que pega o clique duplo.
2. O token do cartão é de uso único, então um POST duplicado literal é recusado
   pelo próprio Mercado Pago.
3. A Server Action lê a assinatura do dono antes de chamar o gateway, e recusa
   quando já existe uma viva.
4. **O webhook trata o `23505` como definitivo.** É a única que não depende de
   corrida. Ele consulta no Mercado Pago a assinatura que já estava gravada: se
   ela continua autorizada lá, a nova é duplicata de verdade e é cancelada no
   provedor; se ela já saiu do ar lá, a linha daqui é que ficou para trás, e
   então ela é encerrada e a nova assume.

### Falha passageira solta a trava

Provedor fora do ar e banco recusando a escrita devolvem 500, para o Mercado
Pago reentregar. Antes disso, a linha de `avisos_pagamento` é apagada: sem isso a
reentrega bateria na trava, devolveria 200 sem nunca ter aplicado nada, e o
cliente ficaria pago sem plano.

Falha definitiva (o id não existe lá, o aviso é de um tópico que não usamos)
devolve 200, porque reentregar daria o mesmo resultado.

### Por tópico

| tópico | o que faz |
| --- | --- |
| `subscription_preapproval` | `authorized` chama `abrir_assinatura`, com o fim do teste enquanto nenhuma cobrança saiu e com o fim do ciclo depois da primeira. `cancelled` e `paused` chamam `encerrar_assinatura`. |
| `subscription_authorized_payment` | a fatura da recorrência. Aprovada chama `registrar_cobranca_paga`, recusada chama `marcar_atraso`. **É este que estende o plano todo mês.** |
| `payment` | Pix, débito e estorno. `approved` registra, `refunded` e `charged_back` chamam `desfazer_cobranca`. |

A cobrança que a assinatura gerou **também** chega no tópico `payment`, e ali ela
é ignorada de propósito na aprovação: quem estende o ciclo do crédito é o tópico
da fatura, que sabe a data certa. Tratar os dois somaria um ciclo a mais. O
desempate sai de `operation_type: "recurring_payment"`, que o Mercado Pago
escreve na resposta. O estorno vale para os dois, porque é o único caminho que
traz de volta o dinheiro devolvido de uma cobrança recorrente.

### A recarga da tela de espera

A Server Action escreve nada, por desenho: o webhook é o único escritor. Então a
tela sabe que está esperando pelo `?aguardando=` no endereço, e sabe que parou
lendo a linha do próprio negócio, que `abrir_assinatura` acabou de escrever. O
`?desde=` carrega o instante do começo e sobrevive à recarga, então ela para
sozinha depois de dois minutos.

A recarga é um `setTimeout` de umas sessenta letras, e **não** um
`<meta http-equiv="refresh">`. O meta cai na regra `meta-refresh` do axe, que o
Lighthouse roda, e o `AGENTS.md` põe acessibilidade em 100. O comportamento é o
mesmo, e o link "Conferir agora" fica na tela dos dois jeitos, que é o que
atende quem estiver sem JavaScript.

A tela de espera e o formulário do cartão nunca aparecem juntos. Página que se
recarrega embaixo de quem está digitando um cartão seria o pior defeito do
produto.

Rodando na máquina, o Mercado Pago alcança o `localhost` de jeito nenhum, então
esta tela sempre vai até o limite dos dois minutos. Quem fecha o ciclo local é
`npm run aviso -- assinatura <id do preapproval>`.

### O `revalidatePath` não é acabamento

`app/[slug]/page.tsx` tem `revalidate = 3600`, e o rodapé e a letra da página
mudam conforme o plano. Sem o `revalidatePath`, a pessoa paga e continua vendo
"feito com entrais" por até uma hora. É o passo mais fácil de esquecer e o mais
visível para quem acabou de pagar.

Falha na revalidação **não** derruba o webhook: o dinheiro já entrou e o plano já
mudou, e pedir reentrega por causa de cache faria a cobrança ser aplicada de
novo.

## As tabelas

Vêm da correção `supabase/correcoes/009-cobranca.sql`.

### `assinaturas`

Uma linha por assinatura do negócio, viva ou morta.

| coluna | o que é |
| --- | --- |
| `negocio_id` | de quem é |
| `provedor` | `mercadopago` |
| `id_externo` | o preapproval. Nulo enquanto o gateway ainda não respondeu |
| `ciclo` | `mensal` ou `anual` |
| `meio` | `credito`, `debito` ou `pix` |
| `status` | `teste`, `ativa`, `em_atraso` ou `encerrada` |
| `valor_centavos` | inteiro, positivo |
| `teste_termina_em` | fim dos 7 dias |
| `ciclo_termina_em` | fim do período pago |
| `cancelada_em` | quando encerrou |

Dois índices valem mais que a tabela:

- `unique (provedor, id_externo) where id_externo is not null`, que segura o
  webhook que reenvia.
- `unique (negocio_id) where status in ('teste','ativa','em_atraso')`, que
  garante **uma assinatura viva por negócio no banco, e não na tela**. Sem ele,
  dois cliques no botão de assinar viram duas cobranças recorrentes, e quem
  descobre é o cliente na fatura.

### `cobrancas`

Uma linha por tentativa de pagamento.

| coluna | o que é |
| --- | --- |
| `id` | uuid gerado por nós **antes** de falar com o gateway |
| `id_externo` | o pagamento no Mercado Pago |
| `meio`, `valor_centavos` | |
| `status` | `aguardando`, `paga`, `recusada` ou `devolvida` |
| `pix_expira_em`, `pago_em` | |

O `id` fica sem default de propósito: id que o banco inventa depois já chegou
tarde para o que ele serve, que é ser a chave de idempotência mandada ao
gateway.

**O copia e cola do Pix não é guardado.** Segredo em repouso, com ganho pequeno,
e morto em trinta minutos.

### `avisos_pagamento`

`(provedor, id_evento)` como chave primária, e nada mais. É a trava de
idempotência. Não guarda corpo de requisição nem assinatura do gateway: são
dados de outro sistema, e a tabela existe para responder uma pergunta só, que é
"já vi este evento?".

## As funções, e por que o dono não alcança nenhuma

O gatilho `protege_cobranca` devolve o valor anterior de `plano`,
`plano_expira_em`, `status` e `dono_id` em toda escrita que não venha de
`service_role` ou de `postgres`. É o que impede o dono de se dar plano pago
sozinho, e o painel escreve direto no banco pelo navegador, então essa proteção é
a única que existe.

O preço disso é que precisa existir exatamente uma porta aberta. Essas funções
são a porta, todas `security definer`, todas com `revoke ... from public, anon,
authenticated` escrito na mão e `grant` só para `service_role`.

| função | correção | o que faz |
| --- | --- | --- |
| `abrir_assinatura` | 011 | a assinatura passa a existir, e o teste vira plano pago sem cobrar nada |
| `registrar_cobranca_paga` | 009 | grava a cobrança, deixa a assinatura ativa e empurra o vencimento |
| `encerrar_assinatura` | 009 | cancela. **Não toca em `plano_expira_em`** |
| `marcar_atraso` | 009 | carência de 5 dias depois de uma recusa |
| `desfazer_cobranca` | 009 | estorno e chargeback. O único lugar onde a data anda para trás |
| `numeros_do_negocio` | 009 | os números do painel. `security invoker`, para herdar a RLS de `eventos` |

A tela do checkout chama nenhuma delas. Ela cria a cobrança no Mercado Pago e
termina ali: quem escreve é o webhook, sempre.

`numeros_do_negocio` é a única com `grant to authenticated`, e é a única que não
mexe em dinheiro.

Em `assinaturas` e `cobrancas` a RLS tem **só política de select para o dono**,
nenhuma de escrita, que é o desenho de `eventos`. `avisos_pagamento` fica sem
política nenhuma, que é o desenho de `denuncias`: ninguém lê nem escreve pelo
navegador.

### A regra que evita cobrar o mesmo mês duas vezes

Em lugar nenhum aparece `plano_expira_em = plano_expira_em + interval`. O
vencimento é sempre um instante absoluto que veio do pagamento, aplicado assim:

```sql
plano_expira_em = greatest(coalesce(plano_expira_em, now()), p_ate)
```

A tabela `avisos_pagamento` é o cinto: o mesmo evento entra uma vez só. O
`greatest` é o suspensório, e é ele que continua valendo no caso que a tabela não
cobre: **dois eventos diferentes, os dois legítimos, chegando na ordem trocada.**
Somar intervalo nessa hora cobraria um mês que o cliente já tinha.

## Fim de assinatura

O teste de 7 dias **reusa a máquina que já existe**: durante o teste o negócio
fica `plano = 'pago'` com `plano_expira_em` em 7 dias. Ganha letra, números e
cotas, que é o sentido de um teste. Se a pessoa sumir, o vencimento rebaixa
sozinho. Se o dia 8 cobrar, o webhook empurra a data. Zero mecanismo novo, e
nenhum cron precisa existir.

| situação | `plano_expira_em` | assinatura |
| --- | --- | --- |
| cancela no teste | fica, expira no dia 7 | encerrada |
| cancela pago | **fica**, até o fim do ciclo pago | encerrada |
| cobrança recusada | `greatest(atual, agora + 5 dias)` | em atraso |
| retry deu certo | empurrado para o fim do ciclo | ativa |
| data passou | intacto, e `plano_de()` devolve gratuito | encerrada |
| estorno ou chargeback | **puxado para `now()`** | encerrada |

A carência de cinco dias existe porque tirar a página do ar na tarde em que o
cartão falhou é o pior momento possível. O cartão falha por limite, por troca de
número, por banco fora do ar, e quase sempre o cliente resolve em um ou dois
dias.

**Plano vencido volta a valer como gratuito sozinho**, por `plano_de()` no banco
e por `planoValido()` em `lib/plano.ts`. Os dois precisam existir: a política de
leitura pública entrega a coluna `plano` crua, que pode dizer `pago` com
`plano_expira_em` no passado, e quem monta a página é o TypeScript.

## Arrependimento, e o que a lei pede

O artigo 49 do Código de Defesa do Consumidor dá sete dias corridos para desistir
de uma compra pela internet, com devolução integral.

No mensal, o teste de 7 dias já cobre por construção, porque a primeira cobrança
cai no dia 8. No anual, que paga adiantado sem teste, a regra é explícita:
cancelamento em até 7 dias do pagamento devolve tudo, executado à mão pelo painel
do Mercado Pago na versão 1, com o webhook de `refunded` cuidando do
rebaixamento. Depois desse prazo, o plano segue valendo até o fim do período
pago.

O decreto do SAC pede que cancelar seja tão fácil quanto assinar, e o botão
dentro do painel resolve, sem precisar falar com ninguém.

O Decreto 7.962 pede o fornecedor identificado por "CNPJ ou CPF", nessa ordem e
com o CPF previsto para quem ainda é pessoa física. Isso sai de
`NEXT_PUBLIC_RESPONSAVEL` e `NEXT_PUBLIC_DOCUMENTO`, em `lib/marca.ts`, e o bloco
de identificação some enquanto as duas não existirem: documento legal com
identificação inventada é pior que documento sem ela. **Preencher antes de cobrar
o primeiro real.**

## Como testar

### Sem rede nenhuma

```
npm test
```

`aviso.test.ts` cobre a leitura do webhook, `assinatura.test.ts` o manifesto byte
a byte, `ciclo.test.ts` as três armadilhas de data (31 de janeiro mais um mês,
ano bissexto, fuso de São Paulo), `erros.test.ts` a regex que recusa palavra
negativa nas mensagens, e `precos.test.ts` a conta que sustenta a frase de venda.

### No banco

```
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/testes-rls.sql
```

Ou colando no SQL Editor do Supabase, que é o caminho mais curto. O resultado sai
como tabela, com a primeira linha dizendo `TODOS OS TESTES PASSARAM` e a
contagem. Entre as asserções: o mesmo pagamento aplicado duas vezes deixa a data
igual, o aviso fora de ordem mantém o vencimento maior, e aviso atrasado não
ressuscita assinatura encerrada.

### O webhook, sem cartão e sem túnel

```
npm run dev
MERCADOPAGO_WEBHOOK_SECRET=... npm run aviso -- payment 123456
```

O script calcula o HMAC por fora, com `node:crypto` direto, sem importar nada de
`lib/pagamento`. Então ele testa o manifesto de verdade, em vez de comparar o
código com ele mesmo. Rodar duas vezes com o mesmo id de evento tem que dar
"aviso repetido"; com `--novo` o id muda e o webhook processa de novo, que é o
caminho para conferir o `greatest`.

Os tópicos aceitos são `payment`, `assinatura` e `recorrente`.

### O MCP do Mercado Pago

`.mcp.json` na raiz declara o servidor MCP deles, em
`https://mcp.mercadopago.com/mcp`. Ele serve para três coisas que aparecem o
tempo todo nesta parte do produto: criar usuário de teste, conferir e configurar
webhook, e buscar na documentação viva deles, que é onde moram os valores que
mudam sem aviso (a lista de nomes de portador do sandbox, por exemplo).

**O arquivo tem endereço e mais nada.** Nenhuma credencial entra ali, porque a
autenticação é por OAuth no navegador, guardada fora do repositório. É por isso
que ele pode ser versionado sem susto.

Duas coisas que ele pede na primeira vez, e as duas são interativas: aprovar o
servidor do projeto, e completar o OAuth escolhendo o país. Sessão sem navegador
alcança nenhum dos dois passos.

### Um comando no lugar de meia hora de cliques

`npm run pagamento` exercita o caminho inteiro contra o sandbox de verdade, sem
navegador. Ele cria o token do cartão pela mesma chamada que os Secure Fields
fazem, e daí em diante chama as nossas funções de `lib/pagamento/`, e nunca a
API deles por fora: se o adaptador montar o corpo errado, o script quebra do
mesmo jeito que a tela quebraria.

    npm run pagamento                 os quatro desfechos do cartão, e o Pix
    npm run pagamento -- --usuarios   cria o par de contas de teste
    npm run pagamento -- --so-pix     só o Pix
    npm run pagamento -- --cancelar ID  encerra uma assinatura de teste

Ele lê `MERCADOPAGO_ACCESS_TOKEN` e `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` do
ambiente ou do `.env.local`, e avisa quando a credencial parece ser de produção,
porque cartão de teste com chave de produção volta recusado sempre e a recusa se
parece com defeito nosso.

O que ele deixa de fora, e por quê: os três iframes dos Secure Fields, que só
existem no navegador, e o webhook, que o Mercado Pago alcança na Vercel e nunca
na máquina. Para o webhook existe `npm run aviso`, e o script imprime a linha
pronta com o id da cobrança que ele acabou de criar.

### No sandbox do Mercado Pago

Usuários de teste por `POST /users/test_user`. **O desfecho do cartão é decidido
pelo nome do portador**: `APRO`, `OTHE`, `FUND`, `SECU`, `EXPI`, `CALL`, o que
exercita cada ramo de `erros.ts`. Conferir a lista na documentação viva, porque
esses valores mudam.

No débito, conferir os três desfechos do 3DS, e não só o feliz: desafio aprovado,
desafio recusado, e **desafio abandonado**, que é a pessoa fechar a janela do
banco no meio. O abandonado é o que fica preso em `aguardando` para sempre se
ninguém tratar, então a tela precisa de saída depois de alguns minutos.

## As chaves

| variável | onde vive | o que é |
| --- | --- | --- |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | navegador e servidor | pública por definição, vai no JavaScript dos Secure Fields |
| `MERCADOPAGO_ACCESS_TOKEN` | só servidor | cria assinatura e cobrança |
| `MERCADOPAGO_WEBHOOK_SECRET` | só servidor | confere o HMAC do aviso |
| `SUPABASE_SERVICE_ROLE_KEY` | só servidor | passa por cima da RLS inteira |

Virar para produção é trocar as duas primeiras pelas de produção e regravar o
segredo do webhook no painel do Mercado Pago. Nenhuma delas entra no banco, no
repositório ou numa conversa.

**A chave de serviço merece um parágrafo próprio.** Com ela, uma consulta lê e
escreve a página de qualquer pessoa e chama as funções que dão plano pago de
graça. O guarda no topo de `lib/supabase/servico.ts` é literalmente a única coisa
entre ela e um bundle de navegador: se o módulo for carregado no cliente, ele
quebra a página em vez de publicar a chave no HTML. Barulhento é o comportamento
certo, porque chave vazada só se recupera trocando a chave, e ninguém troca o que
não sabe que vazou.

Nenhuma tela, Server Action ou rota que a pessoa alcança importa esse arquivo. Se
um dia for mais fácil resolver um problema de RLS com a chave de serviço, o
problema é a política, e não a chave.

## O que fica de fora

- **Pix Automático**, o débito recorrente do Banco Central. Taxa bem menor que
  cartão, e é o motivo de a camada ficar atrás da interface `Gateway`: trocar de
  provedor, ou acrescentar um, é trocar um arquivo.
- **Cupom de desconto.**
- **Nota fiscal de serviço**, que é por município e fica fora do código.
- **Devolução automática no anual.** Na versão 1 o estorno é feito à mão no
  painel do Mercado Pago, e o webhook cuida do rebaixamento.
- **CAPTCHA na conta provisória.** Já registrado como adiado em
  `supabase/PROMPT-SUPABASE.md`, e dinheiro em jogo torna o abuso mais atraente.
