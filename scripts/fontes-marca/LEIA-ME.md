# Fontes da marca

`Archivo` e `IBM Plex Sans`, as duas do guia de marca, no subconjunto latino
que o Google Fonts serve. A IBM Plex é variável, então um arquivo só cobre os
pesos 400 e 600.

Ficam versionadas de propósito: `npm run mockup` monta material de marca, e
material de marca não pode sair com a letra errada porque a máquina estava sem
internet no dia. As duas são licenciadas em SIL Open Font License, que permite
redistribuir.

**Não são usadas pelo produto.** A página do cliente e o painel usam a fonte do
aparelho, e a página do negócio baixa só a combinação que o dono escolheu, em
`lib/fontes.ts`. Estas aqui só entram nas peças geradas por script.
