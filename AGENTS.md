# Entrais

Micro-SaaS que dá uma página pronta para quem vende o próprio trabalho e hoje
só tem Instagram: o que a pessoa faz, quanto custa, quando atende, e um botão
de WhatsApp que já abre a conversa escrita.

**Quem está no centro é a profissional autônoma**: a psicóloga, o fotógrafo, a
manicure, o personal, a advogada. Loja e restaurante cabem, e as trinta e cinco
categorias continuam inteiras, mas quem decide o texto de tela, a ordem das
perguntas e o exemplo que abre em `/demo` é quem trabalha por conta própria.
Isso é decisão de produto, e não gosto: quem tem loja com ponto na rua já
aparece no mapa, e quem trabalha sozinho tem só o perfil de rede social e o
nome dele.

O nome da marca e o domínio ficam em `lib/marca.ts`, um lugar só. Não escrever
nenhum dos dois direto no meio do texto de tela.

## Regras de escrita

Nunca usar travessão, nem no produto nem em resposta nem em commit. Usar
vírgula, dois pontos, parênteses ou ponto final.

Nada de palavra negativa no texto de tela. Nem "não", nem "sem", nem "nunca",
nem verbo de falta. Cada frase diz o que existe, não o que falta.

| em vez de | escrever |
| --- | --- |
| Você não precisa saber o que é SEO | A marcação sai pronta, escrita para o buscador |
| Sem instalar nada | Abre no navegador do celular |
| Não perde o link antigo | O link antigo continua levando para a página |
| Sem tela em branco | A página já vem montada |

Vale para a tela inicial, para o produto e para a tela de erro. Comentário de
código e commit ficam de fora: ali explicar o que não acontece é informação.

## Regras de layout

Seis armadilhas que deixam qualquer interface com cara de gerada por máquina.
Conferir antes de dar por pronta qualquer tela nova:

1. Nada de degradê roxo e azul de fundo. Fundo neutro e quente.
2. Nada de emoji fazendo papel de ícone. Ícone é desenho vetorial próprio.
3. Nada de cartão com tarja colorida na borda esquerda.
4. Nada de seção de abertura genérica, com título grande, subtítulo e dois
   botões, e o produto só aparecendo lá embaixo. Mostrar o produto junto.
5. Nada de grade simétrica de três colunas com ícone dentro de bolinha.
   Layout assimétrico, do tamanho que cada assunto pede.
6. Nada de ilustração vetorial abstrata de gente trabalhando.

Na tela inicial, as peças mostradas são os componentes de verdade
(`componentes/inicial/`), com os dados de verdade. Assim a propaganda não
consegue divergir do produto.

## Regras do produto

1. Celular primeiro, de verdade. O painel também vai ser usado no celular.
2. A página pública é renderizada no servidor e carrega o mínimo de JavaScript.
   Meta medida no Lighthouse mobile: 90 ou mais em performance.
3. SEO por negócio: title, meta description, Open Graph e JSON-LD do tipo
   LocalBusiness em toda página pública.
4. Acessibilidade: contraste conferido, foco visível, alt em toda imagem,
   formulário com label de verdade. Meta: 100 no Lighthouse.
5. Escolher a letra é recurso do plano pago. A letra padrão precisa ser boa o
   suficiente para a página gratuita já parecer profissional, senão ninguém
   compartilha e o produto perde a única aquisição que tem.
6. Sem dado inventado. Campo vazio faz a seção sumir, nunca vira "em breve"
   nem exemplo.
7. Todo link que o dono digita passa por `conferirLink`. Campo novo de URL sem
   passar por lá é buraco de golpe, não é detalhe de validação.

## Como rodar

```
npm run dev       # desenvolvimento
npm run build     # build de produção
npm test          # testes de horário e de formatação
npm run fluxo     # teste de fluxo no navegador, precisa do servidor rodando
npm run fotos     # baixa as fotos de exemplo (Openverse, CC0)
npm run logos     # redesenha os monogramas dos negócios de exemplo
```

## Onde está o quê

- `app/[slug]` é a página pública, e só entrega negócio publicado.
- `app/painel` é o painel do dono. **Ainda sem login**, então não pode ir para
  a internet antes da etapa 4.
- `componentes/PaginaPublica.tsx` é a página pública inteira, usada também pela
  prévia do painel.
- `lib/dados.ts` é a camada de dados. Hoje grava num arquivo local. Quando o
  Supabase entrar, só este arquivo muda.
- `lib/horarios.ts` concentra toda conta de fuso. O servidor monta uma linha do
  tempo em epoch e o navegador só compara número, então a página pode ficar em
  cache sem o selo de "aberto agora" envelhecer.
- `lib/fontes.ts` tem as cinco combinações de letra. Nenhuma é pré-carregada,
  senão o Next baixa todas em toda rota. Só o CSS aplicado puxa o arquivo.
- `lib/acoes.ts` resolve os botões do rodapé. O WhatsApp é o padrão, não a
  única opção: dá para apontar o principal para iFood, agenda ou qualquer link.
- `lib/slug.ts` tem as regras do endereço, espelhando as duas listas do banco:
  a de rotas reservadas e a de palavras que fazem o endereço parecer banco ou
  cobrança, conferida por pedaço separado por hífen.
- `lib/links.ts` é o portão de todo link digitado. Recusa esquema que não seja
  http, encurtador, usuário antes do arroba e IP puro, e devolve o endereço
  normalizado. A conferência na Google Safe Browsing está escrita e desligada,
  esperando `GOOGLE_SAFE_BROWSING`.
- `app/denunciar` é a denúncia, sem login e sem identificação, aberta pelo link
  no rodapé de toda página pública, inclusive as pagas.
- `lib/tipos.ts` espelha o schema que vai para o Supabase.
- A imagem de prévia do link não pode embutir arquivo de fonte enquanto rodar
  no mesmo processo que o otimizador de imagem do Next. O motivo e as duas
  saídas estão comentados em `app/[slug]/opengraph-image.tsx`.
- `MODO_VITRINE=1` fecha painel e cadastro com 404 e deixa os dados só de
  leitura. É o que permite publicar antes de existir login. Ver `lib/site.ts`.
- `supabase/` tem o schema, os testes de RLS e o Storage. Nada foi aplicado num
  projeto ainda, mas o schema roda e passa nos testes num Postgres local.
  Ver `supabase/LEIA-ME.md`.

## Etapas

1. Página pública de exemplo no ar. **Feito.**
2. Supabase conectado, schema criado, RLS testada. **SQL escrito e testado
   local, falta aplicar no projeto.**
3. Página pública lendo do banco por slug. **Rota pronta, lendo do arquivo
   local em vez do banco.**
4. Login por link mágico e painel editando os campos básicos. **Painel e telas
   de cadastro feitos, falta ligar o login de verdade.**
5. Upload de imagens.
6. Catálogo e links.
7. Contagem de visitas e cliques. **Feita.**
8. Os outros dois temas.

## Fora da versão 1

Pagamento do cliente final, pedido ou carrinho, domínio próprio, multiusuário,
app nativo, chat interno, integração com iFood ou Instagram.

A cobrança da assinatura é própria, com o Mercado Pago por trás: crédito com
sete dias de teste e renovação automática, Pix e débito comprando um ciclo à
vista. A tela é nossa do começo ao fim, sem redirecionamento. Quem escreve
`plano` e `plano_expira_em` é o webhook, com a chave de serviço, e é a única
porta que o gatilho `protege_cobranca` deixa aberta. Ver `COBRANCA.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
