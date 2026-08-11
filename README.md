# Banca

Nome provisório.

Uma página pronta para o negócio local que hoje só tem Instagram: endereço,
horário, cardápio ou catálogo, e um botão de WhatsApp que já abre a conversa
escrita. O dono preenche um formulário e a página fica no ar em minutos.

## Estado atual

A página pública e o painel funcionam, e dá para percorrer o fluxo inteiro:
editar, ver a prévia, publicar, tirar do ar. O banco ainda não entrou, então
os dados ficam num arquivo local.

| rota | o que é |
| --- | --- |
| `/` | home provisória |
| `/[slug]` | a página pública, só entrega negócio publicado |
| `/painel` | estado da página, publicar e tirar do ar |
| `/painel/negocio` | nome, frase, WhatsApp, mensagens e endereço |
| `/painel/horarios` | horários, vários intervalos por dia |
| `/painel/previa` | a página como vai ficar, antes de publicar |

> **O painel ainda não tem login.** Quem chegar em `/painel` edita. Isso vale
> enquanto roda só na sua máquina. Não subir para a internet antes do link
> mágico, que é a etapa 4.

## Medidas da página pública

Lighthouse mobile, build de produção, com o cache quente:

| categoria       | nota   |
| --------------- | ------ |
| Performance     | 94 a 99 |
| Acessibilidade  | 100    |
| Boas práticas   | 100    |
| SEO             | 100    |

LCP 2,2 s a 2,7 s, TBT 60 ms a 180 ms, CLS 0. A variação é ruído da máquina
que roda a medição, não do código.

Transferido na primeira visita: 253 KB, sendo 142 KB de JavaScript (a base do
React que o Next carrega mesmo sem componente de cliente), 67 KB de fontes,
24 KB de imagens, 13 KB de HTML e 6 KB de CSS.

A página não tem nenhum componente de cliente. O único JavaScript próprio são
1,2 KB inline (787 bytes de script e 406 bytes de dados) que recalculam o selo
de "aberto agora", porque a página fica em cache e o HTML envelhece.

## Rodando

```
npm install
npm run dev
```

Abrir http://localhost:3000/demo

```
npm test          # 23 testes de horário e de formatação
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
