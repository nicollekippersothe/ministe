-- =============================================================================
-- Correção 005: o rascunho começa antes da conta, e publicar pede conta
-- =============================================================================
-- Rodar no SQL Editor. Não precisa da senha do banco.
--
-- O que muda no produto
-- ---------------------
-- Antes: a pessoa precisava de conta para montar a primeira página. Login na
-- frente de tudo é onde a maioria desiste, e era também o que segurava o
-- produto inteiro esperando a configuração do Google ficar pronta.
--
-- Agora: a pessoa monta a página numa conta provisória (o "anonymous sign-in"
-- do Supabase, que dá um auth.uid() de verdade, com is_anonymous no token) e
-- entra com o Google só na hora de publicar. A identidade do Google é ligada
-- na mesma conta, então o dono_id continua o mesmo e o rascunho vira página no
-- ar sem copiar nada de lugar.
--
-- Isso não afrouxa a RLS: conta provisória é usuário como qualquer outro em
-- auth.users, e todas as políticas continuam valendo, palavra por palavra.
--
-- O que este arquivo acrescenta
-- -----------------------------
-- 1. Publicar exige conta confirmada, conferido no banco e não só na tela.
-- 2. Uma faxina para o rascunho provisório que ficou parado.
--
-- Depende da correção 004 e do painel do Supabase com "Anonymous sign-ins"
-- ligado. Rodar antes de ligar a chave é seguro: a regra fica de pé esperando.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Publicar pede conta confirmada
-- -----------------------------------------------------------------------------
-- A tela vai levar para o Google antes de deixar publicar, mas tela é conforto.
-- Quem manda um PATCH direto no PostgREST passa longe da tela, e é por isso que
-- a regra mora aqui.
--
-- Vale para a página no ar, que é o que carrega o endereço do produto e a
-- reputação dele junto. Golpista com conta provisória e descartável é
-- exatamente o que a gente evita deixando o Google no caminho.
--
-- Gatilho próprio, separado do protege_cobranca, porque os dois têm motivos
-- diferentes: aquele guarda dinheiro, este guarda quem aparece na internet.
--
-- security invoker (o padrão) de propósito, igual ao protege_cobranca: é o que
-- deixa current_user valer o papel de quem chamou, e é o que abre passagem para
-- a chave de serviço, que é só do servidor.
create or replace function public.protege_publicacao()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user in ('service_role', 'postgres') then
    return new;
  end if;

  -- Sem token (conexão direta ao banco) auth.jwt() vem nulo, e aí não é conta
  -- provisória. O coalesce é o que garante isso.
  if new.publicado
     and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'publicar pede uma conta confirmada'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

drop trigger if exists negocios_protege_publicacao on public.negocios;
create trigger negocios_protege_publicacao
  before insert or update on public.negocios
  for each row execute function public.protege_publicacao();

-- -----------------------------------------------------------------------------
-- 2. Faxina do rascunho provisório parado
-- -----------------------------------------------------------------------------
-- Conta provisória é barata de criar, então ela acumula: cada pessoa que abre
-- o cadastro por curiosidade deixa uma para trás, com um endereço reservado
-- junto. Trinta dias parada é tempo de sobra, e apagar a conta leva o negócio
-- pela chave estrangeira, devolvendo o endereço para quem quiser.
--
-- Conta que entrou com o Google deixa de ser provisória, e some desta faxina.
-- Página no ar também fica de fora, mesmo em conta provisória, que é uma
-- situação que a regra de cima já impede de existir e ainda assim é conferida
-- aqui: faxina só apaga o que ela tem certeza.
--
-- Ninguém chama isto pela API. É para rodar no SQL Editor, ou num agendamento
-- do pg_cron quando fizer sentido.
create or replace function public.limpar_rascunhos_abandonados(
  p_dias integer default 30
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp, auth
as $$
declare
  v_apagados integer;
begin
  delete from auth.users u
   where u.is_anonymous
     and u.created_at < now() - make_interval(days => p_dias)
     and not exists (
       select 1 from public.negocios n
        where n.dono_id = u.id and n.publicado
     );
  get diagnostics v_apagados = row_count;
  return v_apagados;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Fechar as duas funções novas, na mão
-- -----------------------------------------------------------------------------
-- Função nova nasce aberta por dois caminhos, e os dois valem aqui:
--
-- 1. O EXECUTE para PUBLIC que o Postgres dá a toda função.
-- 2. O EXECUTE nominal para anon e authenticated que o Supabase dá por um
--    default privilege próprio, para publicar as funções em /rest/v1/rpc.
--
-- O schema.sql tem um "alter default privileges ... revoke execute on functions
-- from public" que parecia resolver o primeiro para sempre. Ele não resolve: no
-- Postgres 16 essa linha não guarda nada em pg_default_acl, e a função seguinte
-- continua nascendo com PUBLIC podendo executar. Medido, não deduzido. O que
-- fecha de verdade é o "revoke execute on all functions", que passa por cima do
-- que já existe e por isso precisa rodar depois de as funções existirem.
--
-- Consequência para todo arquivo de correção: função nova pede revoke escrito
-- na mão, aqui mesmo. A bateria em testes-rls.sql confere isso e foi ela que
-- pegou este caso.
revoke execute on function public.protege_publicacao()
  from public, anon, authenticated;
revoke execute on function public.limpar_rascunhos_abandonados(integer)
  from public, anon, authenticated;

grant execute on function public.limpar_rascunhos_abandonados(integer)
  to service_role;

commit;

-- =============================================================================
-- Conferir
-- =============================================================================
-- 1. O gatilho existe:
--
--   select tgname from pg_trigger
--    where tgrelid = 'public.negocios'::regclass and not tgisinternal;
--
--   Tem que trazer negocios_protege_publicacao junto com os outros.
--
-- 2. A faxina fica fora do alcance do visitante:
--
--   select p.proname,
--          has_function_privilege('anon', p.oid, 'execute') as anon,
--          has_function_privilege('authenticated', p.oid, 'execute') as logado
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname = 'limpar_rascunhos_abandonados';
--
--   As duas colunas têm que vir false.
--
-- 3. A bateria inteira continua passando: rodar supabase/testes-rls.sql.
