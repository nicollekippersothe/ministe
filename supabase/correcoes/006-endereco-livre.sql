-- =============================================================================
-- Correção 006: uma resposta para "este endereço está livre?"
-- =============================================================================
-- Rodar no SQL Editor. Não precisa da senha do banco.
--
-- O buraco que só apareceu com a RLS de verdade
-- ---------------------------------------------
-- O cadastro confere o endereço enquanto a pessoa digita, para ela descobrir
-- na hora em vez de preencher o formulário inteiro e voltar. Essa conferência
-- lia a tabela `negocios` direto.
--
-- Pela RLS, o visitante enxerga só o que está publicado. Então um endereço
-- guardado num rascunho de outra pessoa aparecia como livre, a pessoa
-- preenchia tudo confiante, e o insert batia na chave única no fim. Ou seja: a
-- ida e volta que a conferência ao vivo existe para evitar, com um passo a mais.
--
-- Esta função responde só um sim ou um não. É security definer porque precisa
-- enxergar o que a RLS esconde, e devolve booleano justamente para enxergar
-- sem contar nada: nem de quem é, nem quando, nem se está no ar.
--
-- O que ela entrega de novo é saber que alguém está montando uma página com
-- aquele endereço. É o mínimo para o cadastro funcionar, e é menos do que a
-- alternativa, que era deixar duas pessoas escolherem o mesmo nome e uma
-- descobrir no fim.
--
-- Formato do endereço, palavra restrita e nome reservado continuam conferidos
-- em lib/slug.ts, do lado do site, e o gatilho checa_slug é quem decide de
-- verdade na hora de gravar. Aqui é só ocupação.
-- =============================================================================

begin;

create or replace function public.endereco_livre(p_slug text)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select not exists (
    select 1 from public.negocios
     where slug = p_slug or slug_anterior = p_slug
  )
  and not exists (
    select 1 from public.slugs_reservados where slug = p_slug
  );
$$;

-- Função nova nasce aberta por dois caminhos, e nenhum deles se fecha sozinho
-- em arquivo de correção. Ver a nota na 005 e em LEIA-ME.md.
revoke execute on function public.endereco_livre(text)
  from public, anon, authenticated;

-- E volta nominalmente para quem precisa: a pessoa digitando no cadastro, que
-- pode ainda estar sem conta nenhuma.
grant execute on function public.endereco_livre(text) to anon, authenticated;

commit;

-- =============================================================================
-- Conferir
-- =============================================================================
--   select public.endereco_livre('um-nome-que-ninguem-usou') as tem_que_ser_true,
--          public.endereco_livre('painel') as tem_que_ser_false;
--
-- O segundo é falso porque `painel` está em slugs_reservados.
