-- Peças que o Supabase já traz prontas, recriadas aqui só para conseguir rodar
-- e testar o schema num Postgres local antes de aplicar no projeto de verdade.
-- Este arquivo NÃO deve ser rodado no Supabase.

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique
);

-- Mesma implementação que o Supabase usa: lê o sub do JWT da requisição.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid;
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant select on auth.users to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- O default privilege que o Supabase deixa no schema public
-- -----------------------------------------------------------------------------
-- Isto aqui não é enfeite: é a peça que faltava e que fez um teste local passar
-- enquanto o projeto de verdade continuava aberto.
--
-- O Supabase mantém um default privilege no schema public que dá EXECUTE em
-- toda função nova para anon e authenticated. É o mecanismo que expõe as
-- funções em /rest/v1/rpc. Numa ACL isso aparece como "anon=X/postgres", com o
-- papel escrito antes do sinal de igual: grant nominal, e não o "=X/postgres"
-- de grant herdado de PUBLIC.
--
-- A diferença importa porque `revoke ... from public` fecha um e deixa o outro
-- de pé. Sem reproduzir o default aqui, o Postgres local nasce mais fechado que
-- o Supabase, o teste passa, e o furo só aparece em produção.
alter default privileges in schema public
  grant execute on functions to anon, authenticated;
