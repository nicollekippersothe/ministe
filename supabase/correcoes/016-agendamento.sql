-- =============================================================================
-- Correção 016: agendamento
-- =============================================================================
-- Rodar no SQL Editor. Não precisa da senha do banco.
--
-- O que entra
-- -----------
-- A cliente escolhe um serviço e um horário na página pública, e a reserva
-- nasce confirmada na hora. Decidido com a dona: agendamento é do plano pago,
-- confirma na hora (sem a dona aprovar), e sem sinal na v1.
--
-- Quatro tabelas: `servicos` e `disponibilidade` são a configuração que a dona
-- monta, `bloqueios` são as folgas, e `agendamentos` são as reservas.
--
-- Onde mora cada guarda
-- ---------------------
-- 1. A conta de horário livre (janela menos ocupado, no fuso) é do lado do
--    site, em `lib/agenda.ts`, e a segunda conferência é o `encaixa` de lá.
-- 2. A trava definitiva contra horário dobrado é o índice de exclusão daqui:
--    duas reservas confirmadas do mesmo negócio não podem se sobrepor, e o
--    banco recusa a segunda mesmo em corrida de dois toques no mesmo minuto.
-- 3. A escrita da reserva é só pela função `criar_agendamento`, aberta a quem
--    não tem login, com teto por contato e por dia, no molde de
--    `registrar_denuncia`.
--
-- Os dados da cliente (nome e contato) ficam na tabela e só o dono lê, pela
-- mesma RLS de `eventos`. Quem consulta os horários livres pela página pública
-- recebe só os intervalos ocupados, sem nome nem contato, por
-- `ocupacao_do_negocio`.
-- =============================================================================

begin;

-- Preciso do btree_gist para o índice de exclusão casar a igualdade do
-- negócio_id com a sobreposição do intervalo de tempo no mesmo índice gist.
create extension if not exists btree_gist;

-- -----------------------------------------------------------------------------
-- Serviços
-- -----------------------------------------------------------------------------
create table public.servicos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  ordem smallint not null default 0,
  nome text not null,
  duracao_min integer not null,
  -- Em centavos, como o resto do dinheiro. Nulo é sem preço, e a linha do preço
  -- some da tela, nunca vira zero.
  preco_centavos integer,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),

  constraint servico_nome check (length(btrim(nome)) between 1 and 80),
  constraint servico_duracao check (duracao_min between 5 and 600),
  constraint servico_preco check (preco_centavos is null or preco_centavos >= 0)
);

create index servicos_negocio_idx on public.servicos (negocio_id, ordem);

-- -----------------------------------------------------------------------------
-- Disponibilidade: as janelas semanais em que aceita agendamento
-- -----------------------------------------------------------------------------
-- Separada de `horarios` de propósito: horários é o "aberto agora" da vitrine,
-- e disponibilidade é quando a agenda aceita reserva. Aqui `fecha` é sempre
-- depois de `abre`, porque agendamento que vira a meia-noite fica fora da v1.
create table public.disponibilidade (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  dia_semana smallint not null,
  abre time not null,
  fecha time not null,

  constraint disp_dia_valido check (dia_semana between 0 and 6),
  constraint disp_ordem check (fecha > abre)
);

create index disponibilidade_negocio_idx
  on public.disponibilidade (negocio_id, dia_semana);

-- -----------------------------------------------------------------------------
-- Bloqueios: folgas e feriados pontuais
-- -----------------------------------------------------------------------------
create table public.bloqueios (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  inicio timestamptz not null,
  fim timestamptz not null,
  criado_em timestamptz not null default now(),

  constraint bloqueio_ordem check (fim > inicio)
);

create index bloqueios_negocio_idx on public.bloqueios (negocio_id, inicio);

-- -----------------------------------------------------------------------------
-- Agendamentos: as reservas
-- -----------------------------------------------------------------------------
-- Nasce 'confirmado', porque a decisão foi confirmar na hora. Cancelar libera o
-- horário de novo, porque o índice de exclusão só olha o que está confirmado.
-- O serviço apagado vira nulo em vez de levar a reserva junto: a agenda antiga
-- continua legível, e a coluna nula a tela lê como "serviço removido".
create table public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  servico_id uuid references public.servicos (id) on delete set null,
  cliente_nome text not null,
  cliente_contato text not null,
  inicio timestamptz not null,
  fim timestamptz not null,
  situacao text not null default 'confirmado',
  criado_em timestamptz not null default now(),

  constraint ag_nome check (length(btrim(cliente_nome)) between 1 and 80),
  constraint ag_contato check (length(btrim(cliente_contato)) between 1 and 40),
  constraint ag_ordem check (fim > inicio),
  constraint ag_situacao check (
    situacao in ('confirmado', 'cancelado', 'concluido')
  ),

  -- A trava definitiva: duas reservas confirmadas do mesmo negócio não podem
  -- ocupar o mesmo tempo. É o que segura o toque duplo e a corrida de duas
  -- requisições, que nenhuma conferência de tela pega sozinha.
  constraint agendamentos_sem_sobreposicao exclude using gist (
    negocio_id with =,
    tstzrange(inicio, fim) with &&
  ) where (situacao = 'confirmado')
);

create index agendamentos_negocio_idx
  on public.agendamentos (negocio_id, inicio);
create index agendamentos_contato_idx
  on public.agendamentos (negocio_id, cliente_contato, criado_em desc);

-- =============================================================================
-- Funções
-- =============================================================================

-- Os intervalos ocupados de um negócio numa janela de tempo, para a página
-- pública montar os horários livres sem enxergar quem reservou.
--
-- security definer para atravessar a RLS de `agendamentos`, e devolve só início
-- e fim: nome e contato da cliente ficam de fora. Junta reserva confirmada e
-- bloqueio na mesma resposta, porque para a conta de horário livre os dois
-- ocupam igual. Só responde para negócio pago, publicado e ativo, então a
-- página gratuita não oferece agendamento.
create or replace function public.ocupacao_do_negocio(
  p_slug text,
  p_desde timestamptz,
  p_ate timestamptz
)
returns table (inicio timestamptz, fim timestamptz)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  select id into v_id
    from public.negocios
    where slug = p_slug and publicado and status = 'ativo';

  if v_id is null or public.plano_de(v_id) <> 'pago' then
    return;
  end if;

  return query
    select a.inicio, a.fim
      from public.agendamentos a
      where a.negocio_id = v_id
        and a.situacao = 'confirmado'
        and a.inicio < p_ate and a.fim > p_desde
    union all
    select b.inicio, b.fim
      from public.bloqueios b
      where b.negocio_id = v_id
        and b.inicio < p_ate and b.fim > p_desde;
end;
$$;

-- Cria uma reserva, aberta a quem não tem login. Recebe o slug, e não o id,
-- porque quem agenda só tem o endereço que abriu.
--
-- Devolve um texto de desfecho para a tela dizer o que aconteceu, ao contrário
-- da denúncia, que é void: agendar precisa saber se o horário foi mesmo pego.
-- Os desfechos: 'confirmado', 'ocupado' (o horário saiu no meio), 'passado',
-- 'muitos' (bateu o teto), e 'indisponivel' (negócio sem agendamento) ou
-- 'invalido' (serviço que não serve).
--
-- O teto por contato e por dia existe pelo mesmo motivo da denúncia: a tabela
-- aceita escrita de qualquer visitante, e sem teto alguém entope a agenda de
-- graça. A dona ainda cancela com um toque, o que devolve o horário.
--
-- A janela de funcionamento é conferida do lado do site, em `lib/agenda.ts`. O
-- banco garante o que só ele garante: não sobrepor, não marcar no passado, e
-- não furar um bloqueio.
create or replace function public.criar_agendamento(
  p_slug text,
  p_servico_id uuid,
  p_cliente_nome text,
  p_cliente_contato text,
  p_inicio timestamptz
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_dur integer;
  v_fim timestamptz;
  v_nome text := btrim(p_cliente_nome);
  v_contato text := btrim(p_cliente_contato);
begin
  if length(v_nome) = 0 or length(v_contato) = 0 then
    return 'invalido';
  end if;

  select id into v_id
    from public.negocios
    where slug = p_slug and publicado and status = 'ativo';

  if v_id is null or public.plano_de(v_id) <> 'pago' then
    return 'indisponivel';
  end if;

  select duracao_min into v_dur
    from public.servicos
    where id = p_servico_id and negocio_id = v_id and ativo;

  if v_dur is null then
    return 'invalido';
  end if;

  if p_inicio <= now() then
    return 'passado';
  end if;

  v_fim := p_inicio + make_interval(mins => v_dur);

  if (
    select count(*) from public.agendamentos
    where negocio_id = v_id
      and cliente_contato = v_contato
      and situacao = 'confirmado'
      and criado_em > now() - interval '1 day'
  ) >= 5 then
    return 'muitos';
  end if;

  if exists (
    select 1 from public.bloqueios
    where negocio_id = v_id and inicio < v_fim and fim > p_inicio
  ) then
    return 'ocupado';
  end if;

  begin
    insert into public.agendamentos
      (negocio_id, servico_id, cliente_nome, cliente_contato, inicio, fim)
    values
      (v_id, p_servico_id, left(v_nome, 80), left(v_contato, 40), p_inicio, v_fim);
  exception
    when exclusion_violation then
      return 'ocupado';
  end;

  return 'confirmado';
end;
$$;

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.servicos enable row level security;
alter table public.disponibilidade enable row level security;
alter table public.bloqueios enable row level security;
alter table public.agendamentos enable row level security;

-- Serviços e disponibilidade são leitura pública (a página de agendar lê), no
-- molde de itens e horários, e o dono manda no resto.
create policy servicos_leitura_publica on public.servicos
  for select to anon, authenticated
  using (exists (select 1 from public.negocios n
                 where n.id = negocio_id and n.publicado and n.status = 'ativo'));

create policy servicos_dono on public.servicos
  for all to authenticated
  using (exists (select 1 from public.negocios n
                 where n.id = negocio_id and n.dono_id = auth.uid()))
  with check (exists (select 1 from public.negocios n
                      where n.id = negocio_id and n.dono_id = auth.uid()));

create policy disponibilidade_leitura_publica on public.disponibilidade
  for select to anon, authenticated
  using (exists (select 1 from public.negocios n
                 where n.id = negocio_id and n.publicado and n.status = 'ativo'));

create policy disponibilidade_dono on public.disponibilidade
  for all to authenticated
  using (exists (select 1 from public.negocios n
                 where n.id = negocio_id and n.dono_id = auth.uid()))
  with check (exists (select 1 from public.negocios n
                      where n.id = negocio_id and n.dono_id = auth.uid()));

-- Bloqueios não têm leitura pública: eles entram nos horários livres pela
-- função, que devolve só o intervalo. Só o dono mexe.
create policy bloqueios_dono on public.bloqueios
  for all to authenticated
  using (exists (select 1 from public.negocios n
                 where n.id = negocio_id and n.dono_id = auth.uid()))
  with check (exists (select 1 from public.negocios n
                      where n.id = negocio_id and n.dono_id = auth.uid()));

-- Agendamentos: o dono lê e mexe (confirmar não, que já nasce confirmado, mas
-- cancelar e marcar como concluído sim). Escrever uma reserva nova é só pela
-- função, que tem o teto e a trava. Por isso o dono não ganha insert.
create policy agendamentos_leitura_dono on public.agendamentos
  for select to authenticated
  using (exists (select 1 from public.negocios n
                 where n.id = negocio_id and n.dono_id = auth.uid()));

create policy agendamentos_edita_dono on public.agendamentos
  for update to authenticated
  using (exists (select 1 from public.negocios n
                 where n.id = negocio_id and n.dono_id = auth.uid()))
  with check (exists (select 1 from public.negocios n
                      where n.id = negocio_id and n.dono_id = auth.uid()));

-- =============================================================================
-- Permissões
-- =============================================================================
grant select on public.servicos, public.disponibilidade to anon, authenticated;
grant insert, update, delete on public.servicos, public.disponibilidade,
  public.bloqueios to authenticated;
grant select, update on public.agendamentos to authenticated;

-- Ninguém escreve reserva direto, nem o dono. Só a função, que tem teto.
revoke insert, delete on public.agendamentos from anon, authenticated;

-- Função nova nasce aberta por dois caminhos, e nenhum se fecha sozinho em
-- arquivo de correção. Ver a nota na 005 e em LEIA-ME.md.
revoke execute on function public.ocupacao_do_negocio(text, timestamptz, timestamptz)
  from public, anon, authenticated;
revoke execute on function
  public.criar_agendamento(text, uuid, text, text, timestamptz)
  from public, anon, authenticated;

-- E volta nominalmente para quem precisa: as duas são chamadas pela página
-- pública, que pode estar sem conta nenhuma.
grant execute on function public.ocupacao_do_negocio(text, timestamptz, timestamptz)
  to anon, authenticated;
grant execute on function
  public.criar_agendamento(text, uuid, text, text, timestamptz)
  to anon, authenticated;

grant execute on all functions in schema public to service_role;

commit;

-- =============================================================================
-- Conferir
-- =============================================================================
--   select to_regclass('public.servicos'),
--          to_regclass('public.disponibilidade'),
--          to_regclass('public.bloqueios'),
--          to_regclass('public.agendamentos');  -- as quatro existem
--
--   select has_function_privilege('anon',
--     'public.criar_agendamento(text, uuid, text, text, timestamptz)', 'EXECUTE');
--     -- tem que ser true
--
-- A bateria testes-rls.sql confere o resto: as listas de funções chamáveis por
-- anon e por authenticated ganharam as duas novas, e há asserção nova de que a
-- exclusão barra a segunda reserva no mesmo horário.
