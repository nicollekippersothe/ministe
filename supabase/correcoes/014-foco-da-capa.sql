-- =============================================================================
-- Correção 014: o ponto da capa que precisa aparecer
-- =============================================================================
-- Rodar no SQL Editor. Não precisa da senha do banco. Idempotente: rodar duas
-- vezes deixa o banco igual.
--
-- -----------------------------------------------------------------------------
-- O que é
-- -----------------------------------------------------------------------------
-- A capa da página pública tem moldura fixa: 16 por 9 no celular e 64 por 15 no
-- monitor, em componentes/Capa.tsx. A foto que a dona manda tem a proporção que
-- a câmera dela deu, e quase nunca é uma dessas duas. O `object-cover` do CSS
-- resolve a diferença cortando pelo centro, e é aí que mora o problema relatado:
-- rosto no terço de cima da foto, prato na beirada, produto no canto, tudo isso
-- fica fora do corte, e a dona da página só descobre olhando a própria página.
--
-- O caminho barato para isso é ponto focal, e não recorte. A dona escolhe o
-- ponto da foto que precisa aparecer, e o CSS `object-position` faz o corte sair
-- em volta dele. O arquivo continua sendo um só, do jeito que subiu; nenhuma
-- segunda cópia é gerada; e o mesmo par de números serve as duas molduras, e
-- serviria uma terceira no dia em que ela existir. Recorte de verdade custaria
-- biblioteca no navegador, processamento de imagem no servidor e um arquivo a
-- mais por capa, para resolver o mesmo caso.
--
-- Dois números descrevem o ponto inteiro, em porcentagem da foto: 0 é a borda
-- esquerda ou o topo, 100 é a direita ou a base, e 50 e 50 é o centro, que é o
-- corte que o navegador já faz sozinho.
--
-- -----------------------------------------------------------------------------
-- O que muda
-- -----------------------------------------------------------------------------
-- Duas colunas em `negocios`, as duas nulas.
--
-- NULO É O CENTRO, e isso é o desenho e não descuido. As páginas que já estão
-- no ar continuam cortando pelo centro sem ninguém tocar em nada, e o código
-- pode subir antes desta correção rodar: `lib/supabase/mapa.ts` lê as duas
-- colunas e devolve nulo quando elas faltam, e `posicaoDoFoco`, em
-- lib/supabase/imagens.ts, devolve `50% 50%` para nulo.
--
-- `smallint` porque a faixa é de 0 a 100 e a coluna vive uma por página. A
-- restrição de faixa é a mesma conta que `limitarFoco` faz do lado do código, e
-- ela existe aqui porque o painel escreve direto pelo PostgREST: conferência que
-- morasse só na tela seria enfeite.
--
-- O nome termina em `_faixa`, e o sufixo tem consequência: `motivoDaConstraint`,
-- em lib/dados/erros.ts, manda todo sufixo que não seja `_preenchido` nem
-- `_tamanho` para `campo_formato`, que é a frase certa para número fora da
-- faixa.
--
-- A logo fica de fora de propósito. Ela é redonda e quadrada, a mesma proporção
-- de qualquer avatar, e o corte dela não descarta nada que a pessoa escolheu.

begin;

alter table public.negocios
  add column if not exists capa_foco_x smallint,
  add column if not exists capa_foco_y smallint;

comment on column public.negocios.capa_foco_x is
  'Ponto focal da capa, em % da largura. 0 esquerda, 100 direita. Nulo = centro.';
comment on column public.negocios.capa_foco_y is
  'Ponto focal da capa, em % da altura. 0 topo, 100 base. Nulo = centro.';

-- Recriada em vez de criada: assim a segunda rodada deixa o banco igual à
-- primeira, e uma faixa que mude um dia troca de valor sem virar duas
-- restrições com o mesmo assunto.
alter table public.negocios drop constraint if exists capa_foco_faixa;
alter table public.negocios add constraint capa_foco_faixa check (
  (capa_foco_x is null or capa_foco_x between 0 and 100)
  and (capa_foco_y is null or capa_foco_y between 0 and 100)
);

commit;

-- =============================================================================
-- Conferir
-- =============================================================================
-- 1. As duas colunas existem, nulas e do tipo certo:
--
--   select column_name, data_type, is_nullable, column_default
--     from information_schema.columns
--    where table_schema = 'public'
--      and table_name = 'negocios'
--      and column_name in ('capa_foco_x', 'capa_foco_y')
--    order by column_name;
--
--   Tem que trazer duas linhas, smallint, YES em is_nullable e default vazio.
--
-- 2. A restrição de faixa está de pé:
--
--   select conname, pg_get_constraintdef(oid)
--     from pg_constraint
--    where conrelid = 'public.negocios'::regclass
--      and conname = 'capa_foco_faixa';
--
--   Tem que trazer uma linha só.
--
-- 3. Nenhuma página mudou de aparência com a correção. Toda linha continua no
--    centro até alguém escolher um ponto no painel:
--
--   select count(*) as com_ponto
--     from public.negocios
--    where capa_foco_x is not null or capa_foco_y is not null;
--
--   Tem que vir zero logo depois de rodar. Depois de a primeira dona ajustar a
--   capa dela, vem um.
--
-- 4. A faixa recusa o que está fora dela. Rodar numa linha de teste, e esperar
--    a recusa `capa_foco_faixa`:
--
--   update public.negocios set capa_foco_x = 140 where slug = 'algum-slug';
--
--   Tem que dar erro. Se passar, PARE: a restrição saiu do lugar, e a coluna
--   volta a aceitar número que o CSS lê como posição fora da foto.
