# Prompt para a extensão: o webhook do Mercado Pago

Vai depois de o checkout estar no ar na branch. É a metade da cobrança que mora
fora do repositório: sem ela o Pix é pago e o plano continua no gratuito, porque
ninguém avisa o nosso servidor.

**Nenhum segredo entra neste arquivo, e nenhum entra no chat.** A assinatura
secreta que o painel do Mercado Pago mostra vai direto para as variáveis de
ambiente da Vercel. Segredo colado numa conversa fica na conversa.

Copie daqui até o fim.

```
São três partes: o painel do Mercado Pago, a variável na Vercel, e a conferência.
Faça na ordem e me diga o resultado de cada uma. Se alguma tela estiver com
outro nome ou outro lugar, descreva o que você está vendo em vez de escolher
por mim.

PARTE 1, O PAINEL DO MERCADO PAGO

Caminho: Suas integrações, a aplicação do Entrais, Webhooks, Configurar
notificações.

A tela tem duas abas, "Modo produtivo" e "Modo de teste". Cada uma guarda URL,
eventos e segredo próprios. A que vale agora é a DE TESTE, porque o token de
acesso configurado é de teste. Se você mexer na produtiva por engano, o segredo
que ela mostra é outro e nada vai conferir.

URL, exatamente esta, sem barra no fim:

  https://ministe-git-claude-app-check-e61198-nicollesothe-8601s-projects.vercel.app/api/pagamento/webhook

É o endereço da branch de propósito. O domínio de produção roda outra versão do
código, onde essa rota ainda não existe, e cadastrar ele agora faria o Mercado
Pago marcar o webhook como falhando.

Eventos, três, e só esses três:

  Pagamentos                 (payment)
  Assinaturas                (subscription_preapproval)
  Cobranças de assinatura    (subscription_authorized_payment)

Os nomes na tela deles mudam de tempos em tempos, e a tela oferece menos caixas
do que os três acima. Em agosto de 2026 existiam duas: "Pagamentos (legacy)",
que é o `payment`, e "Planos e assinaturas", que é o
`subscription_authorized_payment`. Marque as que existirem, escolhendo pelo
valor entre parênteses e não pelo rótulo. O `subscription_preapproval` que
faltar está resolvido do lado do código, que pede o aviso por cobrança.

Evento a mais marcado por engano custa nada: o nosso lado responde 200 e segue.

Salve. Depois de salvar, a tela mostra a assinatura secreta, uma vez.

PARTE 2, A VARIÁVEL NA VERCEL

Copie a assinatura secreta e cole direto na Vercel, no projeto ministe:

  Settings, Environment Variables, Add New

  Nome:      MERCADOPAGO_WEBHOOK_SECRET
  Ambientes: Production e Preview
  Valor:     a assinatura secreta

Três coisas importam aqui:

  1. O nome vai SEM o prefixo NEXT_PUBLIC_. É esse prefixo, e não a marca
     "Sensitive", que decide o que o Next embute no JavaScript que vai para o
     navegador. Com o prefixo, o segredo do webhook fica visível no código
     fonte de toda página.
  2. Não me mande o valor no chat, nem repita ele na sua resposta. Ele vai do
     painel deles para o painel da Vercel e para de existir para o resto do
     mundo.
  3. Confira se ele foi colado sem espaço e sem quebra de linha no fim.

Depois de salvar a variável, o projeto precisa de um deploy novo: variável de
servidor entra na função quando a função nasce, e a que está rodando continua
com o valor de antes.

  Deployments, o deployment mais recente da branch
  claude/app-checkout-logic-rkij8d, menu de três pontos, Redeploy.

ATENÇÃO: o deployment da BRANCH, e não o de produção. Já aconteceu de o
redeploy sair em produção e o teste seguinte medir a versão errada do código.
Confira que a linha diz claude/app-checkout-logic-rkij8d antes de clicar.

PARTE 3, A CONFERÊNCIA

O painel do Mercado Pago tem um simulador de notificação, na mesma tela de
webhooks. Use ele com qualquer número no campo de id, depois que o redeploy
terminar, e me diga o código de resposta que ele mostrar.

A leitura, e ela diz exatamente onde está o problema:

  200  o segredo confere e o token de acesso funciona. É o resultado bom.
  401  o segredo está diferente do que a Vercel tem. Refaça a parte 2, ou gere
       um segredo novo no painel deles e refaça as duas.
  500  o segredo confere, e alguma coisa depois dele falhou. Pode ser o token
       de acesso ou a chave do Supabase. Me avise, que eu leio o log da Vercel
       e digo qual dos dois.
  404  a URL está apontando para um deploy sem esta rota, quase sempre o
       domínio de produção em vez do endereço da branch.

O QUE EU PRECISO DE VOLTA

  1. Se as duas abas existem, e em qual você salvou.
  2. A URL como ficou salva, copiada da tela.
  3. Quais eventos ficaram marcados, um a um.
  4. Que a variável foi salva na Vercel, com o nome e os ambientes. O valor não.
  5. Que o redeploy foi na branch, e se terminou.
  6. O código que o simulador devolveu.
```
