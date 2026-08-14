-- =============================================================================
-- Correção 003: fechar a listagem do bucket de imagens
-- =============================================================================
-- ATENÇÃO: esta é a única correção que eu não consegui testar antes de
-- escrever. O schema `storage` só existe dentro do Supabase, e o Postgres
-- local não reproduz o roteamento de arquivo público. Aplique lendo a
-- conferência no fim, que leva um minuto, e tem o desfazer escrito.
--
-- -----------------------------------------------------------------------------
-- O que está aberto
-- -----------------------------------------------------------------------------
-- A política de leitura era:
--
--   for select to anon, authenticated using (bucket_id = 'imagens')
--
-- Isso dá ao visitante SELECT nas linhas de storage.objects do bucket inteiro,
-- e é o que liga a listagem em /storage/v1/object/list/imagens. Qualquer
-- pessoa com a chave publicável enumera todos os arquivos.
--
-- O caminho é {negocio_id}/{pasta}/{arquivo}, então a listagem entrega a lista
-- de ids de negócio e os nomes dos arquivos, INCLUSIVE de página que ainda não
-- foi publicada.
--
-- Isso contradiz uma promessa escrita na tela de cadastro: "A página começa
-- como rascunho. Ninguém vê até você publicar." Com listagem aberta, as fotos
-- do rascunho são encontráveis antes de publicar.
--
-- -----------------------------------------------------------------------------
-- Por que dá para fechar sem quebrar a página
-- -----------------------------------------------------------------------------
-- O bucket é público. Bucket público serve o arquivo por
-- /storage/v1/object/public/imagens/... sem passar por RLS, então a imagem da
-- página continua abrindo com a política fechada. A política de SELECT governa
-- o caminho autenticado e a listagem, que são justamente os que não precisam
-- ficar abertos.
--
-- O dono continua enxergando os próprios arquivos, que é o que o painel usa
-- para mostrar o que já foi enviado.
-- =============================================================================

begin;

drop policy if exists "imagens leitura publica" on storage.objects;

create policy "imagens leitura do dono" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'imagens'
    and exists (
      select 1 from public.negocios n
      where n.id::text = (storage.foldername(name))[1]
        and n.dono_id = auth.uid()
    )
  );

commit;

-- =============================================================================
-- Conferir agora, nesta ordem
-- =============================================================================
-- 1. Deslogado, ou numa janela anônima, abrir a URL pública de um arquivo do
--    bucket. Tem que abrir a imagem. Este é o teste que importa: se falhar,
--    desfaça (mais abaixo) e me avise.
--
--    A URL sai no painel, em Storage, clicando no arquivo. Tem esta cara:
--    https://<ref>.supabase.co/storage/v1/object/public/imagens/<caminho>
--
-- 2. Deslogado, tentar listar:
--    POST https://<ref>.supabase.co/storage/v1/object/list/imagens
--    com o cabeçalho apikey da chave publicável e corpo {"prefix":""}.
--    Antes devolvia a lista de arquivos. Agora tem que devolver lista vazia.
--
-- 3. O aviso "Public Bucket Allows Listing" tem que sumir do linter.
--
-- -----------------------------------------------------------------------------
-- Desfazer, se o passo 1 falhar
-- -----------------------------------------------------------------------------
--   begin;
--   drop policy if exists "imagens leitura do dono" on storage.objects;
--   create policy "imagens leitura publica" on storage.objects
--     for select to anon, authenticated
--     using (bucket_id = 'imagens');
--   commit;
