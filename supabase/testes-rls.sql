-- =============================================================================
-- Testes de RLS e de limites
-- =============================================================================
-- Roda dentro de uma transação e desfaz tudo no fim, então pode ser executado
-- num projeto com dados sem sujar nada.
--
--   psql "$URL_DO_BANCO" -v ON_ERROR_STOP=1 -f supabase/testes-rls.sql
--
-- Qualquer linha "FALHOU" interrompe a execução. No fim tem que aparecer
-- "TODOS OS TESTES PASSARAM".
-- =============================================================================

\set ON_ERROR_STOP on
begin;

create schema testes;

-- Vira o papel e o usuário logado. Passar null vira visitante anônimo.
create function testes.como(p_uid uuid) returns void language plpgsql as $$
begin
  execute 'reset role';
  if p_uid is null then
    perform set_config('request.jwt.claim.sub', '', true);
    execute 'set local role anon';
  else
    perform set_config('request.jwt.claim.sub', p_uid::text, true);
    execute 'set local role authenticated';
  end if;
end;
$$;

create function testes.ok(p_nome text, p_condicao boolean) returns void language plpgsql as $$
begin
  if p_condicao then
    raise notice 'ok      %', p_nome;
  else
    raise exception 'FALHOU: %', p_nome;
  end if;
end;
$$;

-- Para o que TEM que dar erro. Se passar, o teste falha.
create function testes.barrado(p_nome text, p_sql text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    raise notice 'ok      % (%)', p_nome, replace(sqlerrm, E'\n', ' ');
    return;
  end;
  raise exception 'FALHOU: % deixou passar', p_nome;
end;
$$;

-- As funções acima são chamadas já dentro do papel de visitante ou de dono.
grant usage on schema testes to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Cenário
-- -----------------------------------------------------------------------------
-- Dois donos. A tem a página no ar, B tem a página ainda não publicada.

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'ana@exemplo.com'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'bruno@exemplo.com');

insert into public.negocios (id, dono_id, slug, nome, publicado, whatsapp, cidade, estado)
values
  ('11111111-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
   'doceria-da-ana', 'Doceria da Ana', true, '5511988887777', 'São Paulo', 'SP'),
  ('22222222-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002',
   'barbearia-do-bruno', 'Barbearia do Bruno', false, '5511977776666', 'Curitiba', 'PR');

insert into public.itens (id, negocio_id, titulo, preco_centavos) values
  ('aa000000-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', 'Bolo de cenoura', 6800),
  ('bb000000-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000002', 'Corte social', 4500);

insert into public.horarios (negocio_id, dia_semana, abre, fecha) values
  ('11111111-0000-4000-8000-000000000001', 2, '09:00', '18:00');

insert into public.fotos (negocio_id, url, alt) values
  ('11111111-0000-4000-8000-000000000001', '/f/1.jpg', 'Vitrine da loja');

insert into public.links (negocio_id, rotulo, url) values
  ('11111111-0000-4000-8000-000000000001', 'Instagram', 'https://instagram.com/');

-- =============================================================================
-- Visitante anônimo
-- =============================================================================

select testes.como(null);

select testes.ok('anônimo lê negócio publicado',
  (select count(*) from public.negocios where slug = 'doceria-da-ana') = 1);

select testes.ok('anônimo NÃO lê negócio não publicado',
  (select count(*) from public.negocios where slug = 'barbearia-do-bruno') = 0);

select testes.ok('anônimo lê o cardápio de quem está no ar',
  (select count(*) from public.itens) = 1);

select testes.ok('anônimo lê horário, galeria e links de quem está no ar',
  (select count(*) from public.horarios) = 1
  and (select count(*) from public.fotos) = 1
  and (select count(*) from public.links) = 1);

select testes.ok('anônimo lê a lista de endereços reservados',
  (select count(*) from public.slugs_reservados) > 0);

select testes.barrado('anônimo NÃO cria negócio', $q$
  insert into public.negocios (dono_id, slug, nome)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'invasao', 'Invasão')
$q$);

select testes.barrado('anônimo NÃO cria item', $q$
  insert into public.itens (negocio_id, titulo)
  values ('11111111-0000-4000-8000-000000000001', 'Item pirata')
$q$);

select testes.barrado('anônimo NÃO lê eventos', $q$
  select count(*) from public.eventos
$q$);

select testes.barrado('anônimo NÃO escreve em eventos direto', $q$
  insert into public.eventos (negocio_id, tipo)
  values ('11111111-0000-4000-8000-000000000001', 'visita')
$q$);

-- O visitante não tem permissão de escrita na tabela, então nem chega na RLS.
select testes.barrado('anônimo NÃO altera negócio publicado', $q$
  update public.negocios set nome = 'Sequestrado' where slug = 'doceria-da-ana'
$q$);

-- =============================================================================
-- Registro de eventos pela função
-- =============================================================================

select public.registrar_evento('doceria-da-ana', 'visita');
select public.registrar_evento('doceria-da-ana', 'clique_whatsapp');

-- Negócio não publicado não conta nada, e sem erro, para não virar sonda.
select public.registrar_evento('barbearia-do-bruno', 'visita');
select public.registrar_evento('nao-existe', 'visita');

select testes.barrado('tipo de evento inventado é recusado', $q$
  select public.registrar_evento('doceria-da-ana', 'clique_pix')
$q$);

reset role;
select testes.ok('a função gravou só os dois eventos válidos',
  (select count(*) from public.eventos) = 2);
select testes.ok('nada foi gravado para negócio fora do ar',
  (select count(*) from public.eventos
   where negocio_id = '22222222-0000-4000-8000-000000000002') = 0);

-- =============================================================================
-- Dono A
-- =============================================================================

select testes.como('aaaaaaaa-0000-4000-8000-000000000001');

select testes.ok('A enxerga a própria página',
  (select count(*) from public.negocios where dono_id = 'aaaaaaaa-0000-4000-8000-000000000001') = 1);

select testes.ok('A NÃO enxerga a página não publicada de B',
  (select count(*) from public.negocios where slug = 'barbearia-do-bruno') = 0);

select testes.ok('A NÃO enxerga o cardápio de B',
  (select count(*) from public.itens
   where negocio_id = '22222222-0000-4000-8000-000000000002') = 0);

do $$
declare v integer;
begin
  update public.negocios set nome = 'Doceria da Ana, Vila Mariana'
    where id = '11111111-0000-4000-8000-000000000001';
  get diagnostics v = row_count;
  perform testes.ok('A edita a própria página', v = 1);

  update public.negocios set nome = 'Tomada'
    where id = '22222222-0000-4000-8000-000000000002';
  get diagnostics v = row_count;
  perform testes.ok('A NÃO edita a página de B', v = 0);

  delete from public.negocios where id = '22222222-0000-4000-8000-000000000002';
  get diagnostics v = row_count;
  perform testes.ok('A NÃO apaga a página de B', v = 0);
end;
$$;

select testes.barrado('A NÃO cria item dentro do negócio de B', $q$
  insert into public.itens (negocio_id, titulo)
  values ('22222222-0000-4000-8000-000000000002', 'Item plantado')
$q$);

select testes.barrado('A NÃO cria negócio no nome de B', $q$
  insert into public.negocios (dono_id, slug, nome)
  values ('bbbbbbbb-0000-4000-8000-000000000002', 'clone', 'Clone')
$q$);

select testes.ok('A lê os próprios eventos',
  (select count(*) from public.eventos) = 2);

select testes.barrado('A NÃO escreve em eventos, nem os próprios', $q$
  insert into public.eventos (negocio_id, tipo)
  values ('11111111-0000-4000-8000-000000000001', 'visita')
$q$);

-- =============================================================================
-- Campos de cobrança
-- =============================================================================

update public.negocios
  set plano = 'pago', plano_expira_em = now() + interval '10 years', status = 'suspenso'
  where id = '11111111-0000-4000-8000-000000000001';

select testes.ok('A NÃO consegue se dar plano pago',
  (select plano from public.negocios where id = '11111111-0000-4000-8000-000000000001') = 'gratuito');

select testes.ok('A NÃO consegue mexer no próprio status',
  (select status from public.negocios where id = '11111111-0000-4000-8000-000000000001') = 'ativo');

-- =============================================================================
-- Limites do plano gratuito
-- =============================================================================

-- Cardápio: 20 itens. Já existe 1, então mais 19 entram e o 21 é barrado.
do $$
begin
  for i in 2..20 loop
    insert into public.itens (negocio_id, titulo)
    values ('11111111-0000-4000-8000-000000000001', 'Item ' || i);
  end loop;
  perform testes.ok('20 itens entram no plano gratuito',
    (select count(*) from public.itens
     where negocio_id = '11111111-0000-4000-8000-000000000001') = 20);
end;
$$;

select testes.barrado('o item 21 é barrado', $q$
  insert into public.itens (negocio_id, titulo)
  values ('11111111-0000-4000-8000-000000000001', 'Item 21')
$q$);

-- Fotos por item: 3.
insert into public.itens_fotos (item_id, negocio_id, url, alt) values
  ('aa000000-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', '/f/a1.jpg', 'Bolo inteiro'),
  ('aa000000-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', '/f/a2.jpg', 'Fatia do bolo'),
  ('aa000000-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', '/f/a3.jpg', 'Bolo na caixa');

select testes.barrado('a quarta foto do item é barrada', $q$
  insert into public.itens_fotos (item_id, negocio_id, url, alt)
  values ('aa000000-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', '/f/a4.jpg', 'Mais uma')
$q$);

select testes.barrado('foto não pode apontar para item de outro negócio', $q$
  insert into public.itens_fotos (item_id, negocio_id, url, alt)
  values ('bb000000-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000001', '/f/x.jpg', 'Roubada')
$q$);

-- Galeria: 12. Já existe 1.
do $$
begin
  for i in 2..12 loop
    insert into public.fotos (negocio_id, url, alt)
    values ('11111111-0000-4000-8000-000000000001', '/g/' || i || '.jpg', 'Foto ' || i);
  end loop;
end;
$$;

select testes.barrado('a foto 13 da galeria é barrada', $q$
  insert into public.fotos (negocio_id, url, alt)
  values ('11111111-0000-4000-8000-000000000001', '/g/13.jpg', 'Foto 13')
$q$);

-- Links: 8. Já existe 1.
do $$
begin
  for i in 2..8 loop
    insert into public.links (negocio_id, rotulo, url)
    values ('11111111-0000-4000-8000-000000000001', 'Link ' || i, 'https://exemplo.com/' || i);
  end loop;
end;
$$;

select testes.barrado('o link 9 é barrado', $q$
  insert into public.links (negocio_id, rotulo, url)
  values ('11111111-0000-4000-8000-000000000001', 'Link 9', 'https://exemplo.com/9')
$q$);

-- Horários: 3 intervalos por dia. Já existe 1 na terça.
insert into public.horarios (negocio_id, dia_semana, abre, fecha) values
  ('11111111-0000-4000-8000-000000000001', 2, '19:00', '22:00'),
  ('11111111-0000-4000-8000-000000000001', 2, '23:00', '00:30');

select testes.barrado('o quarto intervalo no mesmo dia é barrado', $q$
  insert into public.horarios (negocio_id, dia_semana, abre, fecha)
  values ('11111111-0000-4000-8000-000000000001', 2, '02:00', '04:00')
$q$);

select testes.ok('turno que vira a madrugada é aceito',
  (select count(*) from public.horarios
   where negocio_id = '11111111-0000-4000-8000-000000000001'
     and abre > fecha) = 1);

select testes.barrado('segunda página na mesma conta é barrada no gratuito', $q$
  insert into public.negocios (dono_id, slug, nome)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'segunda-pagina', 'Segunda')
$q$);

-- =============================================================================
-- Endereço
-- =============================================================================

select testes.barrado('endereço reservado é recusado', $q$
  update public.negocios set slug = 'painel'
  where id = '11111111-0000-4000-8000-000000000001'
$q$);

select testes.barrado('endereço com maiúscula é recusado', $q$
  update public.negocios set slug = 'Doceria'
  where id = '11111111-0000-4000-8000-000000000001'
$q$);

select testes.barrado('endereço com espaço é recusado', $q$
  update public.negocios set slug = 'doceria da ana'
  where id = '11111111-0000-4000-8000-000000000001'
$q$);

select testes.barrado('WhatsApp com pontuação é recusado', $q$
  update public.negocios set whatsapp = '(11) 98888-7777'
  where id = '11111111-0000-4000-8000-000000000001'
$q$);

update public.negocios set slug = 'doceria-da-ana-vila-mariana'
  where id = '11111111-0000-4000-8000-000000000001';

select testes.ok('trocar de endereço guarda o antigo sozinho',
  (select slug_anterior from public.negocios
   where id = '11111111-0000-4000-8000-000000000001') = 'doceria-da-ana');

-- =============================================================================
-- Dono B
-- =============================================================================

select testes.como('bbbbbbbb-0000-4000-8000-000000000002');

select testes.ok('B enxerga a própria página mesmo sem publicar',
  (select count(*) from public.negocios
   where id = '22222222-0000-4000-8000-000000000002') = 1);

select testes.ok('B também enxerga a página publicada de A',
  (select count(*) from public.negocios
   where id = '11111111-0000-4000-8000-000000000001') = 1);

select testes.barrado('B NÃO pode tomar o endereço antigo de A', $q$
  update public.negocios set slug = 'doceria-da-ana'
  where id = '22222222-0000-4000-8000-000000000002'
$q$);

-- =============================================================================
-- Plano pago vencido
-- =============================================================================

reset role;

update public.negocios
  set plano = 'pago', plano_expira_em = now() - interval '1 day'
  where id = '22222222-0000-4000-8000-000000000002';

select testes.ok('plano pago vencido volta a valer como gratuito',
  public.plano_de('22222222-0000-4000-8000-000000000002') = 'gratuito');

update public.negocios
  set plano_expira_em = now() + interval '30 days'
  where id = '22222222-0000-4000-8000-000000000002';

select testes.ok('plano pago dentro da validade vale como pago',
  public.plano_de('22222222-0000-4000-8000-000000000002') = 'pago');

-- =============================================================================
-- Página suspensa some da internet
-- =============================================================================

update public.negocios set status = 'suspenso'
  where id = '11111111-0000-4000-8000-000000000001';

select testes.como(null);

select testes.ok('página suspensa some para o visitante',
  (select count(*) from public.negocios
   where id = '11111111-0000-4000-8000-000000000001') = 0);

select testes.ok('o cardápio da página suspensa some junto',
  (select count(*) from public.itens) = 0);

select testes.como('aaaaaaaa-0000-4000-8000-000000000001');

select testes.ok('mas o dono continua enxergando a própria página suspensa',
  (select count(*) from public.negocios
   where id = '11111111-0000-4000-8000-000000000001') = 1);

reset role;

do $$
begin
  raise notice '';
  raise notice 'TODOS OS TESTES PASSARAM';
end;
$$;

rollback;
