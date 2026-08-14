-- =============================================================================
-- Correção 004: a coluna da categoria
-- =============================================================================
-- Para projetos que já rodaram o schema.sql antes da categoria existir. Num
-- projeto novo não precisa: o schema.sql já sai com ela.
--
-- Rodar no SQL Editor. Não precisa da senha do banco.
--
-- A categoria não é etiqueta. Ela vira o @type do JSON-LD, e é isso que faz o
-- Google casar a página com "confeitaria perto de mim" em vez de ler um
-- LocalBusiness genérico. E monta a página antes de o dono preencher nada:
-- título do catálogo, preço à vista ou guardado, galeria antes do catálogo.
--
-- Sem chave estrangeira de propósito. A lista mora em lib/categorias.ts, muda
-- com deploy e não com migração, e categoria que um dia saia da lista não pode
-- derrubar a página de quem já tinha escolhido ela: desconhecida cai na receita
-- padrão, que é o comportamento do código.
-- =============================================================================

begin;

alter table public.negocios
  add column if not exists categoria text,
  add column if not exists categoria_livre text;

alter table public.negocios
  drop constraint if exists categoria_formato,
  add constraint categoria_formato check (
    categoria is null or categoria ~ '^[a-z][a-z0-9-]{1,40}$'
  );

alter table public.negocios
  drop constraint if exists categoria_livre_tamanho,
  add constraint categoria_livre_tamanho check (
    categoria_livre is null or length(btrim(categoria_livre)) between 2 and 40
  );

commit;

-- =============================================================================
-- Conferir
-- =============================================================================
--   select column_name, data_type
--   from information_schema.columns
--   where table_schema = 'public' and table_name = 'negocios'
--     and column_name in ('categoria', 'categoria_livre');
--
-- Tem que trazer as duas, as duas como text.
