-- =============================================================================
-- Entrais, schema inicial
-- =============================================================================
-- Rodar uma vez, no SQL Editor do Supabase, no projeto vazio.
--
-- Princípios que estão embutidos aqui:
--
-- 1. O painel escreve direto no banco pelo navegador, com a chave pública.
--    Então limite de plano, formato de campo e permissão são conferidos AQUI.
--    Nada que valha dinheiro ou segurança pode morar só no código da tela.
-- 2. RLS ligada em todas as tabelas desde o primeiro dia. Cada dono só enxerga
--    e edita o que é dele. Visitante anônimo só lê negócio publicado e ativo.
-- 3. Dia sem horário cadastrado significa fechado. Não existe campo "fechado",
--    porque com vários intervalos por dia ele viraria contradição.
-- 4. A tabela de eventos não guarda IP, cookie nem nada pessoal.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Endereços reservados
-- -----------------------------------------------------------------------------
-- Slugs que o produto usa, ou pode vir a usar, e que ninguém pode registrar.

create table public.slugs_reservados (
  slug text primary key
);

insert into public.slugs_reservados (slug) values
  ('painel'), ('api'), ('login'), ('entrar'), ('sair'), ('cadastro'),
  ('admin'), ('conta'), ('assinatura'), ('cobranca'), ('suporte'),
  ('ajuda'), ('sobre'), ('precos'), ('termos'), ('privacidade'),
  ('denunciar'), ('contato'), ('blog'), ('demo'), ('exemplo'),
  ('entrais'), ('app'), ('www'), ('static'), ('assets'), ('public'),
  ('_next'), ('favicon'), ('robots'), ('sitemap'), ('opengraph-image');

-- -----------------------------------------------------------------------------
-- Palavras que fazem o endereço parecer oficial.
--
-- Diferente da lista de cima: aqui a conferência é por pedaço separado por
-- hífen, então "pix" barra também "pix-caixa" e "central-pix". Um endereço
-- nosso com cara de banco circula sozinho no WhatsApp, e é golpe barato.
--
-- Espelha PEDACOS_BLOQUEADOS em lib/slug.ts. Ficar em tabela, e não dentro da
-- função, é o que permite acrescentar palavra sem recriar gatilho quando
-- aparecer golpe novo.

create table public.pedacos_bloqueados (
  pedaco text primary key
);

insert into public.pedacos_bloqueados (pedaco) values
  ('pix'), ('banco'), ('bacen'), ('boleto'), ('pagamento'), ('pagamentos'),
  ('pagar'), ('cobranca'), ('fatura'), ('cartao'), ('credito'),
  ('emprestimo'), ('financeira'), ('investimento'), ('receita'), ('gov'),
  ('seguranca'), ('verificado'), ('verificacao'), ('oficial'),
  ('atendimento'), ('central'), ('reembolso'), ('estorno'), ('premio'),
  ('sorteio'), ('ganhou'), ('senha'), ('token'), ('cpf'), ('desbloqueio'),
  ('recadastramento'), ('atualizacao'), ('confirmar'), ('validar'),
  ('entrais');

-- -----------------------------------------------------------------------------
-- 2. Negócios
-- -----------------------------------------------------------------------------

create table public.negocios (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references auth.users (id) on delete cascade,

  -- Endereço público. slug_anterior mantém o link antigo funcionando quando
  -- o dono troca de endereço, porque link quebrado é o problema que a gente
  -- veio resolver.
  slug text not null unique,
  slug_anterior text unique,

  nome text not null,
  frase text,
  logo_url text,
  capa_url text,

  tema text not null default 'areia',
  -- Combinacao de letras. Trocar e recurso do plano pago, conferido no gatilho
  -- protege_cobranca mais abaixo.
  fonte text not null default 'moderno',
  plano text not null default 'gratuito',
  -- Vencimento do plano pago. Enquanto a cobrança é manual, é este campo que
  -- se preenche na mão depois de receber o Pix.
  plano_expira_em timestamptz,
  -- Chave de emergência para tirar do ar página abusiva sem apagar nada.
  status text not null default 'ativo',
  publicado boolean not null default false,

  -- Só dígitos, com país e DDD: 5511999999999
  whatsapp text,
  mensagem_padrao text,
  -- Modelo aplicado a todos os itens do catálogo. O {item} vira o título.
  mensagem_item text,
  telefone text,

  endereco text,
  cidade text,
  estado text,
  cep text,
  maps_url text,

  fuso text not null default 'America/Sao_Paulo',
  mostrar_precos boolean not null default true,
  -- Nem todo negocio tem cardapio: estudio tem aulas, psicologa tem
  -- atendimentos, loja tem catalogo. Quem escolhe o nome e o dono.
  titulo_catalogo text not null default 'Catálogo',

  -- Ate dois botoes no rodape fixo. Nulo na principal significa: usar o
  -- WhatsApp, se houver numero. Guardados como json porque sao um objeto
  -- pequeno e fechado, que so a pagina le inteiro.
  acao_principal jsonb,
  acao_secundaria jsonb,

  -- Aceite dos termos, guardado para valer como registro.
  aceite_termos_em timestamptz,
  aceite_termos_ip inet,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint slug_formato check (slug ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'),
  constraint slug_anterior_formato check (
    slug_anterior is null or slug_anterior ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'
  ),
  constraint slug_diferente_do_anterior check (slug is distinct from slug_anterior),
  constraint nome_preenchido check (length(btrim(nome)) between 1 and 80),
  constraint frase_tamanho check (frase is null or length(frase) <= 160),
  constraint tema_conhecido check (tema in ('areia', 'noite', 'menta')),
  constraint fonte_conhecida check (
    fonte in ('editorial', 'artesanal', 'moderno', 'marcante', 'direto')
  ),
  constraint titulo_catalogo_tamanho check (
    length(btrim(titulo_catalogo)) between 1 and 30
  ),
  constraint acao_principal_formato check (
    acao_principal is null or (
      acao_principal ->> 'tipo' in ('whatsapp', 'link', 'telefone')
      and length(coalesce(acao_principal ->> 'rotulo', '')) between 1 and 40
    )
  ),
  constraint acao_secundaria_formato check (
    acao_secundaria is null or (
      acao_secundaria ->> 'tipo' in ('whatsapp', 'link', 'telefone')
      and length(coalesce(acao_secundaria ->> 'rotulo', '')) between 1 and 40
    )
  ),
  constraint plano_conhecido check (plano in ('gratuito', 'pago')),
  constraint status_conhecido check (status in ('ativo', 'suspenso')),
  constraint whatsapp_formato check (whatsapp is null or whatsapp ~ '^[0-9]{10,15}$'),
  constraint telefone_formato check (telefone is null or telefone ~ '^[0-9]{10,15}$'),
  constraint estado_formato check (estado is null or estado ~ '^[A-Z]{2}$'),
  constraint cep_formato check (cep is null or cep ~ '^[0-9]{5}-?[0-9]{3}$'),
  constraint maps_url_formato check (maps_url is null or maps_url ~ '^https://'),
  constraint fuso_valido check (fuso in (
    'America/Sao_Paulo', 'America/Manaus', 'America/Cuiaba', 'America/Belem',
    'America/Fortaleza', 'America/Recife', 'America/Bahia', 'America/Rio_Branco',
    'America/Boa_Vista', 'America/Porto_Velho', 'America/Campo_Grande',
    'America/Maceio', 'America/Araguaina', 'America/Santarem',
    'America/Eirunepe', 'America/Noronha'
  ))
);

create index negocios_dono_idx on public.negocios (dono_id);
create index negocios_slug_anterior_idx on public.negocios (slug_anterior)
  where slug_anterior is not null;

-- -----------------------------------------------------------------------------
-- 3. Horários
-- -----------------------------------------------------------------------------
-- Vários intervalos por dia, no padrão do Google. Quando fecha é menor ou igual
-- a abre, entende-se que o turno vira a madrugada (abre 19:00, fecha 00:30).
-- Dia sem nenhuma linha é dia fechado.

create table public.horarios (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  dia_semana smallint not null,
  abre time not null,
  fecha time not null,

  constraint dia_valido check (dia_semana between 0 and 6),
  constraint intervalo_nao_vazio check (abre <> fecha)
);

create index horarios_negocio_idx on public.horarios (negocio_id, dia_semana);

-- -----------------------------------------------------------------------------
-- 4. Catálogo
-- -----------------------------------------------------------------------------

create table public.itens (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  ordem smallint not null default 0,
  titulo text not null,
  descricao text,
  -- Em centavos, para nunca usar ponto flutuante com dinheiro.
  -- Nulo significa sem preço, e a linha do preço some da página.
  preco_centavos integer,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),

  constraint titulo_preenchido check (length(btrim(titulo)) between 1 and 80),
  constraint descricao_tamanho check (descricao is null or length(descricao) <= 280),
  constraint preco_nao_negativo check (preco_centavos is null or preco_centavos >= 0),

  -- Necessário para a chave composta de itens_fotos logo abaixo.
  unique (id, negocio_id)
);

create index itens_negocio_idx on public.itens (negocio_id, ordem);

create table public.itens_fotos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  -- Repetido de propósito. Deixa a política de RLS resolver sem join, e a
  -- chave composta abaixo garante que não dá para apontar para o item de outro.
  negocio_id uuid not null,
  ordem smallint not null default 0,
  url text not null,
  alt text not null,
  largura integer,
  altura integer,

  constraint alt_preenchido check (length(btrim(alt)) between 1 and 160),
  foreign key (item_id, negocio_id)
    references public.itens (id, negocio_id) on delete cascade
);

create index itens_fotos_item_idx on public.itens_fotos (item_id, ordem);
create index itens_fotos_negocio_idx on public.itens_fotos (negocio_id);

-- -----------------------------------------------------------------------------
-- 5. Galeria
-- -----------------------------------------------------------------------------
-- Separada do catálogo, porque nem todo negócio tem coisa para vender e muita
-- vez a foto é da marca, não do produto.

create table public.fotos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  ordem smallint not null default 0,
  url text not null,
  alt text not null,
  largura integer,
  altura integer,

  constraint alt_preenchido check (length(btrim(alt)) between 1 and 160)
);

create index fotos_negocio_idx on public.fotos (negocio_id, ordem);

-- -----------------------------------------------------------------------------
-- 6. Links
-- -----------------------------------------------------------------------------

create table public.links (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  ordem smallint not null default 0,
  rotulo text not null,
  url text not null,
  icone text not null default 'link',

  constraint rotulo_preenchido check (length(btrim(rotulo)) between 1 and 40),
  constraint url_http check (url ~ '^https?://'),
  constraint icone_conhecido check (icone in ('instagram', 'mapa', 'ifood', 'site', 'link'))
);

create index links_negocio_idx on public.links (negocio_id, ordem);

-- -----------------------------------------------------------------------------
-- 7. Eventos
-- -----------------------------------------------------------------------------
-- Sem IP, sem cookie, sem identificador de pessoa. Só o que aconteceu e quando.
-- Ninguém escreve aqui direto: a página pública chama registrar_evento().

create table public.eventos (
  id bigint generated always as identity primary key,
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  tipo text not null,
  criado_em timestamptz not null default now(),

  constraint tipo_conhecido check (
    tipo in ('visita', 'clique_whatsapp', 'clique_acao')
  )
);

create index eventos_negocio_idx on public.eventos (negocio_id, criado_em desc);

-- -----------------------------------------------------------------------------
-- 8. Denúncias
-- -----------------------------------------------------------------------------
-- Quem descobre o golpe é quem caiu nele, não nós. Por isso toda página
-- pública tem um link de denúncia, como fazem as concorrentes: é o que
-- transforma a vítima em aviso antes da próxima.
--
-- Não guarda quem denunciou. Denúncia identificada afasta justamente quem
-- tem medo do denunciado, e o produto não tem para que usar o dado. O custo
-- é não dar para responder à pessoa, e é um custo aceito.
--
-- Ninguém lê esta tabela pelo navegador, nem o dono do negócio denunciado.
-- Só a chave de serviço, que é do servidor. Escrever é pela função
-- registrar_denuncia().

create table public.denuncias (
  id bigint generated always as identity primary key,
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  motivo text not null,
  detalhe text,
  criado_em timestamptz not null default now(),
  -- Vira true quando alguém já olhou, para a fila não repetir trabalho.
  analisada boolean not null default false,

  constraint motivo_conhecido check (
    motivo in ('golpe', 'nao_e_meu_negocio', 'conteudo', 'fora_do_ar', 'outro')
  ),
  constraint detalhe_tamanho check (detalhe is null or length(detalhe) <= 600)
);

create index denuncias_fila_idx on public.denuncias (criado_em desc)
  where not analisada;
create index denuncias_negocio_idx on public.denuncias (negocio_id, criado_em desc);

-- =============================================================================
-- Funções de apoio
-- =============================================================================

-- Plano que vale agora. Um plano pago vencido volta a valer como gratuito
-- sozinho, então esquecer de rebaixar na mão não vira plano pago vitalício.
create or replace function public.plano_de(p_negocio uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when plano = 'pago' and (plano_expira_em is null or plano_expira_em > now())
      then 'pago'
    else 'gratuito'
  end
  from public.negocios
  where id = p_negocio;
$$;

-- Limites por plano, num lugar só.
create or replace function public.limite_do_plano(p_plano text, p_recurso text)
returns integer
language sql
immutable
-- search_path fixo em toda função, mesmo nas que não são security definer:
-- é grátis, e evita depender de quem chamou ter deixado o caminho limpo.
set search_path = public, pg_temp
as $$
  select case when p_plano = 'pago' then
    case p_recurso
      when 'itens' then 500
      when 'fotos_por_item' then 10
      when 'galeria' then 100
      when 'links' then 30
      when 'horarios_por_dia' then 4
      when 'negocios_por_dono' then 5
      else 0
    end
  else
    case p_recurso
      when 'itens' then 20
      when 'fotos_por_item' then 3
      when 'galeria' then 12
      when 'links' then 8
      when 'horarios_por_dia' then 3
      when 'negocios_por_dono' then 1
      else 0
    end
  end;
$$;

-- Usada pelas políticas de leitura pública das tabelas filhas.
create or replace function public.negocio_publico(p_negocio uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.negocios
    where id = p_negocio and publicado and status = 'ativo'
  );
$$;

-- =============================================================================
-- Gatilhos
-- =============================================================================

create or replace function public.marca_atualizacao()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger negocios_atualizado_em
  before update on public.negocios
  for each row execute function public.marca_atualizacao();

-- Endereço reservado, endereço já usado como antigo por outro negócio, e
-- guarda automática do endereço antigo quando o dono troca de slug.
create or replace function public.checa_slug()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (select 1 from public.slugs_reservados where slug = new.slug) then
    raise exception 'endereço reservado: %', new.slug
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1 from public.pedacos_bloqueados
    where pedaco = any (string_to_array(new.slug, '-'))
  ) then
    raise exception 'endereço com palavra restrita: %', new.slug
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1 from public.negocios
    where slug_anterior = new.slug and id is distinct from new.id
  ) then
    raise exception 'endereço já usado por outro negócio: %', new.slug
      using errcode = 'unique_violation';
  end if;

  if tg_op = 'UPDATE' and new.slug is distinct from old.slug then
    new.slug_anterior := old.slug;
  end if;

  return new;
end;
$$;

create trigger negocios_checa_slug
  before insert or update on public.negocios
  for each row execute function public.checa_slug();

-- Campos que valem dinheiro não são do dono.
--
-- Não dá para resolver isso com "revoke update (coluna)": quem já tem update na
-- tabela inteira continua podendo escrever em qualquer coluna, o revoke de
-- coluna só desfaz grant de coluna. Então o gatilho ignora, em silêncio, o que
-- vier nesses campos e mantém o valor de antes. Quem manda a chave de serviço,
-- que é só do servidor, passa direto.
create or replace function public.protege_cobranca()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user in ('service_role', 'postgres') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.plano := 'gratuito';
    new.plano_expira_em := null;
    new.status := 'ativo';
    new.fonte := 'moderno';
  else
    -- Escolher a letra e do plano pago. Vale a mesma logica dos campos de
    -- cobranca: o banco devolve o valor de antes, em silencio.
    if public.plano_de(old.id) <> 'pago' then
      new.fonte := old.fonte;
    end if;
    new.plano := old.plano;
    new.plano_expira_em := old.plano_expira_em;
    new.status := old.status;
    new.dono_id := old.dono_id;
    new.criado_em := old.criado_em;
  end if;

  return new;
end;
$$;

create trigger negocios_protege_cobranca
  before insert or update on public.negocios
  for each row execute function public.protege_cobranca();

-- Um negócio por dono no plano gratuito. Como o plano vive no próprio negócio,
-- a contagem usa o plano do que o dono já tem.
create or replace function public.checa_limite_negocios()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_total integer;
  v_limite integer;
begin
  select count(*) into v_total
    from public.negocios where dono_id = new.dono_id;

  select coalesce(max(public.limite_do_plano(public.plano_de(id), 'negocios_por_dono')), 1)
    into v_limite
    from public.negocios where dono_id = new.dono_id;

  if v_total >= v_limite then
    raise exception 'limite de % página(s) por conta no plano atual', v_limite
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger negocios_limite
  before insert on public.negocios
  for each row execute function public.checa_limite_negocios();

create or replace function public.checa_limite_itens()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limite integer := public.limite_do_plano(public.plano_de(new.negocio_id), 'itens');
begin
  if (select count(*) from public.itens where negocio_id = new.negocio_id) >= v_limite then
    raise exception 'limite de % itens no plano atual', v_limite
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger itens_limite
  before insert on public.itens
  for each row execute function public.checa_limite_itens();

create or replace function public.checa_limite_fotos_item()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limite integer := public.limite_do_plano(public.plano_de(new.negocio_id), 'fotos_por_item');
begin
  if (select count(*) from public.itens_fotos where item_id = new.item_id) >= v_limite then
    raise exception 'limite de % fotos por item no plano atual', v_limite
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger itens_fotos_limite
  before insert on public.itens_fotos
  for each row execute function public.checa_limite_fotos_item();

create or replace function public.checa_limite_galeria()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limite integer := public.limite_do_plano(public.plano_de(new.negocio_id), 'galeria');
begin
  if (select count(*) from public.fotos where negocio_id = new.negocio_id) >= v_limite then
    raise exception 'limite de % fotos na galeria no plano atual', v_limite
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger fotos_limite
  before insert on public.fotos
  for each row execute function public.checa_limite_galeria();

create or replace function public.checa_limite_links()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limite integer := public.limite_do_plano(public.plano_de(new.negocio_id), 'links');
begin
  if (select count(*) from public.links where negocio_id = new.negocio_id) >= v_limite then
    raise exception 'limite de % links no plano atual', v_limite
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger links_limite
  before insert on public.links
  for each row execute function public.checa_limite_links();

create or replace function public.checa_limite_horarios()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limite integer := public.limite_do_plano(public.plano_de(new.negocio_id), 'horarios_por_dia');
begin
  if (
    select count(*) from public.horarios
    where negocio_id = new.negocio_id and dia_semana = new.dia_semana
  ) >= v_limite then
    raise exception 'limite de % intervalos por dia no plano atual', v_limite
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger horarios_limite
  before insert on public.horarios
  for each row execute function public.checa_limite_horarios();

-- =============================================================================
-- Registro de eventos
-- =============================================================================
-- A página pública nunca escreve na tabela. Ela chama esta função, que só
-- aceita negócio publicado e ativo e só os dois tipos previstos. Assim o
-- visitante não consegue inflar o número de outro negócio nem inventar tipo.

create or replace function public.registrar_evento(p_slug text, p_tipo text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if p_tipo not in ('visita', 'clique_whatsapp', 'clique_acao') then
    raise exception 'tipo de evento inválido' using errcode = 'check_violation';
  end if;

  select id into v_id
    from public.negocios
    where slug = p_slug and publicado and status = 'ativo';

  if v_id is null then
    return;
  end if;

  insert into public.eventos (negocio_id, tipo) values (v_id, p_tipo);
end;
$$;

-- Denúncia de página. Recebe o slug, e não o id, porque quem denuncia só tem
-- o endereço que abriu.
--
-- O teto por dia existe porque a tabela aceita escrita de qualquer visitante,
-- que é o preço de não exigir login para denunciar. Sem teto, uma pessoa
-- irritada enche a fila e as denúncias de verdade somem no meio. Vinte por
-- página por dia é muito mais do que qualquer caso real precisa, e continua
-- sendo um teto.
--
-- Devolve void de propósito: dizer "esse endereço não existe" transformaria a
-- denúncia num jeito de descobrir quais páginas existem.
create or replace function public.registrar_denuncia(
  p_slug text,
  p_motivo text,
  p_detalhe text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if p_motivo not in ('golpe', 'nao_e_meu_negocio', 'conteudo', 'fora_do_ar', 'outro') then
    raise exception 'motivo inválido' using errcode = 'check_violation';
  end if;

  select id into v_id from public.negocios where slug = p_slug;
  if v_id is null then
    return;
  end if;

  if (
    select count(*) from public.denuncias
    where negocio_id = v_id and criado_em > now() - interval '1 day'
  ) >= 20 then
    return;
  end if;

  insert into public.denuncias (negocio_id, motivo, detalhe)
  values (v_id, p_motivo, left(btrim(p_detalhe), 600));
end;
$$;

-- Retenção. Rodar de tempos em tempos, com pg_cron, quando a tabela crescer.
create or replace function public.limpar_eventos_antigos()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_apagados integer;
begin
  delete from public.eventos where criado_em < now() - interval '400 days';
  get diagnostics v_apagados = row_count;
  return v_apagados;
end;
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
-- Ligada em tudo. Sem política, ninguém lê nem escreve.

alter table public.negocios        enable row level security;
alter table public.horarios        enable row level security;
alter table public.itens           enable row level security;
alter table public.itens_fotos     enable row level security;
alter table public.fotos           enable row level security;
alter table public.links           enable row level security;
alter table public.eventos         enable row level security;
alter table public.slugs_reservados enable row level security;
alter table public.pedacos_bloqueados enable row level security;
alter table public.denuncias       enable row level security;

-- Negócios ------------------------------------------------------------------

-- Qualquer um lê negócio publicado e ativo. É a página pública.
create policy negocios_leitura_publica on public.negocios
  for select to anon, authenticated
  using (publicado and status = 'ativo');

-- O dono lê o que é dele mesmo sem publicar. É isso que permite pré-visualizar
-- a página antes de colocar no ar.
create policy negocios_leitura_dono on public.negocios
  for select to authenticated
  using (auth.uid() = dono_id);

create policy negocios_insere_dono on public.negocios
  for insert to authenticated
  with check (auth.uid() = dono_id);

create policy negocios_edita_dono on public.negocios
  for update to authenticated
  using (auth.uid() = dono_id)
  with check (auth.uid() = dono_id);

create policy negocios_apaga_dono on public.negocios
  for delete to authenticated
  using (auth.uid() = dono_id);

-- Tabelas filhas -------------------------------------------------------------
-- Mesmo desenho nas cinco: leitura pública se o negócio está no ar, e o dono
-- manda no que é dele.

create policy horarios_leitura_publica on public.horarios
  for select to anon, authenticated
  using (public.negocio_publico(negocio_id));

create policy horarios_dono on public.horarios
  for all to authenticated
  using (exists (select 1 from public.negocios n
                 where n.id = negocio_id and n.dono_id = auth.uid()))
  with check (exists (select 1 from public.negocios n
                      where n.id = negocio_id and n.dono_id = auth.uid()));

create policy itens_leitura_publica on public.itens
  for select to anon, authenticated
  using (public.negocio_publico(negocio_id));

create policy itens_dono on public.itens
  for all to authenticated
  using (exists (select 1 from public.negocios n
                 where n.id = negocio_id and n.dono_id = auth.uid()))
  with check (exists (select 1 from public.negocios n
                      where n.id = negocio_id and n.dono_id = auth.uid()));

create policy itens_fotos_leitura_publica on public.itens_fotos
  for select to anon, authenticated
  using (public.negocio_publico(negocio_id));

create policy itens_fotos_dono on public.itens_fotos
  for all to authenticated
  using (exists (select 1 from public.negocios n
                 where n.id = negocio_id and n.dono_id = auth.uid()))
  with check (exists (select 1 from public.negocios n
                      where n.id = negocio_id and n.dono_id = auth.uid()));

create policy fotos_leitura_publica on public.fotos
  for select to anon, authenticated
  using (public.negocio_publico(negocio_id));

create policy fotos_dono on public.fotos
  for all to authenticated
  using (exists (select 1 from public.negocios n
                 where n.id = negocio_id and n.dono_id = auth.uid()))
  with check (exists (select 1 from public.negocios n
                      where n.id = negocio_id and n.dono_id = auth.uid()));

create policy links_leitura_publica on public.links
  for select to anon, authenticated
  using (public.negocio_publico(negocio_id));

create policy links_dono on public.links
  for all to authenticated
  using (exists (select 1 from public.negocios n
                 where n.id = negocio_id and n.dono_id = auth.uid()))
  with check (exists (select 1 from public.negocios n
                      where n.id = negocio_id and n.dono_id = auth.uid()));

-- Eventos --------------------------------------------------------------------
-- Só o dono lê, e ninguém escreve direto. Escrita é pela função.

create policy eventos_leitura_dono on public.eventos
  for select to authenticated
  using (exists (select 1 from public.negocios n
                 where n.id = negocio_id and n.dono_id = auth.uid()));

-- Endereços reservados -------------------------------------------------------
-- Leitura liberada para a tela de cadastro dizer na hora que o endereço não
-- está disponível. Escrita, ninguém.

create policy slugs_reservados_leitura on public.slugs_reservados
  for select to anon, authenticated
  using (true);

-- Palavras restritas ---------------------------------------------------------
-- Mesma coisa: a tela de cadastro precisa ler para avisar antes de enviar.
-- Esconder a lista não protegeria nada, porque o gatilho recusa de qualquer
-- jeito, e só faria a pessoa descobrir o motivo depois de tentar.

create policy pedacos_bloqueados_leitura on public.pedacos_bloqueados
  for select to anon, authenticated
  using (true);

-- Denúncias -------------------------------------------------------------------
-- Nenhuma política, de propósito: com RLS ligada e sem política, ninguém lê
-- nem escreve pelo navegador. Escrever é só pela função registrar_denuncia,
-- e ler é só pela chave de serviço, que não passa por RLS.

-- =============================================================================
-- Permissões
-- =============================================================================

grant usage on schema public to anon, authenticated;

grant select on public.negocios, public.horarios, public.itens,
  public.itens_fotos, public.fotos, public.links, public.slugs_reservados,
  public.pedacos_bloqueados
  to anon, authenticated;

grant insert, update, delete on public.negocios, public.horarios, public.itens,
  public.itens_fotos, public.fotos, public.links
  to authenticated;

grant select on public.eventos to authenticated;

-- Ninguém escreve em eventos direto, nem o dono. Só a função.
revoke insert, update, delete on public.eventos from anon, authenticated;

-- Ninguém escreve em denúncias direto. Só a função, que tem teto por dia.
revoke all on public.denuncias from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Funções internas não ficam expostas
-- -----------------------------------------------------------------------------
-- Revogar de anon e de authenticated NÃO basta, e essa é a pegadinha.
--
-- O Postgres dá EXECUTE a PUBLIC em toda função nova, e anon herda por ali.
-- Numa ACL isso aparece como "=X/postgres": grantee vazio quer dizer PUBLIC.
-- Então `revoke ... from anon` tira o direito nominal e deixa o herdado de pé,
-- e a função continua chamável em /rest/v1/rpc/nome_da_funcao por qualquer
-- pessoa que tenha a chave pública, que é pública por definição.
--
-- O que isso deixava aberto: limpar_eventos_antigos() apaga todo evento com
-- mais de 400 dias, e é security definer, então roda como dono do banco.
--
-- Tira de PUBLIC primeiro, devolve nominalmente depois.
revoke execute on all functions in schema public from public;

-- E para as próximas, senão a próxima função criada nasce aberta de novo.
alter default privileges in schema public revoke execute on functions from public;

/*
 * O que precisa voltar, e por quê:
 *
 * registrar_evento e registrar_denuncia são chamadas pela página pública, por
 * visitante sem login. São a razão de existirem.
 *
 * negocio_publico aparece dentro de cinco políticas de RLS. Expressão de
 * política roda com o privilégio de quem consulta, então sem EXECUTE o
 * visitante deixa de enxergar catálogo, foto, horário e link.
 *
 * plano_de precisa voltar para authenticated, e só para ele. Quem chama é o
 * gatilho protege_cobranca, que é security INVOKER de propósito: ele decide
 * pelo current_user se quem está escrevendo é a chave de serviço. Virar
 * definer resolveria a permissão e arrebentaria a proteção, porque aí
 * current_user seria sempre o dono do banco e todo mundo passaria direto.
 * O que vaza com isso é saber se um negócio é pago, para quem já tem o uuid
 * dele. Troca aceitável.
 *
 * limite_do_plano fica de fora: só é chamada de dentro das checa_limite_*,
 * que são definer e rodam como dono.
 */
grant execute on function public.registrar_evento(text, text) to anon, authenticated;
grant execute on function public.registrar_denuncia(text, text, text)
  to anon, authenticated;
grant execute on function public.negocio_publico(uuid) to anon, authenticated;
grant execute on function public.plano_de(uuid) to authenticated;

-- A chave de serviço continua podendo tudo: é ela que roda manutenção.
grant execute on all functions in schema public to service_role;
