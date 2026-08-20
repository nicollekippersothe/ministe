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
-- O resultado sai como tabela, e não como mensagem. O SQL Editor do Supabase
-- descarta `raise notice`, então a bateria inteira rodava muda justamente no
-- lugar que o LEIA-ME manda usar: nem os "ok" nem o "TODOS OS TESTES PASSARAM"
-- apareciam ali. Cada asserção grava uma linha em testes.registro e o fim do
-- arquivo devolve essa tabela, que aparece nos dois caminhos e traz a contagem
-- vinda do banco em vez de um número escrito na mão.
--
-- Passou quando a última consulta devolve linhas, a primeira delas dizendo
-- "TODOS OS TESTES PASSARAM". Falhou quando o resultado é erro vermelho
-- começando em "FALHOU:", e nesse caso tabela nenhuma volta, porque a exceção
-- desfaz a transação.
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

-- O diário da bateria, que é o que aparece na tela no fim.
--
-- Tabela comum, e não temporária, porque as asserções rodam sob os papéis anon
-- e authenticated: tabela temporária pertence a quem a criou e os dois não
-- teriam onde gravar. Esta some junto com o schema testes no rollback do fim.
--
-- A numeração vem de coluna de identidade, que dispensa permissão na sequência,
-- então o grant abaixo é só de insert.
--
-- SOBRE O AVISO DO SQL EDITOR
--
-- O editor do Supabase abre um diálogo "Potential issues detected" ao ver esta
-- tabela nascer sem RLS, e ao ver os comandos destrutivos que a bateria usa de
-- propósito. **A escolha certa é "Run without RLS".**
--
-- A outra opção acrescenta um `enable row level security` ao script antes de
-- executar, e isso muda o que está sendo testado: as asserções gravam aqui de
-- dentro dos papéis anon e authenticated, e com RLS ligada e política nenhuma
-- elas parariam de gravar. A bateria passaria a medir a si mesma em vez de
-- medir o schema.
--
-- RLS aqui não protege nada que exista depois: a tabela e o schema inteiro
-- nascem e morrem dentro da transação, e o arquivo termina em rollback.
create table testes.registro (
  numero integer generated always as identity primary key,
  nome text not null,
  motivo text
);

create function testes.ok(p_nome text, p_condicao boolean) returns void language plpgsql as $$
begin
  if p_condicao then
    raise notice 'ok      %', p_nome;
    insert into testes.registro (nome) values (p_nome);
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
    insert into testes.registro (nome, motivo)
      values (p_nome, replace(sqlerrm, E'\n', ' '));
    return;
  end;
  raise exception 'FALHOU: % deixou passar', p_nome;
end;
$$;

-- As funções acima são chamadas já dentro do papel de visitante ou de dono, e
-- gravam no diário de dentro desses papéis.
grant usage on schema testes to anon, authenticated;
grant insert on testes.registro to anon, authenticated;

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

-- A conferência de endereço do cadastro. Ela existe porque a RLS esconde o
-- rascunho dos outros, e sem ela um endereço já escolhido apareceria como
-- livre até a hora de gravar.
select testes.ok('endereço que ninguém pegou está livre',
  public.endereco_livre('nome-que-ninguem-usou') = true);

select testes.ok('endereço de página no ar está ocupado',
  public.endereco_livre('doceria-da-ana') = false);

select testes.ok('e o rascunho dos outros também segura o endereço',
  public.endereco_livre('barbearia-do-bruno') = false);

select testes.ok('endereço reservado pelo sistema está ocupado',
  public.endereco_livre('painel') = false);

-- Responde sim ou não, e nada além disso: o visitante continua sem enxergar a
-- linha do rascunho que ele acabou de descobrir estar ocupada.
select testes.ok('e continua sem enxergar de quem é o rascunho',
  (select count(*) from public.negocios where slug = 'barbearia-do-bruno') = 0);

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
select testes.ok('visitante chama exatamente as quatro funções que ele precisa',
  (select coalesce(array_agg(p.proname order by p.proname), '{}'::name[])
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('anon', p.oid, 'EXECUTE'))
  = array['endereco_livre', 'negocio_publico',
          'registrar_denuncia', 'registrar_evento']::name[]);

select testes.ok('quem está logado chama essas quatro, mais plano_de e os números',
  (select coalesce(array_agg(p.proname order by p.proname), '{}'::name[])
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('authenticated', p.oid, 'EXECUTE'))
  = array['endereco_livre', 'negocio_publico', 'numeros_do_negocio',
          'plano_de', 'registrar_denuncia', 'registrar_evento']::name[]);

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

-- =============================================================================
-- Assinatura e cobrança
-- =============================================================================
-- Duas metades, e as duas importam.
--
-- A primeira é a de sempre: quem lê o quê. Assinatura e cobrança são do dono e
-- de mais ninguém, e o dono só lê, porque quem escreve é o webhook com a chave
-- de serviço.
--
-- A segunda é a do dinheiro, e é a razão de esta parte existir. O webhook
-- reenvia, e reenvia fora de ordem. Os testes de idempotência abaixo são os que
-- dizem que o mesmo pagamento aplicado duas vezes cobra um mês só, e que o
-- aviso atrasado de setembro não come o mês de outubro que já estava pago.
--
-- testes.como só sabe virar anon e authenticated. O que roda como serviço roda
-- depois de reset role, porque protege_cobranca trata postgres igual a
-- service_role, que é justamente a porta que a função usa.

insert into public.assinaturas
  (id, negocio_id, provedor, id_externo, ciclo, meio, status, valor_centavos)
values
  ('a5510000-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001',
   'mercadopago', 'preapproval-a', 'mensal', 'credito', 'ativa', 1990),
  ('a5510000-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000002',
   'mercadopago', 'preapproval-b', 'anual', 'pix', 'ativa', 19900);

insert into public.cobrancas
  (id, negocio_id, assinatura_id, id_externo, meio, valor_centavos, status, pago_em)
values
  ('c0b40000-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001',
   'a5510000-0000-4000-8000-000000000001', 'pagamento-a-antigo', 'credito', 1990,
   'paga', now()),
  ('c0b40000-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000002',
   'a5510000-0000-4000-8000-000000000002', 'pagamento-b', 'pix', 19900,
   'paga', now());

insert into public.avisos_pagamento (provedor, id_evento, topico)
values ('mercadopago', 'evento-1', 'payment');

-- Um evento para B, que é o que dá o que esconder no teste dos números.
insert into public.eventos (negocio_id, tipo)
values ('22222222-0000-4000-8000-000000000002', 'visita');

-- -----------------------------------------------------------------------------
-- Os dois índices que valem mais que a tabela
-- -----------------------------------------------------------------------------

-- Dois cliques no botão de assinar viram duas cobranças recorrentes, e quem
-- descobre é o cliente na fatura. Por isso a regra é do banco.
select testes.barrado('duas assinaturas vivas no mesmo negócio é barrado', $q$
  insert into public.assinaturas (negocio_id, valor_centavos, status)
  values ('11111111-0000-4000-8000-000000000001', 1990, 'teste')
$q$);

-- Encerrada não conta como viva, senão trocar de plano ficaria impossível.
insert into public.assinaturas (negocio_id, valor_centavos, status, cancelada_em)
values ('11111111-0000-4000-8000-000000000001', 990, 'encerrada', now());

select testes.ok('mas a encerrada convive com a viva, senão trocar de plano travava',
  (select count(*) from public.assinaturas
    where negocio_id = '11111111-0000-4000-8000-000000000001') = 2);

select testes.barrado('o mesmo preapproval não entra duas vezes', $q$
  insert into public.assinaturas (negocio_id, id_externo, valor_centavos, status)
  values ('33333333-0000-4000-8000-000000000003', 'preapproval-a', 1990, 'encerrada')
$q$);

select testes.barrado('o mesmo aviso do gateway não entra duas vezes', $q$
  insert into public.avisos_pagamento (provedor, id_evento, topico)
  values ('mercadopago', 'evento-1', 'payment')
$q$);

-- -----------------------------------------------------------------------------
-- O que o dono enxerga
-- -----------------------------------------------------------------------------

select testes.como('aaaaaaaa-0000-4000-8000-000000000001');

select testes.ok('o dono lê a própria assinatura',
  (select count(*) from public.assinaturas
    where negocio_id = '11111111-0000-4000-8000-000000000001') = 2);

select testes.ok('o dono NÃO lê a assinatura de outro',
  (select count(*) from public.assinaturas
    where negocio_id = '22222222-0000-4000-8000-000000000002') = 0);

select testes.ok('o dono lê a própria cobrança, que é o histórico dele',
  (select count(*) from public.cobrancas
    where negocio_id = '11111111-0000-4000-8000-000000000001') = 1);

select testes.ok('o dono NÃO lê a cobrança de outro',
  (select count(*) from public.cobrancas
    where negocio_id = '22222222-0000-4000-8000-000000000002') = 0);

-- Sem política de insert, update nem delete, e sem privilégio de tabela. Quem
-- escreve é o webhook, e o webhook é do servidor.
select testes.barrado('o dono NÃO cria assinatura para si', $q$
  insert into public.assinaturas (negocio_id, valor_centavos, status)
  values ('11111111-0000-4000-8000-000000000001', 100, 'ativa')
$q$);

select testes.barrado('o dono NÃO vira a própria assinatura para ativa', $q$
  update public.assinaturas set status = 'ativa'
   where negocio_id = '11111111-0000-4000-8000-000000000001'
$q$);

select testes.barrado('o dono NÃO apaga a própria cobrança', $q$
  delete from public.cobrancas
   where negocio_id = '11111111-0000-4000-8000-000000000001'
$q$);

select testes.barrado('nem o dono lê os avisos do gateway', $q$
  select count(*) from public.avisos_pagamento
$q$);

-- -----------------------------------------------------------------------------
-- O que o visitante enxerga
-- -----------------------------------------------------------------------------

select testes.como(null);

select testes.barrado('visitante NÃO lê assinatura', $q$
  select count(*) from public.assinaturas
$q$);

select testes.barrado('visitante NÃO lê cobrança', $q$
  select count(*) from public.cobrancas
$q$);

select testes.barrado('visitante NÃO lê os avisos do gateway', $q$
  select count(*) from public.avisos_pagamento
$q$);

-- -----------------------------------------------------------------------------
-- O endereço da rota de assinar
-- -----------------------------------------------------------------------------
-- A 009 acrescenta `assinar` em slugs_reservados, porque a rota /assinar vai
-- existir e o endereço estava solto. `precos`, `assinatura` e `cobranca` já
-- estavam reservados; este ficou de fora.

select testes.ok('o endereço da rota de assinar está reservado',
  not public.endereco_livre('assinar'));

-- -----------------------------------------------------------------------------
-- Quem alcança as funções do dinheiro
-- -----------------------------------------------------------------------------

reset role;

select testes.ok('registrar_cobranca_paga fica fora do alcance do visitante',
  not has_function_privilege('anon',
    'public.registrar_cobranca_paga(uuid, uuid, text, text, integer, timestamptz)',
    'EXECUTE'));

select testes.ok('e fora do alcance de quem está logado, que é o dono da página',
  not has_function_privilege('authenticated',
    'public.registrar_cobranca_paga(uuid, uuid, text, text, integer, timestamptz)',
    'EXECUTE'));

select testes.ok('a chave de serviço alcança, que é quem recebe o webhook',
  has_function_privilege('service_role',
    'public.registrar_cobranca_paga(uuid, uuid, text, text, integer, timestamptz)',
    'EXECUTE'));

select testes.ok('o estorno também é só da chave de serviço',
  not has_function_privilege('anon', 'public.desfazer_cobranca(text)', 'EXECUTE')
  and not has_function_privilege('authenticated',
        'public.desfazer_cobranca(text)', 'EXECUTE'));

select testes.ok('os números do painel são de quem tem painel',
  not has_function_privilege('anon',
    'public.numeros_do_negocio(uuid, integer)', 'EXECUTE')
  and has_function_privilege('authenticated',
        'public.numeros_do_negocio(uuid, integer)', 'EXECUTE'));

-- -----------------------------------------------------------------------------
-- O mesmo pagamento aplicado duas vezes, e o aviso fora de ordem
-- -----------------------------------------------------------------------------
-- É aqui que o greatest ganha o lugar dele. A tabela avisos_pagamento já
-- segura o reenvio do mesmo evento, mas ela não cobre dois eventos diferentes
-- chegando trocados: os dois são legítimos, os dois entram, e somar intervalo
-- daria um mês a mais para quem pagou um.

do $$
declare
  v_ate timestamptz := now() + interval '30 days';
  v_primeira timestamptz;
  v_segunda timestamptz;
  v_terceira timestamptz;
begin
  perform public.registrar_cobranca_paga(
    '11111111-0000-4000-8000-000000000001',
    'a5510000-0000-4000-8000-000000000001',
    'pagamento-a-1', 'credito', 1990, v_ate);

  select plano_expira_em into v_primeira
    from public.negocios where id = '11111111-0000-4000-8000-000000000001';

  perform testes.ok('a cobrança paga põe o negócio no plano pago',
    (select plano from public.negocios
      where id = '11111111-0000-4000-8000-000000000001') = 'pago');

  perform testes.ok('e o vencimento vira o instante que veio do pagamento',
    v_primeira = v_ate);

  perform testes.ok('a assinatura fica ativa, valendo até a mesma data',
    (select status = 'ativa' and ciclo_termina_em = v_ate
       from public.assinaturas
      where id = 'a5510000-0000-4000-8000-000000000001'));

  -- O gateway reenviou o mesmo aviso.
  perform public.registrar_cobranca_paga(
    '11111111-0000-4000-8000-000000000001',
    'a5510000-0000-4000-8000-000000000001',
    'pagamento-a-1', 'credito', 1990, v_ate);

  select plano_expira_em into v_segunda
    from public.negocios where id = '11111111-0000-4000-8000-000000000001';

  perform testes.ok('o mesmo pagamento aplicado duas vezes deixa o vencimento igual',
    v_segunda = v_primeira);

  perform testes.ok('e a cobrança continua sendo uma linha só',
    (select count(*) from public.cobrancas
      where id_externo = 'pagamento-a-1') = 1);

  -- O aviso do mês anterior chegando atrasado, depois do mês seguinte.
  perform public.registrar_cobranca_paga(
    '11111111-0000-4000-8000-000000000001',
    'a5510000-0000-4000-8000-000000000001',
    'pagamento-a-0', 'credito', 1990, now() + interval '2 days');

  select plano_expira_em into v_terceira
    from public.negocios where id = '11111111-0000-4000-8000-000000000001';

  perform testes.ok('e o aviso fora de ordem mantém o vencimento maior',
    v_terceira = v_primeira);

  perform testes.ok('o ciclo da assinatura também segura, e as duas datas concordam',
    (select ciclo_termina_em from public.assinaturas
      where id = 'a5510000-0000-4000-8000-000000000001') = v_primeira);

  perform testes.ok('mas a cobrança atrasada fica registrada do mesmo jeito',
    (select count(*) from public.cobrancas
      where id_externo = 'pagamento-a-0' and status = 'paga') = 1);
end;
$$;

-- -----------------------------------------------------------------------------
-- Cancelar não tira do ar, o vencimento é que tira
-- -----------------------------------------------------------------------------

do $$
declare
  v_antes timestamptz;
  v_depois timestamptz;
begin
  select plano_expira_em into v_antes
    from public.negocios where id = '11111111-0000-4000-8000-000000000001';

  perform public.encerrar_assinatura('11111111-0000-4000-8000-000000000001');

  select plano_expira_em into v_depois
    from public.negocios where id = '11111111-0000-4000-8000-000000000001';

  perform testes.ok('encerrar a assinatura mantém o vencimento intacto',
    v_depois = v_antes);

  perform testes.ok('quem cancelou hoje continua pago até o fim do ciclo',
    public.plano_de('11111111-0000-4000-8000-000000000001') = 'pago');

  perform testes.ok('e a assinatura fica encerrada, com a data do cancelamento',
    (select status = 'encerrada' and cancelada_em is not null
       from public.assinaturas
      where id = 'a5510000-0000-4000-8000-000000000001'));
end;
$$;

-- -----------------------------------------------------------------------------
-- Cartão recusado ganha carência
-- -----------------------------------------------------------------------------
-- Tirar a página do ar na tarde em que o cartão falhou é o pior momento
-- possível, e quase sempre o cliente resolve em um ou dois dias.

do $$
declare
  v_depois timestamptz;
  v_a_antes timestamptz;
  v_a_depois timestamptz;
begin
  update public.negocios
     set plano = 'pago', plano_expira_em = now() + interval '1 day'
   where id = '22222222-0000-4000-8000-000000000002';

  perform public.marcar_atraso('22222222-0000-4000-8000-000000000002', 5);

  select plano_expira_em into v_depois
    from public.negocios where id = '22222222-0000-4000-8000-000000000002';

  perform testes.ok('o pagamento recusado marca a assinatura como em atraso',
    (select status from public.assinaturas
      where id = 'a5510000-0000-4000-8000-000000000002') = 'em_atraso');

  perform testes.ok('e a carência empurra o vencimento, para a página seguir no ar',
    v_depois = now() + interval '5 days');

  -- Em A o vencimento já está a trinta dias daqui. A carência é piso, então
  -- ela não pode encurtar o que já estava pago.
  select plano_expira_em into v_a_antes
    from public.negocios where id = '11111111-0000-4000-8000-000000000001';

  perform public.marcar_atraso('11111111-0000-4000-8000-000000000001', 5);

  select plano_expira_em into v_a_depois
    from public.negocios where id = '11111111-0000-4000-8000-000000000001';

  perform testes.ok('a carência é piso, e não encurta o que já estava pago',
    v_a_depois = v_a_antes);

  -- A assinatura de A já tinha sido encerrada logo acima, e atraso não
  -- ressuscita assinatura encerrada.
  perform testes.ok('e o atraso não ressuscita uma assinatura já encerrada',
    (select status from public.assinaturas
      where id = 'a5510000-0000-4000-8000-000000000001') = 'encerrada');
end;
$$;

-- -----------------------------------------------------------------------------
-- Estorno, o único lugar onde a data anda para trás
-- -----------------------------------------------------------------------------

do $$
begin
  perform public.desfazer_cobranca('pagamento-b');

  perform testes.ok('o estorno marca a cobrança como devolvida',
    (select status from public.cobrancas where id_externo = 'pagamento-b')
    = 'devolvida');

  perform testes.ok('e puxa o vencimento para agora, que é o único caso disso',
    (select plano_expira_em from public.negocios
      where id = '22222222-0000-4000-8000-000000000002') <= now());

  perform testes.ok('então o negócio volta a valer como gratuito na hora',
    public.plano_de('22222222-0000-4000-8000-000000000002') = 'gratuito');

  perform testes.ok('e o estorno de um negócio deixa o outro em paz',
    public.plano_de('11111111-0000-4000-8000-000000000001') = 'pago');
end;
$$;

-- -----------------------------------------------------------------------------
-- A assinatura nasce, e o teste grátis vira plano pago sem cobrar nada
-- -----------------------------------------------------------------------------
-- Correção 011. É o caso que as quatro funções da 009 não cobriam: elas todas
-- tratam dinheiro que já entrou, e o teste de sete dias entrega o plano pago
-- justamente antes do primeiro centavo.
--
-- Roda na Quitanda da Cida, que é o terceiro negócio do cenário, porque os dois
-- primeiros já têm assinatura viva e o índice assinaturas_viva_idx é
-- exatamente o que impede a segunda.

reset role;

do $$
declare
  v_teste timestamptz := now() + interval '7 days';
  v_ciclo timestamptz := now() + interval '37 days';
  v_id uuid;
  v_de_novo uuid;
begin
  v_id := public.abrir_assinatura(
    '33333333-0000-4000-8000-000000000003', 'preapproval-c',
    'mensal', 'credito', 1990, v_teste, null);

  perform testes.ok('o teste grátis põe o negócio no plano pago',
    public.plano_de('33333333-0000-4000-8000-000000000003') = 'pago');

  perform testes.ok('e o vencimento é o fim do teste, sem cobrança nenhuma',
    (select plano_expira_em from public.negocios
      where id = '33333333-0000-4000-8000-000000000003') = v_teste
    and (select count(*) from public.cobrancas
      where negocio_id = '33333333-0000-4000-8000-000000000003') = 0);

  perform testes.ok('a assinatura fica em teste enquanto o dinheiro não entra',
    (select status = 'teste' and teste_termina_em = v_teste
       from public.assinaturas where id = v_id));

  -- O Mercado Pago reenvia o aviso do preapproval quando a resposta demora.
  v_de_novo := public.abrir_assinatura(
    '33333333-0000-4000-8000-000000000003', 'preapproval-c',
    'mensal', 'credito', 1990, v_teste, null);

  perform testes.ok('o mesmo preapproval entregue duas vezes é uma linha só',
    v_de_novo = v_id
    and (select count(*) from public.assinaturas
      where negocio_id = '33333333-0000-4000-8000-000000000003') = 1);

  -- Oitavo dia: a primeira cobrança entrou, e a mesma função agora recebe a
  -- data do ciclo. É o caminho normal do crédito, e não um caso de exceção.
  perform public.abrir_assinatura(
    '33333333-0000-4000-8000-000000000003', 'preapproval-c',
    'mensal', 'credito', 1990, v_teste, v_ciclo);

  perform testes.ok('a primeira cobrança tira a assinatura do teste',
    (select status from public.assinaturas where id = v_id) = 'ativa');

  perform testes.ok('e o vencimento anda para o fim do ciclo pago',
    (select plano_expira_em from public.negocios
      where id = '33333333-0000-4000-8000-000000000003') = v_ciclo);

  -- Mesma regra do resto do arquivo: aviso fora de ordem nunca encurta.
  perform public.abrir_assinatura(
    '33333333-0000-4000-8000-000000000003', 'preapproval-c',
    'mensal', 'credito', 1990, v_teste, now() + interval '2 days');

  perform testes.ok('o aviso atrasado da assinatura mantém o vencimento maior',
    (select plano_expira_em from public.negocios
      where id = '33333333-0000-4000-8000-000000000003') = v_ciclo);
end;
$$;

-- A trava que impede cobrar duas vezes a mesma pessoa.
--
-- A tela de checkout gera a chave de idempotência por tentativa e não tem onde
-- gravá-la antes, então duas tentativas viram dois preapproval diferentes no
-- Mercado Pago. Quem recusa o segundo é este índice, e o webhook lê o 23505
-- para cancelar a duplicata lá em vez de reentregar para sempre.
select testes.barrado('segundo preapproval no mesmo negócio é recusado', $q$
  select public.abrir_assinatura(
    '33333333-0000-4000-8000-000000000003', 'preapproval-c-duplicado',
    'mensal', 'credito', 1990, now() + interval '7 days', null)
$q$, 'assinaturas_viva_idx');

-- Cancelar e receber um aviso atrasado é o caminho que devolveria plano pago a
-- quem já saiu, e é por isso que a função sai cedo quando a linha está
-- encerrada.
do $$
declare
  v_antes timestamptz;
begin
  perform public.encerrar_assinatura('33333333-0000-4000-8000-000000000003');

  update public.negocios set plano_expira_em = now() - interval '1 day'
   where id = '33333333-0000-4000-8000-000000000003';

  select plano_expira_em into v_antes
    from public.negocios where id = '33333333-0000-4000-8000-000000000003';

  perform public.abrir_assinatura(
    '33333333-0000-4000-8000-000000000003', 'preapproval-c',
    'mensal', 'credito', 1990, now() + interval '7 days', null);

  perform testes.ok('aviso atrasado NÃO ressuscita assinatura já encerrada',
    (select status from public.assinaturas
      where id_externo = 'preapproval-c') = 'encerrada');

  perform testes.ok('e quem cancelou continua no gratuito depois do vencimento',
    (select plano_expira_em from public.negocios
      where id = '33333333-0000-4000-8000-000000000003') = v_antes
    and public.plano_de('33333333-0000-4000-8000-000000000003') = 'gratuito');
end;
$$;

select testes.ok('abrir_assinatura fica fora do alcance do visitante',
  not has_function_privilege('anon',
    'public.abrir_assinatura(uuid, text, text, text, integer, timestamptz, timestamptz)',
    'EXECUTE'));

select testes.ok('e fora do alcance de quem está logado, que assinaria de graça',
  not has_function_privilege('authenticated',
    'public.abrir_assinatura(uuid, text, text, text, integer, timestamptz, timestamptz)',
    'EXECUTE'));

select testes.ok('a chave de serviço alcança, que é quem recebe o webhook',
  has_function_privilege('service_role',
    'public.abrir_assinatura(uuid, text, text, text, integer, timestamptz, timestamptz)',
    'EXECUTE'));

-- -----------------------------------------------------------------------------
-- Os números do painel herdam a RLS de eventos
-- -----------------------------------------------------------------------------
-- security invoker de propósito: a regra de quem vê o quê já mora na política
-- de eventos, e repetir aqui seria criar um segundo lugar para ela envelhecer.

select testes.ok('a chave de serviço enxerga o evento de B, que existe mesmo',
  (select count(*) from public.numeros_do_negocio(
    '22222222-0000-4000-8000-000000000002', 7)) = 1);

select testes.como('aaaaaaaa-0000-4000-8000-000000000001');

select testes.ok('o dono soma os próprios números',
  (select coalesce(sum(total), 0) from public.numeros_do_negocio(
    '11111111-0000-4000-8000-000000000001', 7)) = 2);

select testes.ok('e o número de outro negócio vem vazio, sem a função repetir a regra',
  (select count(*) from public.numeros_do_negocio(
    '22222222-0000-4000-8000-000000000002', 7)) = 0);

-- -----------------------------------------------------------------------------
-- Os ícones de link que o código já declarava
-- -----------------------------------------------------------------------------
-- IconeLink em lib/tipos.ts tem nove valores, e a constraint tinha cinco. A
-- correção 006 igualou os dois. Quem manda no conjunto é o código, e a
-- constraint está aqui só para barrar lixo.

reset role;

insert into public.links (negocio_id, rotulo, url, icone)
values ('33333333-0000-4000-8000-000000000003', 'Agenda',
        'https://exemplo.com/agenda', 'agenda');

select testes.ok('o ícone de agenda, que o código já declarava, entra na tabela',
  (select icone from public.links
    where negocio_id = '33333333-0000-4000-8000-000000000003') = 'agenda');

select testes.barrado('e um ícone que o código não conhece continua barrado', $q$
  insert into public.links (negocio_id, rotulo, url, icone)
  values ('33333333-0000-4000-8000-000000000003', 'Lixo',
          'https://exemplo.com/lixo', 'foguete')
$q$);

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

-- =============================================================================
-- Migrar rascunho, da correção 007
-- =============================================================================
-- Quando a conta do Google já existe aqui, o manual linking recusa, e o
-- rascunho ficaria preso na conta provisória. migrar_rascunho move a página
-- para a conta que já existe.
--
-- Ela escreve dono_id, que é campo que o protege_cobranca devolve ao valor
-- anterior para todo mundo que não seja o serviço. Ou seja: é uma porta lateral
-- na proteção que impede alguém de apontar a página dos outros para si, e por
-- isso cada guarda dela tem teste, e o teste diz qual guarda espera.
--
-- A ordem importa. Os dois casos que têm que ser recusados vêm antes do que dá
-- certo, porque depois da migração o destino fica com a vaga do plano ocupada, e
-- aí os dois passariam verde pelo motivo errado.

reset role;
insert into auth.users (id, email, is_anonymous, created_at) values
  ('a1a1a1a1-0000-4000-8000-000000000011', null, true, now()),
  ('a2a2a2a2-0000-4000-8000-000000000012', 'ja-tem@exemplo.com', false, now()),
  ('a3a3a3a3-0000-4000-8000-000000000013', 'cheia@exemplo.com', false, now()),
  ('a4a4a4a4-0000-4000-8000-000000000014', null, true, now()),
  ('a5a5a5a5-0000-4000-8000-000000000015', null, true, now());

insert into public.negocios (id, dono_id, slug, nome, publicado) values
  ('a1000000-0000-4000-8000-000000000011',
   'a1a1a1a1-0000-4000-8000-000000000011', 'rascunho-da-ana', 'Ana', false),
  ('a3000000-0000-4000-8000-000000000013',
   'a3a3a3a3-0000-4000-8000-000000000013', 'pagina-cheia', 'Cheia', true),
  ('a4000000-0000-4000-8000-000000000014',
   'a4a4a4a4-0000-4000-8000-000000000014', 'rascunho-do-bento', 'Bento', false),
  ('a5000000-0000-4000-8000-000000000015',
   'a5a5a5a5-0000-4000-8000-000000000015', 'ja-no-ar', 'No Ar', true);

select testes.barrado('página no ar NÃO troca de dono pela migração', $q$
  select public.migrar_rascunho(
    'a5000000-0000-4000-8000-000000000015',
    'a5a5a5a5-0000-4000-8000-000000000015',
    'a2a2a2a2-0000-4000-8000-000000000012')
$q$, 'já está no ar');

select testes.barrado('conta de origem que NÃO é provisória é recusada', $q$
  select public.migrar_rascunho(
    'a3000000-0000-4000-8000-000000000013',
    'a3a3a3a3-0000-4000-8000-000000000013',
    'a2a2a2a2-0000-4000-8000-000000000012')
$q$, 'provisória');

-- O dono informado precisa bater com o gravado, senão a função viraria um jeito
-- de mover a página de qualquer conta provisória dizendo que ela é sua.
select testes.barrado('dono informado que NÃO bate com o gravado é recusado', $q$
  select public.migrar_rascunho(
    'a1000000-0000-4000-8000-000000000011',
    'a4a4a4a4-0000-4000-8000-000000000014',
    'a2a2a2a2-0000-4000-8000-000000000012')
$q$, 'outra conta');

select public.migrar_rascunho(
  'a1000000-0000-4000-8000-000000000011',
  'a1a1a1a1-0000-4000-8000-000000000011',
  'a2a2a2a2-0000-4000-8000-000000000012');

select testes.ok('rascunho de conta provisória vai para a conta que já existe',
  (select dono_id from public.negocios
    where id = 'a1000000-0000-4000-8000-000000000011')
  = 'a2a2a2a2-0000-4000-8000-000000000012');

select testes.ok('e continua rascunho, porque migrar não publica',
  (select publicado from public.negocios
    where id = 'a1000000-0000-4000-8000-000000000011') = false);

-- O limite do plano vale na migração, senão ela seria a porta lateral para
-- passar de uma página no gratuito. O gatilho de limite é BEFORE INSERT e não
-- pega update, então a conta é refeita dentro da função.
select testes.barrado('destino sem vaga no plano é recusado', $q$
  select public.migrar_rascunho(
    'a4000000-0000-4000-8000-000000000014',
    'a4a4a4a4-0000-4000-8000-000000000014',
    'a3a3a3a3-0000-4000-8000-000000000013')
$q$, 'limite');

select testes.ok('migrar_rascunho fica fora do alcance do visitante',
  not has_function_privilege('anon', 'public.migrar_rascunho(uuid, uuid, uuid)', 'EXECUTE'));

select testes.ok('migrar_rascunho fica fora do alcance de quem está logado',
  not has_function_privilege('authenticated', 'public.migrar_rascunho(uuid, uuid, uuid)', 'EXECUTE'));

-- -----------------------------------------------------------------------------
-- O resultado
-- -----------------------------------------------------------------------------
-- Última consulta do arquivo de propósito: é a que o SQL Editor mostra. Chegar
-- aqui já significa que nenhuma asserção falhou, porque falha levanta exceção e
-- exceção aborta antes. A contagem sai do diário, então ela conta o que rodou
-- de verdade em vez de repetir um número escrito no LEIA-ME.

reset role;

select resultado, asserção, motivo
from (
  select 0 as ordem,
         'TODOS OS TESTES PASSARAM' as resultado,
         count(*)::text || ' asserções' as asserção,
         null::text as motivo
    from testes.registro
  union all
  select numero, 'ok', numero::text || '. ' || nome, motivo
    from testes.registro
) as linhas
order by ordem;

rollback;
