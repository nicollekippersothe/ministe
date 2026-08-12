# Entrais

Uma página pronta para o negócio local que hoje só tem Instagram: endereço,
horário, cardápio ou catálogo, e um botão de WhatsApp que já abre a conversa
escrita. O dono preenche um formulário e a página fica no ar em minutos.

## Estado atual

A página pública e o painel funcionam, e dá para percorrer o fluxo inteiro:
editar, ver a prévia, publicar, tirar do ar. O banco ainda não entrou, então
os dados ficam num arquivo local.

| rota | o que é |
| --- | --- |
| `/` | tela inicial, que apresenta e leva para o cadastro |
| `/criar` | escolher nome e endereço, com conferência enquanto digita |
| `/entrar` | pedir o link de acesso por e-mail |
| `/[slug]` | a página pública, só entrega negócio publicado |
| `/painel` | estado da página, publicar e tirar do ar |
| `/painel/negocio` | nome, frase, WhatsApp, mensagens e endereço |
| `/painel/horarios` | horários, vários intervalos por dia |
| `/painel/acoes-botoes` | os botões do rodapé, que não são só WhatsApp |
| `/painel/aparencia` | escolher a combinação de letras da página |
| `/painel/previa` | a página como vai ficar, antes de publicar |
| `/denunciar` | denúncia de página, sem login e sem identificação |

## Contra golpe

Um produto que dá página pronta e botão para qualquer um vira ferramenta de
golpe se ninguém cuidar. As quatro frentes, iguais às das concorrentes:

1. **Link conferido.** Só http e https, sem encurtador, sem usuário antes do
   arroba e sem IP puro. Está em `lib/links.ts`, com teste.
2. **Endereço restrito.** Palavra de banco, Pix, cobrança ou atendimento é
   recusada por pedaço, então `pix-caixa` e `central-pix` caem junto com `pix`.
   No código e no banco.
3. **Denúncia.** Link no rodapé de toda página pública, inclusive nas pagas,
   levando para um formulário que não pede nome nem e-mail. O `status` do
   negócio já tem `suspenso` para tirar do ar sem apagar nada.
4. **Lista de risco automática.** Google Safe Browsing, escrita e desligada.
   Liga com a variável `GOOGLE_SAFE_BROWSING`.

## Publicar como vitrine

Enquanto o login não existe, dá para publicar com segurança em modo vitrine:
as páginas de exemplo e a tela inicial funcionam, e as rotas de painel e
cadastro respondem 404. Também deixa os dados só de leitura, o que resolve o
fato de o disco da Vercel ser somente leitura.

Na Vercel, importar o repositório e definir duas variáveis:

```
MODO_VITRINE=1
NEXT_PUBLIC_URL_BASE=https://o-endereco-que-a-vercel-der
```

Quando o Supabase Auth entrar, é só apagar `MODO_VITRINE`.

> **Ainda não tem login.** Quem chegar em `/painel` edita, e o e-mail do link
> de acesso não é enviado (falta o Supabase Auth e um provedor de e-mail).
> Isso vale enquanto roda só na sua máquina. Não subir para a internet antes
> da etapa 4.

## Medidas da página pública

Lighthouse mobile, build de produção, com o cache quente:

| categoria       | página do negócio | tela inicial |
| --------------- | ----------------- | ------------ |
| Performance     | 92 a 99           | 95 a 98      |
| Acessibilidade  | 100               | 100          |
| Boas práticas   | 100               | 100          |
| SEO             | 100               | 100          |

CLS 0 nas duas. A variação em performance é ruído da máquina que roda a
medição, não do código. As telas de cadastro e o painel também dão 100 em
acessibilidade.

A página pública não tem nenhum componente de cliente. O único JavaScript
próprio são 1,2 KB inline que recalculam o selo de "aberto agora", porque a
página fica em cache e o HTML envelhece.

## Tela inicial

Mostra o produto, não fala sobre ele. O telefone na abertura e as três peças
da seção seguinte são os componentes de verdade, renderizados no servidor com
os dados do negócio de exemplo. Se a página do cliente mudar, a tela inicial
muda junto.

## Letras

A página do negócio tem cinco combinações de fonte, escolhidas em
`/painel/aparencia`, e baixa só a escolhida: dois arquivos, nunca dez.

O painel, a tela inicial e o cadastro não baixam fonte nenhuma. Eles usam a do
próprio aparelho, que no iPhone é a San Francisco. Custa zero byte e parece
nativo. `testes/fluxo.mjs` conta os arquivos por rota para isso não regredir.

## Rodando

```
npm install
npm run dev
```

Abrir http://localhost:3000/demo

```
npm test          # 48 testes de horário, formatação, link e endereço
npm run fluxo     # 38 passos no navegador, com o servidor rodando
npm run build     # build de produção
npm run imagens   # regera as imagens de exemplo
```

Os dados do painel ficam em `.dados/negocios.json`, fora do git. Apagar o
arquivo devolve tudo para o negócio de exemplo.

## Banco

O schema com RLS está escrito e testado num Postgres local, em `supabase/`.
Falta aplicar num projeto Supabase de verdade. Ver `supabase/LEIA-ME.md`.

## Stack

Next.js (App Router) com TypeScript, Tailwind CSS. Supabase e Vercel entram nas
próximas etapas.
