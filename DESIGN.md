# Padrão de design do Entrais

Este arquivo é regra, não sugestão. Vale para toda tela nova e todo retoque de
tela existente. `AGENTS.md` aponta para cá; as regras de escrita e as seis
armadilhas de layout de lá continuam valendo e não se repetem aqui.

## Antes de dar por pronta qualquer mudança visual

1. **Rodar a skill `webapp-testing`** (o navegador de verdade), nunca só ler o
   código. Abrir a tela em 375, 768, 1024 e 1440, tirar foto, e conferir os
   estados de formulário (vazio, inválido, válido, enviando). Mudança visual sem
   prova no navegador não está pronta.
2. **Passar pela skill de UI/UX** (o `ui-ux-pro-max`) e pelo padrão Apple (o
   `apple-design`, que indexa a HIG). O que essas skills cobram está destilado
   abaixo, para valer mesmo quando elas não estiverem carregadas.
3. **Reler contra as seis armadilhas de `AGENTS.md`** e contra a lista de "cara
   de IA" no fim deste arquivo.

Skills de referência, todas lidas e resumidas aqui:
`dickwu/apple-design-skill`, `nextlevelbuilder/ui-ux-pro-max-skill`,
`bencium/bencium-marketplace`, a `webapp-testing` de
`composio-community/awesome-codex-skills`, e o índice `ComposioHQ/awesome-claude-skills`.

## O padrão Apple, que é o da marca

Decidido com a dona e já no produto: branco e preto neutros, uma cor auxiliar, e
muito ar.

- **Fundo** `#f6f5f3` (quase-branco neutro), **superfície** `#ffffff`, **tinta**
  `#1b1b1b`, **apoio** `#68686d`.
- **Um acento só**, a marsala `#8f4451`, em pouca área: link, borda de foco,
  cartão em destaque. O ouro `#b08d3a` é fio decorativo, nunca texto.
- **Ação principal é preta** (`--c-texto`), não colorida. O verde do WhatsApp
  fica só no ícone. Uma cor forte por tela, nunca duas competindo.
- **Um gesto bold por tela, o resto quieto.** Se o acento brigar com o fundo,
  baixar a saturação, nunca trocar por outra cor.

## A camada de tokens (a construir, e o alvo)

Hoje o `:root` tem uma variável só. O alvo é uma camada de tokens em custom
properties, com a semântica separada da marca. Enquanto ela não existe, todo
valor novo já obedece às escalas abaixo, senão a próxima tela diverge de novo.

- **Tipo, sete degraus e nada fora deles:** `12 / 14 / 16 / 20 / 26 / 38 / 64`.
  Piso de **14px** para qualquer texto lido, **16px** para parágrafo (abaixo
  disso o Safari do iPhone dá zoom ao focar). Nada de `clamp()` sem degrau.
- **Duas famílias só:** Bricolage Grotesque no display, uma única fonte de texto
  carregada e declarada em todo lugar. A fonte do aparelho (`-apple-system`) é
  para o corpo do produto por decisão de desempenho, mas texto de venda que
  atravessa Mac, Windows e Android precisa de face declarada.
- **Espaço, uma escala:** `8 / 16 / 24 / 32 / 48 / 64 / 80 / 128`. Vão vertical
  entre seções sai daqui, para acabar com os buracos de 500 e 700px.
- **Raio, três:** `8` para campo e botão, `16` para cartão, `pill` para chip.
  Nada além disso.
- **Cor semântica, separada da marca:** erro em **vermelho próprio**, não na
  marsala; sucesso em verde. A marca não é o erro.

## Estados, acessibilidade e escrita

- **Estado nunca só por cor.** Sucesso e erro precisam diferir na borda, no
  ícone e no texto, não só na cor da letra. Borda verde com tique no sucesso,
  borda vermelha com alerta no erro.
- **Formulário fala com leitor de tela:** `role="status"` com
  `aria-live="polite"` no aviso, `aria-invalid` alternando no campo, `label` de
  verdade, foco visível.
- **Botão desabilita enquanto o estado for inválido**, com o motivo ao lado.
- **Contraste** mínimo 4,5:1. **`prefers-reduced-motion`** respeitado em toda
  animação. **Alt** em toda imagem: descritivo no que informa, `alt=""` no que
  é decoração.
- **Um rótulo por ação.** O mesmo botão não muda de nome entre seções.
- **Endereço da marca sai de `lib/marca.ts`** (`DOMINIO_PUBLICO`), nunca escrito
  à mão, senão a página promete um domínio e o link abre outro.

## O mockup tem que ser real

- Mostrar a **interface de verdade** (`componentes/`), com **dados de verdade**,
  como a tela inicial já faz. Se for representação, o gradiente segue o clima do
  negócio e nunca finge uma foto específica.
- **Uma moldura de celular por página**, no herói. Nas outras seções, mostrar a
  interface recortada, sem moldura, em tamanho maior.
- **Foto com direção de arte única:** mesma correção de cor, mesmo contraste,
  mesmo grão. Banco de imagem escolhido por assunto, com luz e temperatura
  diferentes em cada, tem cara de gerado.

## Cara de IA, a lista estendida

Além das seis de `AGENTS.md`:

7. Ritmo de seção repetido: rótulo em caixa alta, título de duas linhas,
   subtítulo de uma frase, grade de cards, sete vezes seguidas. Quebrar em pelo
   menos dois pontos (uma seção só imagem grande com legenda; uma em duas
   colunas assimétricas de largura total).
8. Fórmula de título "frase curta. fragmento." repetida. Alternar o ritmo: frase
   de quatro palavras ao lado de uma de vinte.
9. Paleta e par tipográfico do preset de 2025 (creme + grotesk pesado + card com
   sombra suave). Manter o creme, mas o cartão perde a sombra e ganha fio seco de
   1px, e o acento é aplicado em pouca área.
10. Zero fato verificável. Toda página de venda carrega pelo menos três: tempo
    para publicar, quantas páginas no ar, o que entra em cada plano.
11. Exemplo fictício apresentado como cliente real. Enquanto não houver cliente,
    a legenda diz "exemplos que montamos para mostrar como fica".
