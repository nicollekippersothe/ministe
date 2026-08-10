# Banca

Nome provisório.

Uma página pronta para o negócio local que hoje só tem Instagram: endereço,
horário, cardápio ou catálogo, e um botão de WhatsApp que já abre a conversa
escrita. O dono preenche um formulário e a página fica no ar em minutos.

## Estado atual: etapa 1 de 8

A página pública existe, com layout, um tema e dados de exemplo. Ainda não há
banco, login nem painel.

- `/` home provisória
- `/demo` a página pública de exemplo, com um negócio fictício

## Medidas da etapa 1

Lighthouse mobile, build de produção, duas execuções com o mesmo resultado:

| categoria       | nota |
| --------------- | ---- |
| Performance     | 99   |
| Acessibilidade  | 100  |
| Boas práticas   | 100  |
| SEO             | 100  |

LCP 2,2 s, TBT 60 ms, CLS 0.

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
npm test          # testes da lógica de horário
npm run build     # build de produção
npm run imagens   # regera as imagens de exemplo
```

## Stack

Next.js (App Router) com TypeScript, Tailwind CSS. Supabase e Vercel entram nas
próximas etapas.
