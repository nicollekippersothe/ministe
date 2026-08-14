# Prompt para a extensão do Supabase

Copie daqui para baixo e cole no chat que tem acesso ao Supabase.

O Client ID e o Client Secret do Google ficam de fora deste arquivo de
propósito: eles vão para o chat, na hora, e nunca para dentro do repositório.

---

Projeto Supabase: `niekaszanicnrciuixnb` (Entrais, São Paulo).

São seis tarefas. Faça na ordem e me diga o resultado de cada uma. Se alguma
tela estiver com outro nome ou outro lugar, descreva o que você está vendo em
vez de escolher por mim.

## 1. Ligar a conta provisória

Authentication → Sign In / Providers → **Anonymous sign-ins**: ligar.

É o que permite a pessoa montar a página antes de ter conta. Ela vira um
usuário de verdade em `auth.users`, com `is_anonymous` no token, então toda a
RLS continua valendo palavra por palavra.

Deixe o rate limit de anonymous sign-ins no valor padrão.

## 2. Ligar o Google

Authentication → Sign In / Providers → **Google**: ligar, e colar o Client ID
e o Client Secret que eu mando no chat.

## 3. Ligar o Manual Linking

Authentication → o ajuste chamado **Manual Linking** (ou "Allow manual
linking"): ligar.

É o que permite `linkIdentity`, que é como a conta provisória vira conta do
Google mantendo o mesmo `auth.uid()`. Sem isso a pessoa perderia o rascunho ao
entrar. Se você não achar esse ajuste, me diga o que aparece nessa tela.

## 4. Endereços

Authentication → URL Configuration:

- Site URL: `https://ministe.vercel.app`
- Redirect URLs: `https://ministe.vercel.app/**` e `http://localhost:3000/**`

## 5. Desligar o e-mail

Authentication → Sign In / Providers → **Email**: desligar.

Por último, depois de o Google estar salvo e funcionando.

## 6. SQL Editor

Rodar, nesta ordem, o conteúdo de cada arquivo do repositório
`nicollekippersothe/ministe`, branch `main`:

1. `supabase/correcoes/004-categoria.sql`
2. `supabase/correcoes/005-rascunho-anonimo.sql`
3. `supabase/testes-rls.sql`

O terceiro é a bateria de testes. Ele roda dentro de uma transação e termina em
`rollback`, então não deixa nada gravado. Tem que terminar com a mensagem
`TODOS OS TESTES PASSARAM`. Se parar antes, me mande a linha do `FALHOU`
inteira, sem resumir.

## Conferir no fim

```
select tgname from pg_trigger
 where tgrelid = 'public.negocios'::regclass and not tgisinternal
 order by tgname;
```

Tem que aparecer `negocios_protege_publicacao` na lista.

```
select p.proname,
       has_function_privilege('anon', p.oid, 'execute') as anon,
       has_function_privilege('authenticated', p.oid, 'execute') as logado
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('protege_publicacao', 'limpar_rascunhos_abandonados');
```

As quatro respostas têm que vir `false`.

## O que eu preciso de volta

1. Se as três chaves ficaram ligadas ou desligadas (anonymous, google, email).
2. Se o Manual Linking existe e ficou ligado.
3. A última linha do `testes-rls.sql`.
4. O resultado das duas consultas de conferir.

---

## Depois, do lado de cá

```
CHAVE=sb_publishable_HjYdLIJlYd4BH184Q0ASGw_pY185bFH ./supabase/conferir-api.sh
```

A parte do login tem que ficar assim:

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
