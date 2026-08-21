-- =============================================================================
-- Correção 012: os dois endereços que existiam no código e faltavam no banco
-- =============================================================================
-- Rodar no SQL Editor. Não precisa da senha do banco. Idempotente: rodar duas
-- vezes deixa o banco igual.
--
-- -----------------------------------------------------------------------------
-- O que é
-- -----------------------------------------------------------------------------
-- A lista de endereços reservados é espelhada: ela existe em
-- supabase/schema.sql, que é quem manda, e em lib/slug.ts, que serve para
-- avisar a pessoa antes de ela mandar o formulário. Espelho pede conferência,
-- porque o dia em que os dois lados divergem ninguém é avisado.
--
-- Achado ao revisar a /precos: `criar` e `icon` estão só no TypeScript.
--
--   criar  é rota de verdade, app/criar/page.tsx, a porta de entrada do
--          cadastro inteiro.
--   icon   é arquivo do Next, app/icon.svg, que serve o ícone da aba.
--
-- Com eles fora do banco, alguém que mande um POST direto em /rest/v1 registra
-- `criar` como endereço da própria página. A conferência do TypeScript recusa,
-- e a do banco deixa passar, e quem manda é o banco. O endereço `/criar`
-- continuaria abrindo o cadastro, porque a rota do Next ganha do catch-all,
-- então o estrago é a pessoa ficar com uma página que endereço nenhum alcança,
-- e o endereço sair da praça para todo mundo.
--
-- É o mesmo conserto que a 009 fez com `assinar`, e pelo mesmo motivo.
--
-- -----------------------------------------------------------------------------
-- O que muda
-- -----------------------------------------------------------------------------

begin;

insert into public.slugs_reservados (slug) values ('criar'), ('icon')
  on conflict do nothing;

commit;

-- =============================================================================
-- Conferir
-- =============================================================================
-- 1. Os dois endereços estão reservados:
--
--   select slug from public.slugs_reservados
--    where slug in ('criar', 'icon')
--    order by slug;
--
--   Tem que trazer as duas linhas.
--
-- 2. Ninguém tinha registrado esses endereços antes desta correção:
--
--   select slug, publicado from public.negocios
--    where slug in ('criar', 'icon');
--
--   Tem que vir vazio. Se vier alguma linha, PARE: existe uma página de
--   alguém naquele endereço, e apagar a linha apaga a página de uma pessoa. O
--   caminho ali é falar com o dono dela e trocar o endereço, e não deletar.
