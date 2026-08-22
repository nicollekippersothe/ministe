---
name: webapp-testing
description: Exercitar o Entrais num navegador de verdade com Playwright, para conferir se uma tela funciona, medir usabilidade no celular e no monitor, capturar a tela e ler o erro do console. Use sempre que a tarefa envolver "ficou bom no celular", "está desalinhado", "o botão não responde", "confere se funciona", revisão de layout, acessibilidade, ou qualquer conserto de tela que precise de prova em vez de leitura de código. Use também antes de dar por pronta qualquer mudança visual.
license: Complete terms in LICENSE.txt
---

# Exercitar o Entrais no navegador

Ler o código diz o que ele deveria fazer. Abrir a tela diz o que ele faz. Este
projeto já pagou caro pela diferença: os horários eram descartados na gravação e
a tela dizia "Alterações salvas", e ninguém percebeu lendo o código.

## Comece pelo script que já existe

```
node .claude/skills/webapp-testing/scripts/medir.mjs /criar /painel/negocio
```

Ele abre cada caminho no iPhone 13 e num monitor de 1440, salva as capturas e
confere as cinco coisas que costumam estar erradas: elemento vazando da largura,
alvo de toque abaixo de 44 pixels, campo com letra abaixo de 16px (abaixo disso
o Safari do iPhone dá zoom ao focar), imagem sem alt, e erro de console.

Ele existe porque cinco frentes deste projeto escreveram esse mesmo script por
conta própria. Rode ele antes de escrever qualquer script novo.

Opções: `--base` para outro endereço, `--saida` para outra pasta de capturas.
Sai com código 1 quando algo vaza da largura, porque isso é sempre defeito.

**Depois de rodar, abra as capturas com a ferramenta Read.** Medida acha o que
você sabia procurar; a imagem acha o resto. Um bloco desalinhado, uma frase que
sobra, um botão que sumiu abaixo da dobra: nada disso aparece em número.

## Três coisas deste ambiente que custam meia hora quando se descobre sozinho

**O Chromium está num caminho fixo**, e o padrão do Playwright aponta para outro
lugar que não existe aqui:

```
/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
```

O script já usa esse caminho, e respeita a variável `CHROMIUM` se ela existir. A
bateria do projeto, `npm run fluxo`, precisa dela na mão:

```
CHROMIUM=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell npm run fluxo
```

**O script precisa morar dentro de `/home/user/ministe`.** O pacote `playwright`
só resolve a partir do `node_modules` do projeto, então um script no `/tmp`
falha com "Cannot find package". Crie dentro do repositório, rode, e apague.

**O navegador daqui alcança só o `localhost`.** Endereço público volta com
`ERR_CONNECTION_RESET`, que é o proxy do contêiner e nunca o site fora do ar.
Para conferir produção, use `curl`, que passa pelo proxy corretamente.

## Quando o script não basta

Aí sim escreva um Playwright próprio, em Node, dentro do repositório. O molde
está em `testes/fluxo.mjs`, que é a bateria do projeto e a referência de estilo:
`passo("o que se espera", condição)`, uma linha por asserção.

O padrão que funciona é reconhecer antes de agir:

1. `await pagina.goto(url, { waitUntil: "networkidle" })`, sempre. Sem isso, a
   inspeção acontece antes do JavaScript rodar e mede a tela errada.
2. Tire uma captura ou leia o DOM para descobrir os seletores de verdade.
3. Só então clique e preencha.

Uma armadilha que já mordeu aqui: `input[value="restaurante"]` casa também com o
campo de busca cujo valor digitado é "restaurante". Prefira seletor por papel
(`input[type=radio][value=...]`) ou por texto visível.

## Antes de rodar a bateria inteira

`npm run fluxo` precisa do servidor de pé (`npm run dev`) e de um estado limpo.
O destino de arquivo local, `.dados/negocios.json`, guarda o que as rodadas
anteriores criaram, e endereço repetido faz a bateria parar no meio com
"endereço ocupado". Se ela quebrar num passo de cadastro, suspeite do estado
antes de suspeitar do código.

Rodar com outra frente editando arquivos ao mesmo tempo também produz falha que
some sozinha. Quando o resultado parecer estranho, rode de novo com o
repositório parado antes de investigar.

## O que provar, e não só olhar

Tela que grava precisa de prova de ida e volta: preencha, salve, recarregue, e
confira que o valor voltou. Este projeto teve dois defeitos exatamente aí, e os
dois passavam por qualquer olhada: a gravação que descartava os horários, e o
formulário que apagava o que a pessoa tinha escrito quando o servidor recusava.

Recusa também é caminho: force o erro de propósito e confira o que a tela diz e
o que ela preserva.
