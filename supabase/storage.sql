-- =============================================================================
-- Entrais, Storage das imagens
-- =============================================================================
-- Rodar depois do schema.sql, no SQL Editor do Supabase.
--
-- Atenção: este arquivo é o único que NÃO foi testado localmente, porque o
-- schema `storage` só existe dentro do Supabase. Conferir na mão depois de
-- aplicar, com a lista de checagem no fim do arquivo.
--
-- Convenção de caminho:  {negocio_id}/{pasta}/{arquivo}
-- Exemplo:               11111111-.../catalogo/bolo-1.webp
--
-- A primeira pasta é sempre o id do negócio, e é ela que a política usa para
-- saber de quem é o arquivo. Ninguém escreve fora da própria pasta.
-- =============================================================================

-- Bucket público na leitura, porque a página é pública e a imagem precisa
-- abrir sem token. O limite de 3 MB é uma rede de segurança: o navegador
-- reduz a foto antes de subir e o arquivo real fica perto de 150 KB, então
-- 3 MB só serve para barrar quem tentar subir arquivo cru de 40 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'imagens',
  'imagens',
  true,
  3145728,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

-- Leitura ---------------------------------------------------------------------

create policy "imagens leitura publica" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'imagens');

-- Escrita ---------------------------------------------------------------------
-- Só na pasta de um negócio que é seu.

create policy "imagens envio do dono" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'imagens'
    and exists (
      select 1 from public.negocios n
      where n.id::text = (storage.foldername(name))[1]
        and n.dono_id = auth.uid()
    )
  );

create policy "imagens troca do dono" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'imagens'
    and exists (
      select 1 from public.negocios n
      where n.id::text = (storage.foldername(name))[1]
        and n.dono_id = auth.uid()
    )
  );

create policy "imagens apagar do dono" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'imagens'
    and exists (
      select 1 from public.negocios n
      where n.id::text = (storage.foldername(name))[1]
        and n.dono_id = auth.uid()
    )
  );

-- =============================================================================
-- Conferir na mão depois de aplicar
-- =============================================================================
-- 1. Logado como o dono A, subir uma imagem em {id_do_A}/capa/teste.webp. Passa.
-- 2. Logado como A, tentar subir em {id_do_B}/capa/teste.webp. Tem que falhar.
-- 3. Deslogado, abrir a URL pública da imagem de A. Tem que abrir.
-- 4. Deslogado, tentar subir qualquer coisa. Tem que falhar.
-- 5. Logado como A, tentar subir um PDF renomeado para .webp. Tem que falhar
--    pelo allowed_mime_types.
-- 6. Logado como A, tentar subir um arquivo de 10 MB. Tem que falhar.
-- 7. Logado como A, apagar a imagem de B. Tem que falhar.
--
-- Ainda em aberto, para resolver na etapa de upload: quando um item ou um
-- negócio é apagado no banco, o arquivo continua no Storage. O jeito certo é
-- uma função que apaga o arquivo junto, senão o 1 GB gratuito enche de lixo.
