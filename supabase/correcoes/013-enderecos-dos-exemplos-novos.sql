-- =============================================================================
-- Correção 013: os endereços das páginas de exemplo novas
-- =============================================================================
-- Rodar no SQL Editor. Não precisa da senha do banco. Idempotente.
--
-- -----------------------------------------------------------------------------
-- Por que existe
-- -----------------------------------------------------------------------------
-- As sete páginas de exemplo mudaram de dono e de nome quando o produto passou
-- a mirar quem vende o próprio trabalho. Elas são o portfólio do Entrais, abrem
-- direto de lib/exemplos.ts, e o endereço delas precisa ficar fora do sorteio:
-- alguém que cadastrasse `lia-prado` ficaria com uma página que endereço nenhum
-- alcança, porque a rota do exemplo ganha do catch-all.
--
-- A lista é espelhada entre supabase/schema.sql e lib/slug.ts, e o TypeScript já
-- foi atualizado. Esta correção acerta o outro lado, que é quem manda.
--
-- Os seis endereços antigos (studio-raiz, marina-nutricao, camila-psicologia,
-- atelie-trama, aurora-massas, rafael-nunes) ficam reservados, e isso é escolha.
-- Liberá-los devolveria seis nomes bons para a praça, e custaria conferir antes
-- se alguém já registrou algum deles nesse intervalo. Enquanto o produto tem
-- pouca gente, o ganho é pequeno e o risco de errar existe. Fica anotado como
-- limpeza para o dia em que valer a pena.
--
-- -----------------------------------------------------------------------------
-- O que muda
-- -----------------------------------------------------------------------------

begin;

insert into public.slugs_reservados (slug) values
  ('camila-reis'),
  ('nara-bittencourt'),
  ('teo-sarmento'),
  ('lia-prado'),
  ('bia-marconi'),
  ('alecrim-confeitaria')
  on conflict do nothing;

commit;

-- =============================================================================
-- Conferir
-- =============================================================================
-- 1. Os seis endereços novos estão reservados:
--
--   select slug from public.slugs_reservados
--    where slug in ('camila-reis', 'nara-bittencourt', 'teo-sarmento',
--                   'lia-prado', 'bia-marconi', 'alecrim-confeitaria')
--    order by slug;
--
--   Tem que trazer as seis linhas.
--
-- 2. Ninguém tinha registrado esses endereços antes desta correção:
--
--   select slug, publicado from public.negocios
--    where slug in ('camila-reis', 'nara-bittencourt', 'teo-sarmento',
--                   'lia-prado', 'bia-marconi', 'alecrim-confeitaria');
--
--   Tem que vir vazio. Se vier alguma linha, PARE: existe página de gente
--   naquele endereço, e apagar a linha apaga a página de uma pessoa. O caminho
--   ali é falar com o dono dela e trocar o endereço do exemplo, e não deletar.
