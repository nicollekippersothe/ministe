-- =============================================================================
-- Correção 002: fechar o EXECUTE nominal que o Supabase dá a anon
-- =============================================================================
-- Roda depois da 001. Num projeto novo não precisa de nenhuma das duas: o
-- schema.sql já sai corrigido.
--
-- Rodar no SQL Editor. Não precisa da senha do banco.
--
-- -----------------------------------------------------------------------------
-- O que a 001 não pegou
-- -----------------------------------------------------------------------------
-- A 001 revogou de PUBLIC e parou aí, por diagnóstico incompleto meu. São dois
-- caminhos de permissão, e fechar um deixa o outro de pé:
--
--   =X/postgres        direito herdado de PUBLIC, que o Postgres dá sozinho
--   anon=X/postgres    grant nominal para anon, que o Supabase dá por conta
--                      própria, para publicar a função em /rest/v1/rpc
--
-- Depois da 001 sobraram treze funções chamáveis por anon pelo segundo
-- caminho. As duas que fecharam, limpar_eventos_antigos e plano_de, fecharam
-- porque o schema já tinha revoke nominal nelas, e a 001 matou o que restava.
--
-- O que ainda estava aberto eram gatilhos (checa_*, marca_atualizacao,
-- protege_cobranca) e dois auxiliares (limite_do_plano, plano_de). Chamar
-- gatilho direto por RPC dá erro do próprio Postgres, então o risco prático
-- era baixo, mas função interna publicada na internet é superfície que não
-- precisa existir.
-- =============================================================================

begin;

revoke execute on all functions in schema public from anon, authenticated;

-- Para as próximas. Vale só para o default deste papel, então não é garantia
-- absoluta: a garantia é a asserção em testes-rls.sql, que lista quem pode
-- chamar o quê e falha se aparecer função nova aberta.
alter default privileges in schema public
  revoke execute on functions from anon, authenticated;

-- -----------------------------------------------------------------------------
-- O que volta, e por quê
-- -----------------------------------------------------------------------------
-- Chamadas pela página pública, por visitante sem login.
grant execute on function public.registrar_evento(text, text) to anon, authenticated;
grant execute on function public.registrar_denuncia(text, text, text)
  to anon, authenticated;

-- Mora dentro de cinco políticas de RLS, e expressão de política roda com o
-- privilégio de quem consulta. Sem isto o visitante deixa de enxergar
-- catálogo, foto, horário e link.
grant execute on function public.negocio_publico(uuid) to anon, authenticated;

-- Só para authenticated. Quem chama é o gatilho protege_cobranca, que é
-- security invoker de propósito.
grant execute on function public.plano_de(uuid) to authenticated;

grant execute on all functions in schema public to service_role;

commit;

-- =============================================================================
-- Conferir
-- =============================================================================
--   select p.proname,
--          has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') as logado
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' order by anon desc, p.proname;
--
-- anon = true em exatamente três: negocio_publico, registrar_denuncia,
-- registrar_evento. logado = true nessas três mais plano_de. Todo o resto
-- false nas duas colunas.
--
-- Depois, supabase/testes-rls.sql inteiro. Tem que terminar com TODOS OS
-- TESTES PASSARAM.
--
-- -----------------------------------------------------------------------------
-- Isto pode voltar sozinho
-- -----------------------------------------------------------------------------
-- O painel do Supabase tem, em Data API, uma opção de expor funções, e ela
-- reemite os grants. Se alguém mexer ali, as treze voltam a ficar abertas.
-- É por isso que a conferência virou asserção no testes-rls.sql, e é por isso
-- que vale rodar a bateria depois de mexer em qualquer configuração de API.
