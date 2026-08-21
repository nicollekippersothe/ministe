-- =============================================================================
-- Correção 008: o banco pronto para receber imagem enviada pelo dono
-- =============================================================================
-- Rodar no SQL Editor. Não precisa da senha do banco.
--
-- Rodar DEPOIS da 003, que fecha a listagem do bucket. A 003 estava parada
-- esperando existir a primeira imagem para ter o que conferir, e é justamente
-- esta etapa que cria a primeira. Fechar a listagem antes da primeira imagem
-- existir é mais barato do que depois: enquanto o bucket está vazio, errar a
-- política não expõe nada.
--
-- -----------------------------------------------------------------------------
-- O que já estava de pé, e o que faltava
-- -----------------------------------------------------------------------------
-- O bucket `imagens` existe, é público na leitura, tem teto de 3 MB por
-- arquivo e quatro políticas de RLS que amarram a escrita à primeira pasta do
-- caminho, que é o id do negócio. As tabelas `fotos` e `itens_fotos` já
-- guardam url, alt, largura, altura e ordem, e dois gatilhos já contam foto por
-- item e foto por galeria contra o limite do plano.
--
-- Faltavam quatro coisas do lado do banco, e são as quatro que este arquivo
-- resolve.
--
-- 1. O TEXTO ALTERNATIVO DA LOGO E DA CAPA.
--
--    Foto de galeria e foto de item têm `alt` próprio. Logo e capa tinham só a
--    URL, e o texto alternativo saía do nome do negócio, em lib/supabase/mapa.ts.
--    Isso se sustentava enquanto as duas imagens eram desenhadas por nós, com
--    as páginas de exemplo. Deixa de se sustentar quando a pessoa envia a
--    imagem dela: a capa passa a ser uma foto de verdade, do balcão, da peça,
--    do prato, e "Café Alecrim" como texto alternativo repete o que o h1 logo
--    abaixo já diz, palavra por palavra. Quem usa leitor de tela ouve o mesmo
--    nome três vezes e fica sabendo menos do que sabia.
--
--    As duas colunas nascem nulas, e nulo continua valendo o texto derivado do
--    nome, que é o comportamento de hoje. Ou seja: campo vazio devolve o que já
--    funcionava, e campo preenchido manda. Nenhuma página precisa esperar a
--    pessoa escrever nada para ficar acessível.
--
-- 2. O FORMATO DO QUE ENTRA NAS QUATRO COLUNAS DE IMAGEM.
--
--    `logo_url`, `capa_url`, `fotos.url` e `itens_fotos.url` aceitavam texto
--    qualquer. O dono tem UPDATE na própria linha, pela RLS, com razão. Então
--    ele consegue mandar um PATCH direto no PostgREST e gravar ali o endereço
--    de uma imagem hospedada em qualquer lugar do mundo.
--
--    O que isso custa, em ordem de gravidade:
--
--      a) a página pública passa a carregar imagem de terceiro, e o servidor
--         desse terceiro fica sabendo o IP de cada visitante da página. É
--         vazamento de dado de quem visita, e quem visita nunca escolheu isso;
--      b) a rota que gera a prévia do link busca a imagem do lado do servidor.
--         Endereço arbitrário ali vira pedido saindo da nossa infraestrutura
--         para onde o dono apontar;
--      c) o next/image recusa domínio fora da lista e a página do próprio dono
--         quebra, o que ele descobre sozinho, do pior jeito.
--
--    A decisão que fecha os três de uma vez: a coluna guarda o CAMINHO DENTRO
--    DO BUCKET, e nunca uma URL inteira. Quem monta o endereço público é o
--    código, a partir de NEXT_PUBLIC_SUPABASE_URL. Assim a coluna, por
--    construção, só consegue apontar para dentro do nosso bucket.
--
--    O padrão é   {negocio_id}/{pasta}/{uuid}.{extensão}
--    com pasta em logo, capa, galeria, catalogo. Exemplo:
--      11111111-1111-4111-8111-111111111111/capa/9f3c....webp
--
--    É o mesmo caminho que as políticas de storage.sql já usam: elas leem
--    (storage.foldername(name))[1], que é a primeira pasta, e exigem que ela
--    seja o id de um negócio de quem está escrevendo. A restrição daqui exige a
--    mesma coisa do outro lado, comparando com o id da própria linha, então
--    linha e arquivo ficam presos um ao outro: o dono não consegue apontar a
--    logo dele para o arquivo de outro negócio, nem gravar caminho que a
--    política de escrita recusaria.
--
--    O nome do arquivo é um uuid sorteado a cada envio, inclusive quando a
--    pessoa troca a capa. Isso é de propósito, e o motivo é cache: caminho novo
--    é URL nova, e URL nova aparece na hora. Reaproveitar o mesmo nome deixaria
--    a CDN e o otimizador de imagem servindo a imagem antiga por horas, e a
--    pessoa achando que o envio falhou.
--
--    O endereço que começa com barra continua aceito, que é o formato das
--    páginas de exemplo (/exemplo/logo.jpg) e do arquivo local que o modo sem
--    Supabase grava. Nenhum dos dois sai para a internet como URL de terceiro.
--
-- 3. O ARQUIVO QUE FICA PARA TRÁS.
--
--    Apagar a linha do banco não apaga o arquivo no Storage. Trocar a capa
--    deixa a antiga lá. Apagar um item leva as linhas das fotos dele pela chave
--    estrangeira e deixa os arquivos. Apagar a conta provisória parada, que é o
--    que limpar_rascunhos_abandonados faz, leva o negócio junto pela chave
--    estrangeira e deixa tudo que a pessoa tinha enviado. Em pouco tempo o giga
--    grátis vira lixo pago.
--
--    Aqui entra uma fila: `imagens_para_apagar`. Um gatilho escreve nela o
--    caminho que acabou de sair de cena, em toda saída possível (linha apagada,
--    coluna trocada, cascata de item, cascata de negócio, cascata de conta). A
--    fila é uma tabela comum, então o registro do que precisa sumir é
--    transacional: ou a linha sai e o caminho entra na fila, ou nada acontece.
--
--    Quem apaga o arquivo de verdade é a manutenção, com a chave de serviço,
--    porque apagar bytes no Storage é chamada de API e não comando de SQL:
--    remover a linha de storage.objects na mão deixaria o arquivo no bucket e o
--    problema de pé, disfarçado.
--
--    O caminho feliz continua sendo o navegador apagar o arquivo antigo logo
--    depois de trocar a imagem, que é instantâneo. A fila é a rede embaixo, para
--    quando a aba fecha no meio, a rede cai ou a linha some por cascata, sem
--    ninguém por perto.
--
-- 4. O ARQUIVO QUE NUNCA VIROU LINHA.
--
--    Os gatilhos de limite contam LINHA, e é onde eles têm que contar: o painel
--    escreve pelo navegador, e limite que mora no JavaScript não é limite. Mas
--    enviar arquivo e gravar linha são dois passos, e o primeiro pode acontecer
--    sozinho: aba fechada no meio do envio, ou alguém com a chave publicável
--    chamando a API do Storage direto, sem passar pela nossa tela. A política de
--    escrita permite isso dentro da pasta do próprio negócio, e nenhum gatilho
--    vê acontecer.
--
--    `imagens_orfas(horas)` é a varredura que fecha esse lado: devolve todo
--    arquivo do bucket que nenhuma linha aponta e que já passou da janela de
--    carência. A carência existe para o arquivo recém-enviado, cuja linha ainda
--    está sendo gravada, ficar de fora.
--
--    Foi por isso que a alternativa de contar arquivo na própria política de
--    escrita ficou de fora: ela precisaria de uma função chamável por
--    `authenticated` para saber o limite do plano, e o produto tem uma asserção
--    que lista, nome por nome, as funções que cada papel pode chamar. Teto de
--    arquivo repetido dentro da política também duplicaria os números do plano,
--    que hoje moram em limite_do_plano e em nenhum outro lugar.
--
-- -----------------------------------------------------------------------------
-- Antes de rodar, em projeto que já tem dado
-- -----------------------------------------------------------------------------
-- As restrições de formato recusam linha existente fora do padrão. Para saber
-- se existe alguma, antes de começar:
--
--   select id, slug, logo_url, capa_url from public.negocios
--    where logo_url ~ '^https?://' or capa_url ~ '^https?://';
--   select id, url from public.fotos where url ~ '^https?://';
--   select id, url from public.itens_fotos where url ~ '^https?://';
--
-- Vindo linha, decidir uma a uma antes de aplicar. Vindo vazio, seguir.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Texto alternativo próprio para a logo e para a capa
-- -----------------------------------------------------------------------------
-- Nulo quer dizer: vale o texto derivado do nome do negócio, que é o que
-- lib/supabase/mapa.ts já faz hoje. A coluna existe para a pessoa poder
-- melhorar, e o produto continua inteiro enquanto ela deixa como está.

alter table public.negocios
  add column if not exists logo_alt text,
  add column if not exists capa_alt text;

alter table public.negocios
  drop constraint if exists logo_alt_tamanho,
  add constraint logo_alt_tamanho check (
    logo_alt is null or length(btrim(logo_alt)) between 1 and 160
  );

alter table public.negocios
  drop constraint if exists capa_alt_tamanho,
  add constraint capa_alt_tamanho check (
    capa_alt is null or length(btrim(capa_alt)) between 1 and 160
  );

comment on column public.negocios.logo_alt is
  'Texto alternativo da logo. Nulo vale o nome do negócio, derivado no código.';
comment on column public.negocios.capa_alt is
  'Texto alternativo da capa. Nulo vale o nome do negócio, derivado no código.';

-- -----------------------------------------------------------------------------
-- 2. As quatro colunas de imagem só aceitam caminho de dentro do bucket
-- -----------------------------------------------------------------------------
-- Duas formas passam, e só elas:
--
--   a) endereço local, começando com barra. É o das páginas de exemplo
--      (/exemplo/logo.jpg) e o do modo sem Supabase;
--   b) caminho do bucket, no padrão {negocio_id}/{pasta}/{uuid}.{extensão},
--      com a primeira pasta obrigatoriamente igual ao id do próprio negócio.
--
-- O split_part é o que amarra o arquivo à linha. Sem ele, a restrição garantiria
-- só o formato, e um caminho bem formado apontando para a pasta de outro negócio
-- passaria.
--
-- A extensão fica na lista curta que o bucket aceita em allowed_mime_types. As
-- duas conferências são independentes de propósito: a do bucket olha o
-- cabeçalho que o navegador mandou, esta olha o que ficou gravado.

alter table public.negocios
  drop constraint if exists logo_url_formato,
  add constraint logo_url_formato check (
    logo_url is null
    or logo_url ~ '^/'
    or (
      split_part(logo_url, '/', 1) = id::text
      and logo_url ~ ('^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
                      || '/logo/'
                      || '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
                      || '\.(webp|jpg|jpeg|png)$')
    )
  );

alter table public.negocios
  drop constraint if exists capa_url_formato,
  add constraint capa_url_formato check (
    capa_url is null
    or capa_url ~ '^/'
    or (
      split_part(capa_url, '/', 1) = id::text
      and capa_url ~ ('^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
                      || '/capa/'
                      || '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
                      || '\.(webp|jpg|jpeg|png)$')
    )
  );

alter table public.fotos
  drop constraint if exists url_formato,
  add constraint url_formato check (
    url ~ '^/'
    or (
      split_part(url, '/', 1) = negocio_id::text
      and url ~ ('^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
                 || '/galeria/'
                 || '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
                 || '\.(webp|jpg|jpeg|png)$')
    )
  );

alter table public.itens_fotos
  drop constraint if exists url_formato,
  add constraint url_formato check (
    url ~ '^/'
    or (
      split_part(url, '/', 1) = negocio_id::text
      and url ~ ('^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
                 || '/catalogo/'
                 || '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
                 || '\.(webp|jpg|jpeg|png)$')
    )
  );

comment on column public.fotos.url is
  'Caminho dentro do bucket imagens, ou endereço local começando com barra. O endereço público é montado no código.';
comment on column public.itens_fotos.url is
  'Caminho dentro do bucket imagens, ou endereço local começando com barra. O endereço público é montado no código.';

-- -----------------------------------------------------------------------------
-- 3. A fila do que precisa sumir do Storage
-- -----------------------------------------------------------------------------
-- Mesmo desenho de `denuncias`: RLS ligada e nenhuma política. Com isso ninguém
-- lê nem escreve pelo navegador, nem o dono das imagens. Quem escreve é o
-- gatilho, que é security definer e roda como dono do banco. Quem lê e esvazia é
-- a chave de serviço, que passa por cima da RLS e é só do servidor.
--
-- O caminho é a chave primária: enfileirar duas vezes o mesmo arquivo é o mesmo
-- que enfileirar uma, e a manutenção pode rodar quantas vezes quiser.

create table if not exists public.imagens_para_apagar (
  caminho text primary key,
  criado_em timestamptz not null default now()
);

alter table public.imagens_para_apagar enable row level security;

revoke all on public.imagens_para_apagar from anon, authenticated;

create index if not exists imagens_para_apagar_idx
  on public.imagens_para_apagar (criado_em);

-- O gatilho lê as colunas pelo nome, recebido como argumento, porque são três
-- tabelas com nomes de coluna diferentes e a regra é a mesma nas três. Com
-- to_jsonb dá para ler a coluna pelo nome sem escrever uma função por tabela.
--
-- security definer porque `authenticated` não tem permissão nenhuma na fila, e
-- é justamente isso que a fila precisa: o dono provoca a escrita sem conseguir
-- tocar na tabela.
create or replace function public.enfileira_imagem_removida()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_antes jsonb := to_jsonb(old);
  v_depois jsonb := case when tg_op = 'UPDATE' then to_jsonb(new) else null end;
  v_coluna text;
  v_caminho text;
begin
  foreach v_coluna in array tg_argv loop
    v_caminho := v_antes ->> v_coluna;

    -- Vazio e endereço local ficam de fora: arquivo do bucket é o que tem
    -- pasta e nenhuma barra na frente.
    continue when v_caminho is null or left(v_caminho, 1) = '/';

    -- Em UPDATE, só o que de fato saiu de cena. A tela do painel manda a linha
    -- inteira em todo salvamento, então a coluna aparece no UPDATE mesmo
    -- quando ninguém trocou imagem nenhuma.
    continue when v_depois is not null
      and (v_depois ->> v_coluna) is not distinct from v_caminho;

    insert into public.imagens_para_apagar (caminho)
    values (v_caminho)
    on conflict (caminho) do nothing;
  end loop;

  return null;
end;
$$;

-- Cascata conta como delete de linha, então apagar um item enfileira as fotos
-- dele, apagar um negócio enfileira a galeria inteira, e apagar a conta
-- provisória parada (limpar_rascunhos_abandonados) enfileira tudo que a pessoa
-- tinha enviado. É o caminho que mais deixava lixo e o que ninguém veria.

drop trigger if exists fotos_enfileira_removida on public.fotos;
create trigger fotos_enfileira_removida
  after delete on public.fotos
  for each row execute function public.enfileira_imagem_removida('url');

drop trigger if exists itens_fotos_enfileira_removida on public.itens_fotos;
create trigger itens_fotos_enfileira_removida
  after delete on public.itens_fotos
  for each row execute function public.enfileira_imagem_removida('url');

drop trigger if exists negocios_enfileira_removida on public.negocios;
create trigger negocios_enfileira_removida
  after update or delete on public.negocios
  for each row
  execute function public.enfileira_imagem_removida('logo_url', 'capa_url');

-- -----------------------------------------------------------------------------
-- 4. A varredura do arquivo que nunca virou linha
-- -----------------------------------------------------------------------------
-- Devolve o caminho, o tamanho e a data de todo arquivo do bucket `imagens` que
-- nenhuma das três tabelas aponta.
--
-- security INVOKER de propósito, que é o padrão e aqui é decisão. Quem chama é
-- a chave de serviço, que enxerga storage.objects e as tabelas inteiras por
-- conta própria. Virar definer só transferiria a leitura para o dono do banco
-- sem ganhar nada, e criaria uma função poderosa a mais para alguém lembrar de
-- fechar.
--
-- A carência em horas existe para o arquivo recém-enviado ficar de fora: entre
-- o envio e a linha há uma viagem de rede, e uma varredura sem carência apagaria
-- exatamente a foto que a pessoa está terminando de mandar.
create or replace function public.imagens_orfas(p_horas integer default 24)
returns table (caminho text, bytes bigint, criado_em timestamptz)
language plpgsql
stable
set search_path = public, pg_temp
as $$
begin
  return query
  select o.name,
         coalesce((o.metadata ->> 'size')::bigint, 0),
         o.created_at
    from storage.objects o
   where o.bucket_id = 'imagens'
     and o.created_at < now() - make_interval(hours => p_horas)
     and not exists (
       select 1 from public.negocios n
        where n.logo_url = o.name or n.capa_url = o.name
     )
     and not exists (select 1 from public.fotos f where f.url = o.name)
     and not exists (select 1 from public.itens_fotos i where i.url = o.name)
   order by o.created_at;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. Fechar as duas funções novas, na mão
-- -----------------------------------------------------------------------------
-- Função nova nasce aberta por dois caminhos, e nenhum se fecha sozinho em
-- arquivo de correção. Medido no Postgres 16: o
-- "alter default privileges ... revoke execute on functions from public" do
-- schema.sql não guarda linha em pg_default_acl, e a função criada depois
-- continua nascendo com PUBLIC podendo executar. Quem fecha é o
-- "revoke execute on all functions", que roda no fim do schema.sql e não passa
-- por aqui. Ver a nota na 005 e em LEIA-ME.md.

-- service_role fica fora deste revoke de propósito. Ver a conferência 6 no fim
-- do arquivo: função de gatilho recusa chamada direta, então execute sobre ela
-- entrega nada, e tirar de service_role criaria divergência sem fechar buraco.
revoke execute on function public.enfileira_imagem_removida()
  from public, anon, authenticated;
revoke execute on function public.imagens_orfas(integer)
  from public, anon, authenticated;

-- A varredura é manutenção, como limpar_eventos_antigos e
-- limpar_rascunhos_abandonados. Só a chave de serviço.
grant execute on function public.imagens_orfas(integer) to service_role;

commit;

-- =============================================================================
-- Conferir, nesta ordem
-- =============================================================================
-- 1. As duas colunas novas existem:
--
--   select column_name, data_type from information_schema.columns
--    where table_schema = 'public' and table_name = 'negocios'
--      and column_name in ('logo_alt', 'capa_alt');
--
--   Tem que trazer as duas, as duas como text.
--
-- 2. A restrição de formato recusa endereço de fora. Com o id de um negócio de
--    teste no lugar do id abaixo:
--
--   update public.negocios set capa_url = 'https://exemplo.com/foto.jpg'
--    where id = '<id>';
--
--   Tem que dar erro de check constraint (capa_url_formato).
--
-- 3. E aceita o caminho certo:
--
--   update public.negocios
--      set capa_url = id::text || '/capa/'
--                     || gen_random_uuid()::text || '.webp'
--    where id = '<id>';
--
--   Tem que passar.
--
-- 4. A troca da capa enfileira a anterior:
--
--   select caminho from public.imagens_para_apagar order by criado_em desc limit 5;
--
--   Refazendo o passo 3, o caminho do passo anterior tem que aparecer aqui.
--
-- 5. A fila fica fora do alcance do navegador:
--
--   select has_table_privilege('anon', 'public.imagens_para_apagar', 'select'),
--          has_table_privilege('authenticated', 'public.imagens_para_apagar', 'insert');
--
--   As duas têm que vir false.
--
-- 6. A varredura fica fora do alcance do visitante:
--
--   select p.proname,
--          has_function_privilege('anon', p.oid, 'execute') as anon,
--          has_function_privilege('authenticated', p.oid, 'execute') as logado,
--          has_function_privilege('service_role', p.oid, 'execute') as servico
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public'
--      and p.proname in ('imagens_orfas', 'enfileira_imagem_removida');
--
--   anon e logado têm que vir false nas duas. servico tem que vir true nas
--   duas, e a segunda merece explicação, porque a primeira versão deste
--   comentário prometia false e o banco respondeu true.
--
--   O revoke logo acima tira execute de public, anon e authenticated, e deixa
--   service_role de fora de propósito: no Supabase, service_role recebe execute
--   por concessão própria do projeto, e tirar aqui só criaria divergência para
--   a próxima função nova reabrir.
--
--   E ele não abre nada. `enfileira_imagem_removida` é `returns trigger`, e o
--   Postgres recusa chamada direta de função de gatilho com "trigger functions
--   can only be called as triggers", SQLSTATE 0A000, antes de executar uma
--   linha do corpo. Privilégio de execute sobre ela entrega exatamente nada,
--   com ou sem chave de serviço.
--
--   A conferência que vale para essas duas é a de anon e authenticated, e é ela
--   que precisa vir false.
--
-- 7. A varredura responde, mesmo com o bucket vazio:
--
--   select * from public.imagens_orfas(24);
--
--   Com o bucket recém-criado tem que vir vazio, sem erro.
--
-- 8. A bateria inteira continua passando: rodar supabase/testes-rls.sql. Tem que
--    terminar com TODOS OS TESTES PASSARAM.
--
-- -----------------------------------------------------------------------------
-- Desfazer
-- -----------------------------------------------------------------------------
--   begin;
--   drop trigger if exists negocios_enfileira_removida on public.negocios;
--   drop trigger if exists itens_fotos_enfileira_removida on public.itens_fotos;
--   drop trigger if exists fotos_enfileira_removida on public.fotos;
--   drop function if exists public.enfileira_imagem_removida();
--   drop function if exists public.imagens_orfas(integer);
--   drop table if exists public.imagens_para_apagar;
--   alter table public.itens_fotos drop constraint if exists url_formato;
--   alter table public.fotos drop constraint if exists url_formato;
--   alter table public.negocios drop constraint if exists capa_url_formato;
--   alter table public.negocios drop constraint if exists logo_url_formato;
--   alter table public.negocios drop constraint if exists capa_alt_tamanho;
--   alter table public.negocios drop constraint if exists logo_alt_tamanho;
--   alter table public.negocios drop column if exists capa_alt;
--   alter table public.negocios drop column if exists logo_alt;
--   commit;
