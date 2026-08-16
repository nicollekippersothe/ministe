-- =============================================================================
-- Correção 007: os endereços das páginas de exemplo ficam reservados
-- =============================================================================
-- Rodar no SQL Editor. Não precisa da senha do banco.
--
-- As sete páginas de exemplo são o portfólio do produto: a tela inicial mostra
-- elas no carrossel e no mosaico, e o "ver um endereço por dentro" leva para
-- uma delas. Elas moram em lib/exemplos.ts e o site serve direto de lá, então
-- abrem com banco ou sem.
--
-- `demo` já estava reservado desde o começo. As outras seis ficaram de fora, e
-- isso deixava uma porta aberta: alguém cadastrar `rafael-nunes` e o endereço
-- que a tela inicial exibe como exemplo passar a mostrar outra coisa, ou o
-- contrário, a pessoa escolher o nome e descobrir que a página dela nunca abre
-- porque o exemplo vem antes.
--
-- A mesma lista existe em lib/slug.ts, que é quem avisa enquanto a pessoa
-- digita. Aqui é quem decide na hora de gravar.
-- =============================================================================

begin;

insert into public.slugs_reservados (slug) values
  ('studio-raiz'),
  ('marina-nutricao'),
  ('camila-psicologia'),
  ('atelie-trama'),
  ('aurora-massas'),
  ('rafael-nunes')
on conflict (slug) do nothing;

commit;

-- =============================================================================
-- Conferir
-- =============================================================================
--   select public.endereco_livre('rafael-nunes') as tem_que_ser_false;
--
-- Depende da correção 006. Sem ela, dá para conferir direto:
--
--   select count(*) from public.slugs_reservados
--    where slug in ('studio-raiz', 'marina-nutricao', 'camila-psicologia',
--                   'atelie-trama', 'aurora-massas', 'rafael-nunes');
--
-- Tem que trazer 6.
