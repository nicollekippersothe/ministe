# Prompts para as extensões

Dois prompts, um para cada extensão. O Client ID e o Client Secret ficam de fora
deste arquivo de propósito: eles vão no chat, na hora, e nunca para dentro do
repositório.

---

# Prompt 1, para a extensão do Google Cloud

Copie daqui até a linha de corte.

```
Não precisa criar nada. É só conferir o cliente OAuth "entrais web", do projeto
que a gente configurou, e me responder três coisas:

1. Quais endereços estão em "Authorized redirect URIs"?

   O valor certo é o do Supabase, e não o do site:

     https://niekaszanicnrciuixnb.supabase.co/auth/v1/callback

   O Google devolve o token para o Supabase, e é o Supabase que devolve para o
   site depois. Se lá estiver ministe.vercel.app, o login falha sempre e
   nenhuma espera de propagação resolve. Se estiver errado ou faltando,
   acrescente o endereço acima e me avise.

2. Quais endereços estão em "Authorized JavaScript origins"? Só me diga o que
   tem, sem mudar nada.

3. Na tela de consentimento (OAuth consent screen), qual é o status de
   publicação e quais escopos estão listados?

   O esperado é: status "Em produção", e só os escopos não sensíveis
   (email, profile, openid). Se aparecer algum escopo além desses, me diga
   qual, sem remover.

Me responda com o que você encontrou em cada um dos três, copiando os valores
como estão.
```

---

# Prompt 2, para a extensão do Supabase

Copie daqui até o fim. **Troque as duas linhas do Google pelos seus valores
antes de mandar.**

```
Projeto Supabase: niekaszanicnrciuixnb (Entrais, São Paulo).

São duas partes: ajustes de autenticação e SQL. Faça na ordem e me diga o
resultado de cada item. Se alguma tela estiver com outro nome ou outro lugar,
descreva o que você está vendo em vez de escolher por mim.

PARTE 1, AUTENTICAÇÃO

Se você conseguir mexer pela Management API, os campos da configuração de auth
são estes (confira os nomes antes de aplicar, e me diga se algum não existir):

  external_anonymous_users_enabled = true
  external_google_enabled          = true
  external_google_client_id        = <COLE O CLIENT ID AQUI>
  external_google_secret           = <COLE O CLIENT SECRET AQUI>
  security_manual_linking_enabled  = true
  site_url                         = https://ministe.vercel.app
  uri_allow_list                   = https://ministe.vercel.app/**,http://localhost:3000/**
  external_email_enabled           = false

Se for pelo painel, o caminho é este, nesta ordem:

  1. Authentication → Sign In / Providers → Anonymous sign-ins: ligar.
     Deixe o rate limit no valor padrão.
  2. Authentication → Sign In / Providers → Google: ligar, colar Client ID e
     Client Secret, salvar.
  3. Authentication → o ajuste "Manual Linking" (ou "Allow manual linking"):
     ligar. Se não achar esse ajuste, me diga o que aparece nessa tela.
  4. Authentication → URL Configuration:
       Site URL: https://ministe.vercel.app
       Redirect URLs, duas entradas:
         https://ministe.vercel.app/**
         http://localhost:3000/**
  5. Authentication → Sign In / Providers → Email: desligar. POR ÚLTIMO, depois
     de o Google estar salvo e funcionando: se o Google falhar, o e-mail ainda é
     a porta de entrada.

Por que cada chave, para você conferir se o resultado faz sentido: a pessoa
monta a página numa conta provisória (anonymous sign-in) e entra com o Google só
na hora de publicar, quando a identidade é ligada na mesma conta pelo manual
linking e o auth.uid() continua o mesmo.

PARTE 2, SQL

No SQL Editor, nesta ordem, o conteúdo de cada arquivo do repositório
nicollekippersothe/ministe, branch main:

  a) supabase/correcoes/004-categoria.sql
  b) supabase/correcoes/005-rascunho-anonimo.sql
  c) supabase/testes-rls.sql

O terceiro é a bateria de testes. Roda dentro de uma transação e termina em
rollback, então não deixa nada gravado. O resultado vem como tabela, uma linha
por asserção, e a primeira linha diz TODOS OS TESTES PASSARAM com a contagem.
Se parar antes, o resultado é um erro começando em FALHOU: me mande essa linha
inteira, sem resumir e sem tentar consertar por conta própria.

CONFERIR NO FIM

  select tgname from pg_trigger
   where tgrelid = 'public.negocios'::regclass and not tgisinternal
   order by tgname;

Tem que aparecer negocios_protege_publicacao na lista.

  select p.proname,
         has_function_privilege('anon', p.oid, 'execute') as anon,
         has_function_privilege('authenticated', p.oid, 'execute') as logado
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('protege_publicacao', 'limpar_rascunhos_abandonados');

As quatro respostas têm que vir false.

  select column_name from information_schema.columns
   where table_schema = 'public' and table_name = 'negocios'
     and column_name in ('categoria', 'categoria_livre');

Tem que trazer as duas.

O QUE EU PRECISO DE VOLTA

  1. As três chaves: anonymous, google, email. Ligada ou desligada, uma a uma.
  2. Se o Manual Linking existe e ficou ligado.
  3. A última linha do testes-rls.sql.
  4. O resultado das três consultas de conferir.
```

---

## Depois, do lado de cá

```
CHAVE=sb_publishable_HjYdLIJlYd4BH184Q0ASGw_pY185bFH ./supabase/conferir-api.sh
```

A parte do login tem que sair assim:

```
Login
  ok    conta provisória, para montar antes de entrar   ligado
  ok    Google, para publicar                           ligado
  ok    e-mail desligado                                desligado
```

## Fica para depois, de propósito

- **CAPTCHA nas contas provisórias.** O Supabase recomenda, e faz sentido: sem
  ele, criar conta provisória é grátis e automatizável. O rate limit padrão
  segura o começo, e o CAPTCHA entra antes de abrir para o público de verdade,
  porque depende de conta em outro serviço (hCaptcha ou Turnstile).
- **Trocar o Client Secret do Google.** O atual circulou numa conversa. Assim
  que o login estiver funcionando: criar um novo no Google Cloud, salvar no
  Supabase, apagar o antigo.
- **Correção 003, a listagem do bucket.** Continua parada até existir a
  primeira imagem, que é quando ela passa a ter o que conferir.

---

# Prompt 3, para a extensão do Supabase: a cobrança

Vai depois do Prompt 2. **Os três arquivos estão na branch
`claude/app-checkout-logic-rkij8d`, e não na `main`.** Nenhum segredo do Mercado
Pago entra aqui: o token de acesso e a chave do webhook ficam nas variáveis de
ambiente do servidor, e nunca no banco nem neste arquivo.

Copie daqui até o fim.

```
Projeto Supabase: niekaszanicnrciuixnb (Entrais, São Paulo).

Só SQL desta vez, nenhum ajuste de painel. No SQL Editor, nesta ordem, o
conteúdo de cada arquivo do repositório nicollekippersothe/ministe, branch
claude/app-checkout-logic-rkij8d:

  a) supabase/correcoes/009-cobranca.sql
  b) supabase/correcoes/010-migrar-rascunho.sql
  c) supabase/correcoes/011-abrir-assinatura.sql
  d) supabase/testes-rls.sql

Os três primeiros são idempotentes: rodar de novo um que já foi aplicado não
muda nada e não dá erro. Se você já aplicou a 009 e a 010 numa passada
anterior, pode rodar só a 011 e a bateria.

Atenção à branch: na main esses três arquivos não existem, e a testes-rls.sql
de lá é a versão sem cobrança. Ela passaria verde sem testar nada disto, que é
o pior tipo de erro.

O quarto é a bateria de testes. Roda dentro de uma transação e termina em
rollback, então não deixa nada gravado. O resultado vem como tabela, uma linha
por asserção, e a primeira linha diz TODOS OS TESTES PASSARAM, 163 asserções.
Me mande essa primeira linha como ela aparecer na tela. Se parar antes, o
resultado é um erro começando em FALHOU: me mande essa linha inteira, sem
resumir e sem tentar consertar por conta própria.

A contagem sai do próprio banco, e não de uma constante escrita no arquivo.
Número diferente de 163 quer dizer asserção a mais ou a menos, e vale me
avisar mesmo com tudo verde.

O que a 009 traz: três tabelas novas (assinaturas, cobrancas,
avisos_pagamento), cinco funções novas, e o endereço `assinar` entrando na
lista de reservados. Quem escreve o plano pago é o webhook, com a chave de
serviço, e é por isso que as funções do dinheiro precisam terminar fechadas
para o navegador.

O que a 011 traz: uma função só, abrir_assinatura. As quatro da 009 tratam
dinheiro que já entrou, e faltava o começo: a assinatura recorrente passando a
existir, com o teste de sete dias virando plano pago antes do primeiro
centavo. Ela também escreve plano, então termina fechada igual às outras.

O que a 010 traz: uma função só, migrar_rascunho. O login com Google recusa
ligar uma identidade que já pertence a outra conta, e nesse caso o rascunho
ficaria preso na conta provisória. Ela move a página, e escreve dono_id, que é
campo protegido pelo mesmo gatilho do plano.

CONFERIR NO FIM

  select relname, relrowsecurity from pg_class
   where relnamespace = 'public'::regnamespace
     and relname in ('assinaturas', 'cobrancas', 'avisos_pagamento')
   order by relname;

Tem que trazer as três, as três com relrowsecurity = true.

  select p.proname,
         has_function_privilege('anon', p.oid, 'execute') as anon,
         has_function_privilege('authenticated', p.oid, 'execute') as logado
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('registrar_cobranca_paga', 'encerrar_assinatura',
                       'marcar_atraso', 'desfazer_cobranca',
                       'numeros_do_negocio', 'migrar_rascunho',
                       'abrir_assinatura')
   order by p.proname;

O esperado, linha por linha:

  abrir_assinatura          false  false
  desfazer_cobranca         false  false
  encerrar_assinatura       false  false
  marcar_atraso             false  false
  migrar_rascunho           false  false
  numeros_do_negocio        false  true
  registrar_cobranca_paga   false  false

Se registrar_cobranca_paga, abrir_assinatura ou migrar_rascunho vierem true em
qualquer uma das duas colunas, PARE e me avise antes de qualquer outra coisa.
As duas primeiras são as únicas coisas no banco que conseguem escrever plano
pago, e a terceira move a página de qualquer conta provisória. Abertas ao navegador, viram plano de graça
e página roubada para quem souber mandar um POST em /rest/v1/rpc.

  select indexname from pg_indexes
   where schemaname = 'public' and tablename = 'assinaturas'
   order by indexname;

Tem que aparecer assinaturas_externo_idx e assinaturas_viva_idx.

  select slug from public.slugs_reservados where slug = 'assinar';

Tem que trazer uma linha.

  select p.proname, pg_get_userbyid(p.proowner) as dono
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('registrar_cobranca_paga', 'abrir_assinatura',
                       'migrar_rascunho');

O esperado é postgres nas três. As duas são security definer, e o gatilho
protege_cobranca só deixa passar quem é 'postgres' ou 'service_role'. Com
outro dono, o gatilho devolve o valor anterior em silêncio: o cliente pagaria
sem receber o plano, e o rascunho não mudaria de dono.

O QUE EU PRECISO DE VOLTA

  1. A última linha do testes-rls.sql, com a contagem.
  2. As três tabelas, com o relrowsecurity de cada uma.
  3. A tabela inteira das sete funções, com as duas colunas.
  4. Os índices e o slug 'assinar'.
  5. O dono das três funções.
```
