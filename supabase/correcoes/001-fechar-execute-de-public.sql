-- =============================================================================
-- Correção 001: fechar o EXECUTE que PUBLIC recebia por padrão
-- =============================================================================
-- Para projetos que já rodaram o schema.sql antes desta correção. Num projeto
-- novo não precisa: o schema.sql já sai corrigido.
--
-- Rodar no SQL Editor. Não precisa da senha do banco.
--
-- -----------------------------------------------------------------------------
-- O que estava aberto
-- -----------------------------------------------------------------------------
-- O schema tinha `revoke execute on function ... from anon, authenticated`, e
-- isso não bastava. O Postgres dá EXECUTE a PUBLIC em toda função nova, e anon
-- herda por PUBLIC. Na ACL o direito aparece como "=X/postgres": o grantee
-- vazio antes do sinal de igual é PUBLIC.
--
-- Como o PostgREST publica o schema public em /rest/v1/rpc, toda função ficava
-- chamável por qualquer pessoa com a chave publicável, que é pública por
-- definição. A pior delas:
--
--   POST /rest/v1/rpc/limpar_eventos_antigos
--
-- que é security definer, roda como dono do banco e apaga todo evento com mais
-- de 400 dias.
--
-- Nenhum dado foi perdido: a correção saiu antes de existir evento gravado.
-- =============================================================================

begin;

revoke execute on all functions in schema public from public;

-- Sem isto, a próxima função criada nasce aberta de novo.
alter default privileges in schema public revoke execute on functions from public;

-- -----------------------------------------------------------------------------
-- O que volta, e por quê
-- -----------------------------------------------------------------------------
-- registrar_evento e registrar_denuncia são chamadas pela página pública, por
-- visitante sem login.
grant execute on function public.registrar_evento(text, text) to anon, authenticated;
grant execute on function public.registrar_denuncia(text, text, text)
  to anon, authenticated;

-- negocio_publico aparece dentro de cinco políticas de RLS, e expressão de
-- política roda com o privilégio de quem consulta. Sem isto o visitante deixa
-- de enxergar catálogo, foto, horário e link.
grant execute on function public.negocio_publico(uuid) to anon, authenticated;

-- plano_de volta só para authenticated. Quem chama é o gatilho
-- protege_cobranca, que é security invoker de propósito: ele decide pelo
-- current_user se quem escreve é a chave de serviço. Virar definer resolveria
-- a permissão e arrebentaria a proteção de cobrança.
grant execute on function public.plano_de(uuid) to authenticated;

-- A chave de serviço continua podendo tudo: é ela que roda manutenção.
grant execute on all functions in schema public to service_role;

-- -----------------------------------------------------------------------------
-- search_path fixo nas três que ficaram sem
-- -----------------------------------------------------------------------------
-- Sem search_path fixo, a função resolve nome de tabela pelo caminho de quem
-- chamou. Nestas três o risco é pequeno, porque nenhuma é security definer,
-- mas fixar é de graça e tira o aviso do linter.
alter function public.limite_do_plano(text, text) set search_path = public, pg_temp;
alter function public.marca_atualizacao() set search_path = public, pg_temp;
alter function public.protege_cobranca() set search_path = public, pg_temp;

commit;

-- =============================================================================
-- Conferir
-- =============================================================================
-- Rodar supabase/testes-rls.sql depois desta correção. As asserções novas de
-- permissão de função só passam com ela aplicada.
--
-- Ou, para olhar direto:
--
--   select p.proname,
--          has_function_privilege('anon', p.oid, 'EXECUTE') as anon
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' order by anon desc, p.proname;
--
-- Só três podem vir com anon = true: negocio_publico, registrar_denuncia e
-- registrar_evento.
