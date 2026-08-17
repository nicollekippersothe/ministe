-- =============================================================================
-- Correção 010: o rascunho muda de dono quando o Google já tem conta
-- =============================================================================
-- Rodar no SQL Editor. Não precisa da senha do banco. Depende da 005.
--
-- O problema
-- ----------
-- A pessoa monta a página numa conta provisória e entra com o Google na hora de
-- publicar, e a identidade é ligada na mesma conta pelo manual linking. Isso
-- funciona quando aquela conta do Google ainda não existe aqui.
--
-- Quando ela já existe, o Supabase recusa: uma identidade do Google pertence a
-- uma conta só, e a resposta é "Identity is already linked to another user".
-- Aconteceu no primeiro teste de login de verdade deste projeto.
--
-- E não é caso raro. Acontece toda vez que alguém que já tem página abre o site
-- deslogado, no celular ou em janela anônima, e começa a montar. O rascunho
-- ficaria preso na conta provisória e sumiria em trinta dias pela faxina, no
-- exato momento em que a pessoa decidiu publicar, que é o ponto de maior
-- intenção do funil inteiro.
--
-- A saída
-- -------
-- A pessoa entra na conta que já existe, e o rascunho vai junto. Este arquivo
-- traz a função que move.
--
-- Por que a chave de serviço
-- --------------------------
-- protege_cobranca devolve dono_id ao valor anterior em todo update que não
-- venha do serviço. Essa é justamente a proteção que impede alguém de apontar a
-- página dos outros para si, então ela fica de pé e a exceção é uma função só,
-- com guardas próprios, fechada para o navegador.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Mover um rascunho de uma conta provisória para uma conta de verdade
-- -----------------------------------------------------------------------------
-- Quatro guardas, e cada um fecha um jeito de abusar da função. Todos levantam
-- exceção em vez de devolver falso: quem chama é o nosso servidor, e falha
-- silenciosa aqui viraria "cliquei em publicar e nada aconteceu".
--
-- security definer para passar pelo protege_cobranca, que trata o dono da
-- função (postgres) igual ao service_role.
create or replace function public.migrar_rascunho(
  p_negocio uuid,
  p_de uuid,
  p_para uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp, auth
as $$
declare
  v_publicado boolean;
  v_dono uuid;
  v_provisorio boolean;
  v_total integer;
  v_limite integer;
begin
  -- Guarda 1: a origem precisa ser conta provisória.
  --
  -- Sem isto a função viraria transferência entre contas de verdade, e quem
  -- conseguisse chamá-la moveria a página de qualquer pessoa. É o guarda mais
  -- importante dos quatro.
  select coalesce(u.is_anonymous, false) into v_provisorio
    from auth.users u where u.id = p_de;

  if not coalesce(v_provisorio, false) then
    raise exception 'a conta de origem não é provisória'
      using errcode = 'check_violation';
  end if;

  -- Guarda 2: o negócio precisa existir e ser da conta de origem.
  select n.publicado, n.dono_id into v_publicado, v_dono
    from public.negocios n where n.id = p_negocio;

  if v_dono is null then
    raise exception 'a página não existe' using errcode = 'check_violation';
  end if;

  if v_dono <> p_de then
    raise exception 'a página é de outra conta' using errcode = 'check_violation';
  end if;

  -- Guarda 3: só rascunho se move.
  --
  -- Página no ar carrega endereço divulgado e reputação, e nunca troca de dono
  -- por este caminho. Quem precisar disso um dia vai precisar de um caminho
  -- próprio, com aviso para os dois lados.
  if v_publicado then
    raise exception 'a página já está no ar' using errcode = 'check_violation';
  end if;

  -- Guarda 4: o destino precisa ter vaga no plano dele.
  --
  -- Mesma conta que checa_limite_negocios faz, porque o gatilho é BEFORE INSERT
  -- e não pega update. Sem isto, a migração seria uma porta lateral para passar
  -- do limite de páginas do plano gratuito.
  select count(*) into v_total
    from public.negocios where dono_id = p_para;

  select coalesce(
           max(public.limite_do_plano(public.plano_de(id), 'negocios_por_dono')),
           1)
    into v_limite
    from public.negocios where dono_id = p_para;

  if v_total >= v_limite then
    raise exception 'limite de % página(s) por conta no plano atual', v_limite
      using errcode = 'check_violation';
  end if;

  update public.negocios set dono_id = p_para where id = p_negocio;
end;
$$;

-- A conta provisória fica para trás vazia, e limpar_rascunhos_abandonados a
-- recolhe em trinta dias. Nada aqui precisa apagar nada.

-- -----------------------------------------------------------------------------
-- Permissão
-- -----------------------------------------------------------------------------
-- Função nova pede revoke escrito na mão. O "alter default privileges ... revoke
-- execute" do schema.sql não guarda nada no Postgres 16, e o revoke geral do fim
-- do schema já rodou antes desta função existir. Ver a correção 005, que é onde
-- isto está explicado por inteiro.
--
-- Aberta ao navegador, esta função permite mover a página de qualquer conta
-- provisória para a sua.
revoke execute on function public.migrar_rascunho(uuid, uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.migrar_rascunho(uuid, uuid, uuid)
  to service_role;

commit;

-- =============================================================================
-- Conferir
-- =============================================================================
-- 1. A função está fechada para o navegador:
--
--   select p.proname,
--          has_function_privilege('anon', p.oid, 'execute') as anon,
--          has_function_privilege('authenticated', p.oid, 'execute') as logado,
--          has_function_privilege('service_role', p.oid, 'execute') as servico
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname = 'migrar_rascunho';
--
--   Tem que vir false, false, true.
--
-- 2. O dono da função é postgres, senão o protege_cobranca devolve o dono_id
--    antigo em silêncio e a migração não acontece:
--
--   select pg_get_userbyid(p.proowner) as dono
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname = 'migrar_rascunho';
--
-- 3. A bateria inteira continua passando: rodar supabase/testes-rls.sql.
