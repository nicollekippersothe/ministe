-- =============================================================================
-- Testes de RLS e de limites
-- =============================================================================
-- Roda dentro de uma transação e desfaz tudo no fim, então pode ser executado
-- num projeto com dados sem sujar nada.
--
-- Dois jeitos de rodar, e os dois valem:
--
--   1. Colar o arquivo inteiro no SQL Editor do Supabase e executar. Não
--      precisa da senha do banco.
--
--   2. psql "$URL_DO_BANCO" -v ON_ERROR_STOP=1 -f supabase/testes-rls.sql
--
-- Não tem comando de psql aqui dentro de propósito: é SQL puro, para o SQL
-- Editor aceitar. Quem falha é testes.ok, que levanta exceção, e exceção já
-- aborta o script e desfaz a transação nos dois ambientes. O ON_ERROR_STOP da
-- linha de comando acima é cinto e suspensório, não requisito.
--
-- Qualquer linha "FALHOU" interrompe a execução. No fim tem que aparecer
-- "TODOS OS TESTES PASSARAM".
-- =============================================================================

begin;

create schema testes;

-- Vira o papel e o usuário logado. Passar null vira visitante anônimo.
--
-- Monta o token inteiro, e não só o sub, porque é assim que o Supabase manda:
-- o auth.jwt() lê o JSON completo, e é por ele que o banco sabe se a conta é
-- provisória. Token pela metade aqui deixaria a regra de publicação sem teste.
create function testes.como(p_uid uuid, p_provisorio boolean default false)
returns void language plpgsql as $$
begin
  execute 'reset role';
  if p_uid is null then
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    execute 'set local role anon';
  else
    perform set_config('request.jwt.claim.sub', p_uid::text, true);
    perform set_config('request.jwt.claims', json_build_object(
      'sub', p_uid, 'role', 'authenticated', 'is_anonymous', p_provisorio
    )::text, true);
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
--
-- O p_trecho existe porque "deu erro" é fácil demais de conseguir: um teste
-- desta bateria já passou verde apanhando do limite de páginas por conta,
-- enquanto a regra que ele dizia estar conferindo nem tinha sido alcançada.
-- Quando o motivo importa, escreva um pedaço da mensagem esperada.
create function testes.barrado(p_nome text, p_sql text, p_trecho text default null)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if p_trecho is not null and position(p_trecho in sqlerrm) = 0 then
      raise exception 'FALHOU: % foi barrado por outro motivo (%)',
        p_nome, replace(sqlerrm, E'\n', ' ');
    end if;
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
-- Denúncia
-- =============================================================================
-- Quem denuncia é visitante, sem conta. Então a função aceita anônimo, mas a
-- tabela não: ninguém lê nem escreve direto, nem o dono do negócio denunciado.

select testes.como(null);

select public.registrar_denuncia('doceria-da-ana', 'golpe', 'O botão leva para um Pix.');

-- Página fora do ar também pode ser denunciada: é justamente o caso de quem
-- caiu no golpe depois que a página saiu.
select public.registrar_denuncia('barbearia-do-bruno', 'golpe', null);

-- Endereço que não existe volta calado, senão a denúncia vira sonda para
-- descobrir quais páginas existem.
select public.registrar_denuncia('nao-existe', 'golpe', null);

select testes.barrado('motivo inventado é recusado', $q$
  select public.registrar_denuncia('doceria-da-ana', 'nao-gostei', null)
$q$);

select testes.barrado('visitante não lê a fila de denúncias', $q$
  select count(*) from public.denuncias
$q$);

select testes.barrado('visitante não escreve direto na tabela', $q$
  insert into public.denuncias (negocio_id, motivo)
  values ('11111111-0000-4000-8000-000000000001', 'golpe')
$q$);

select testes.como('aaaaaaaa-0000-4000-8000-000000000001');
select testes.barrado('nem o dono lê as denúncias contra ele', $q$
  select count(*) from public.denuncias
$q$);

reset role;
select testes.ok('a função gravou as duas denúncias de página existente',
  (select count(*) from public.denuncias) = 2);
select testes.ok('e guardou o detalhe de quem escreveu',
  (select detalhe from public.denuncias
   where motivo = 'golpe' and detalhe is not null) = 'O botão leva para um Pix.');

-- Teto por página por dia. Sem ele, uma pessoa irritada enche a fila e as
-- denúncias de verdade somem no meio.
do $$
declare i integer;
begin
  for i in 1..30 loop
    perform public.registrar_denuncia('doceria-da-ana', 'outro', null);
  end loop;
end;
$$;

select testes.ok('o teto de vinte por dia segura a enxurrada',
  (select count(*) from public.denuncias
   where negocio_id = '11111111-0000-4000-8000-000000000001') = 20);

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
-- Conta provisória: monta o rascunho, e o Google é que põe no ar
-- =============================================================================
-- A pessoa começa a página antes de ter conta, numa conta provisória, e entra
-- com o Google na hora de publicar. Para o banco ela é usuário como qualquer
-- outro, e o que separa uma coisa da outra é o is_anonymous do token.
--
-- Estes testes existem porque a tela vai levar para o Google antes de deixar
-- publicar, e tela é conforto: quem manda um PATCH direto no PostgREST passa
-- longe dela.

reset role;
insert into auth.users (id, email, is_anonymous, created_at) values
  ('cccccccc-0000-4000-8000-000000000003', null, true, now()),
  ('dddddddd-0000-4000-8000-000000000004', null, true, now() - interval '90 days'),
  ('eeeeeeee-0000-4000-8000-000000000005', null, true, now() - interval '90 days'),
  ('ffffffff-0000-4000-8000-000000000006', null, true, now());

select testes.como('cccccccc-0000-4000-8000-000000000003', true);

insert into public.negocios (id, dono_id, slug, nome)
values ('33333333-0000-4000-8000-000000000003',
        'cccccccc-0000-4000-8000-000000000003', 'quitanda-da-cida', 'Quitanda da Cida');

select testes.ok('conta provisória monta o rascunho, que é o ponto da mudança',
  (select count(*) from public.negocios where slug = 'quitanda-da-cida') = 1);

select testes.barrado('conta provisória NÃO põe a página no ar', $q$
  update public.negocios set publicado = true
   where id = '33333333-0000-4000-8000-000000000003'
$q$, 'conta confirmada');

select testes.ok('e o rascunho continua rascunho depois da tentativa',
  (select publicado from public.negocios
    where id = '33333333-0000-4000-8000-000000000003') = false);

-- O outro caminho: nascer publicada de uma vez, sem passar por update. Vai numa
-- conta provisória ainda sem página, senão quem barra é o limite de uma página
-- por conta e o teste passa sem nunca chegar na regra que ele diz conferir.
select testes.como('ffffffff-0000-4000-8000-000000000006', true);
select testes.barrado('conta provisória NÃO cria página já no ar', $q$
  insert into public.negocios (dono_id, slug, nome, publicado)
  values ('ffffffff-0000-4000-8000-000000000006', 'atalho', 'Atalho', true)
$q$, 'conta confirmada');

-- Entrar com o Google liga a identidade na mesma conta: o id continua o mesmo,
-- o is_anonymous vira falso, e o rascunho vira página no ar sem mudar de dono.
reset role;
update auth.users set is_anonymous = false, email = 'cida@exemplo.com'
  where id = 'cccccccc-0000-4000-8000-000000000003';
select testes.como('cccccccc-0000-4000-8000-000000000003');

update public.negocios set publicado = true
  where id = '33333333-0000-4000-8000-000000000003';

select testes.ok('depois do Google, a mesma conta publica o mesmo rascunho',
  (select publicado from public.negocios
    where id = '33333333-0000-4000-8000-000000000003') = true);

select testes.ok('e o dono continua sendo quem começou',
  (select dono_id from public.negocios
    where id = '33333333-0000-4000-8000-000000000003')
  = 'cccccccc-0000-4000-8000-000000000003');

-- -----------------------------------------------------------------------------
-- A faxina do que ficou parado
-- -----------------------------------------------------------------------------
reset role;

insert into public.negocios (id, dono_id, slug, nome)
values ('44444444-0000-4000-8000-000000000004',
        'dddddddd-0000-4000-8000-000000000004', 'parada-ha-tempo', 'Parada há tempo');

select testes.ok('a faxina fica fora do alcance do visitante',
  not has_function_privilege('anon',
    'public.limpar_rascunhos_abandonados(integer)', 'EXECUTE'));

select testes.ok('e fora do alcance de quem está logado',
  not has_function_privilege('authenticated',
    'public.limpar_rascunhos_abandonados(integer)', 'EXECUTE'));

select public.limpar_rascunhos_abandonados(30);

select testes.ok('a faxina leva o rascunho provisório parado, e o endereço volta',
  (select count(*) from public.negocios where slug = 'parada-ha-tempo') = 0);

select testes.ok('e leva junto a conta provisória que ficou sem nada',
  (select count(*) from auth.users
    where id = 'eeeeeeee-0000-4000-8000-000000000005') = 0);

select testes.ok('mas poupa a conta que entrou com o Google, por mais antiga que seja',
  (select count(*) from public.negocios where slug = 'quitanda-da-cida') = 1);

select testes.como('aaaaaaaa-0000-4000-8000-000000000001');

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

-- Contra golpe: endereço nosso com cara de banco circula sozinho no WhatsApp.
-- A conferência é por pedaço, então não adianta grudar numa palavra comum.

select testes.barrado('endereço com palavra restrita é recusado', $q$
  update public.negocios set slug = 'pix'
  where id = '11111111-0000-4000-8000-000000000001'
$q$);

select testes.barrado('e também quando a palavra é só um pedaço', $q$
  update public.negocios set slug = 'central-pix-caixa'
  where id = '11111111-0000-4000-8000-000000000001'
$q$);

select testes.barrado('se passar pela marca é recusado', $q$
  update public.negocios set slug = 'entrais-suporte'
  where id = '11111111-0000-4000-8000-000000000001'
$q$);

-- Mesma conta que o gatilho faz, para garantir que "centralina" não cai por
-- conter "central" dentro. Negócio de verdade não pode ser barrado por acaso.
select testes.ok('mas palavra que só contém a restrita passa',
  not exists (
    select 1 from public.pedacos_bloqueados
    where pedaco = any (string_to_array('padaria-centralina', '-'))
  ));

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

-- -----------------------------------------------------------------------------
-- Permissão de função
-- -----------------------------------------------------------------------------
-- Esta parte nasceu de um furo que passou por aqui sem ninguém ver.
--
-- A bateria testava RLS de tabela e nada de função. E o Postgres dá EXECUTE a
-- PUBLIC em toda função nova, então `revoke execute ... from anon` tirava o
-- direito nominal e deixava o herdado por PUBLIC de pé. Resultado: qualquer
-- pessoa com a chave pública podia chamar limpar_eventos_antigos() em
-- /rest/v1/rpc e apagar a tabela de eventos.
--
-- A primeira asserção é a que vale a longo prazo: ela pega qualquer função
-- futura que nasça aberta, sem precisar lembrar de escrever um teste nova.

-- Duas asserções, porque são dois caminhos diferentes de permissão e fechar um
-- não fecha o outro. A primeira versão desta parte só olhava PUBLIC, passava, e
-- deixava treze funções abertas por grant nominal.

select testes.ok('nenhuma função de public fica aberta para PUBLIC',
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (
        -- proacl nulo quer dizer permissão padrão, e a padrão inclui PUBLIC.
        p.proacl is null
        or exists (
          select 1 from aclexplode(p.proacl) a
          where a.grantee = 0 and a.privilege_type = 'EXECUTE'
        )
      )
  ));

-- Esta é a que vale a longo prazo: lista exata, e não "não existe nenhuma".
-- Função nova que nasça chamável cai aqui, sem ninguém precisar lembrar de
-- escrever teste para ela.
select testes.ok('visitante chama exatamente as três funções da página pública',
  (select coalesce(array_agg(p.proname order by p.proname), '{}'::name[])
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('anon', p.oid, 'EXECUTE'))
  = array['negocio_publico', 'registrar_denuncia', 'registrar_evento']::name[]);

select testes.ok('quem está logado chama essas três, mais plano_de',
  (select coalesce(array_agg(p.proname order by p.proname), '{}'::name[])
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('authenticated', p.oid, 'EXECUTE'))
  = array['negocio_publico', 'plano_de', 'registrar_denuncia',
          'registrar_evento']::name[]);

select testes.ok('toda função de public tem search_path fixo',
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and not exists (
        select 1 from unnest(coalesce(p.proconfig, '{}')) c
        where c like 'search_path=%'
      )
  ));

select testes.ok('visitante registra evento',
  has_function_privilege('anon', 'public.registrar_evento(text, text)', 'EXECUTE'));

select testes.ok('visitante registra denúncia',
  has_function_privilege('anon',
    'public.registrar_denuncia(text, text, text)', 'EXECUTE'));

-- Sem esta, as políticas de catálogo, foto, horário e link param de deixar o
-- visitante ler, porque expressão de política roda como quem consulta.
select testes.ok('visitante avalia negocio_publico, que mora nas políticas',
  has_function_privilege('anon', 'public.negocio_publico(uuid)', 'EXECUTE'));

select testes.ok('visitante NÃO apaga os eventos antigos',
  not has_function_privilege('anon',
    'public.limpar_eventos_antigos()', 'EXECUTE'));

select testes.ok('dono logado NÃO apaga os eventos antigos',
  not has_function_privilege('authenticated',
    'public.limpar_eventos_antigos()', 'EXECUTE'));

select testes.ok('a chave de serviço apaga, que é quem roda manutenção',
  has_function_privilege('service_role',
    'public.limpar_eventos_antigos()', 'EXECUTE'));

select testes.ok('visitante NÃO descobre o plano de um negócio',
  not has_function_privilege('anon', 'public.plano_de(uuid)', 'EXECUTE'));

-- O gatilho protege_cobranca é security invoker de propósito, para enxergar
-- pelo current_user quem está escrevendo. Então quem edita precisa poder
-- chamar plano_de, senão salvar o próprio negócio passa a dar erro.
select testes.ok('dono logado consulta plano_de, que o gatilho de cobrança usa',
  has_function_privilege('authenticated', 'public.plano_de(uuid)', 'EXECUTE'));

select testes.ok('visitante NÃO chama gatilho de limite direto',
  not has_function_privilege('anon', 'public.checa_limite_itens()', 'EXECUTE'));

do $$
begin
  raise notice '';
  raise notice 'TODOS OS TESTES PASSARAM';
end;
$$;

rollback;
