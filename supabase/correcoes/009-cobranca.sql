-- =============================================================================
-- Correção 009: assinatura, cobrança e o webhook que escreve o plano
-- =============================================================================
-- Rodar no SQL Editor. Não precisa da senha do banco.
--
-- O que muda no produto
-- ---------------------
-- Antes: a cobrança era manual. Alguém recebia o Pix, conferia na mão e
-- escrevia plano e plano_expira_em com a chave de serviço.
--
-- Agora: o checkout é próprio, com o Mercado Pago por trás, e quem escreve o
-- plano é o webhook. Ele chama registrar_cobranca_paga com a chave de serviço,
-- que é a única porta que o gatilho protege_cobranca deixa aberta.
--
-- O que este arquivo acrescenta
-- -----------------------------
-- 1. Três tabelas: assinaturas, cobrancas e avisos_pagamento.
-- 2. Quatro funções só para a chave de serviço: registrar_cobranca_paga,
--    encerrar_assinatura, marcar_atraso e desfazer_cobranca.
-- 4. RLS nas três tabelas, e o endereço /assinar reservado.
-- 5. Um remendo que veio de carona, porque foi achado agora: a constraint
--    icone_conhecido de links passa a aceitar os nove ícones que lib/tipos.ts
--    já declara, em vez dos cinco de quando a tabela nasceu.
--
-- Depende das correções 004 e 005.
--
-- Nenhum segredo do gateway entra aqui. Token de acesso, chave do webhook e
-- afins moram nas variáveis de ambiente do servidor, e nunca no banco.
--
-- A regra que atravessa o arquivo inteiro
-- ---------------------------------------
-- Em lugar nenhum aparece "plano_expira_em = plano_expira_em + interval".
-- O vencimento é sempre um instante absoluto que veio do pagamento, aplicado
-- assim:
--
--   plano_expira_em = greatest(coalesce(plano_expira_em, now()), p_ate)
--
-- A tabela avisos_pagamento é o cinto: o mesmo id de evento do gateway entra
-- uma vez só, e a segunda entrega do mesmo aviso morre ali. O greatest é o
-- suspensório, e é ele que continua valendo no caso que a tabela de
-- idempotência não cobre: dois eventos diferentes, os dois legítimos,
-- chegando na ordem trocada. Somar intervalo nessa hora cobraria o mesmo mês
-- duas vezes, e o cliente pagaria por um mês que ele já tinha.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Assinaturas
-- -----------------------------------------------------------------------------
-- Uma linha por assinatura do negócio, viva ou morta. O id_externo é o
-- preapproval do Mercado Pago, que é o que amarra a linha daqui na linha de lá.

create table if not exists public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,

  provedor text not null default 'mercadopago',
  -- O preapproval do Mercado Pago. Nulo enquanto a assinatura está sendo
  -- criada, porque o id só existe depois que o gateway responde.
  id_externo text,

  ciclo text,
  meio text,
  -- 'teste' é o período de experiência, 'em_atraso' é a carência depois de um
  -- pagamento recusado, e 'encerrada' é o fim, cancelado por quem for.
  status text not null default 'teste',

  valor_centavos integer not null,

  teste_termina_em timestamptz,
  ciclo_termina_em timestamptz,
  cancelada_em timestamptz,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint ciclo_conhecido check (ciclo is null or ciclo in ('mensal', 'anual')),
  constraint meio_conhecido check (
    meio is null or meio in ('credito', 'debito', 'pix')
  ),
  constraint status_conhecido check (
    status in ('teste', 'ativa', 'em_atraso', 'encerrada')
  ),
  constraint valor_positivo check (valor_centavos > 0)
);

-- Os dois índices que valem mais que a tabela.

-- O mesmo preapproval não entra duas vezes. É o que segura o webhook que
-- reenvia, e o parcial existe porque a linha nasce sem id_externo.
create unique index if not exists assinaturas_externo_idx
  on public.assinaturas (provedor, id_externo)
  where id_externo is not null;

-- Uma assinatura viva por negócio, garantido no banco e não na tela. Sem isto,
-- dois cliques no botão de assinar viram duas cobranças recorrentes, e quem
-- descobre é o cliente na fatura.
create unique index if not exists assinaturas_viva_idx
  on public.assinaturas (negocio_id)
  where status in ('teste', 'ativa', 'em_atraso');

-- Para a política de leitura do dono, que também alcança as encerradas.
create index if not exists assinaturas_negocio_idx
  on public.assinaturas (negocio_id, criado_em desc);

-- O gatilho de atualizado_em já existe desde o schema.sql, e é reusado.
drop trigger if exists assinaturas_atualizado_em on public.assinaturas;
create trigger assinaturas_atualizado_em
  before update on public.assinaturas
  for each row execute function public.marca_atualizacao();

-- -----------------------------------------------------------------------------
-- 2. Cobranças
-- -----------------------------------------------------------------------------
-- Uma linha por tentativa de pagamento.
--
-- O id é gerado pela aplicação ANTES de falar com o gateway, e vai junto no
-- pedido como chave de idempotência. Por isso a coluna fica sem default: id
-- que o banco inventa depois já chegou tarde para o que ele serve. Quando o
-- webhook chega antes de a aplicação terminar de gravar, a função lá embaixo
-- cria a linha com um id próprio, e a unique de (provedor, id_externo) é o que
-- impede a segunda.

create table if not exists public.cobrancas (
  id uuid primary key,
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  -- A assinatura pode sair de cena, e a cobrança fica: ela é o registro de que
  -- o dinheiro entrou.
  assinatura_id uuid references public.assinaturas (id) on delete set null,

  provedor text not null default 'mercadopago',
  id_externo text not null,

  meio text,
  valor_centavos integer not null,
  status text not null default 'aguardando',

  -- O Pix tem prazo, e depois dele o código não vale mais.
  --
  -- O copia e cola NÃO é guardado, de propósito. Ele é segredo em repouso, com
  -- ganho pequeno: expira em trinta minutos, e quem precisa dele de novo pede
  -- outro. Guardar seria assumir o custo de proteger uma string que já vai
  -- estar morta quando alguém conseguir lê-la.
  pix_expira_em timestamptz,
  pago_em timestamptz,
  criado_em timestamptz not null default now(),

  constraint meio_conhecido check (
    meio is null or meio in ('credito', 'debito', 'pix')
  ),
  constraint status_conhecido check (
    status in ('aguardando', 'paga', 'recusada', 'devolvida')
  ),
  constraint valor_positivo check (valor_centavos > 0),

  unique (provedor, id_externo)
);

create index if not exists cobrancas_negocio_idx
  on public.cobrancas (negocio_id, criado_em desc);

-- -----------------------------------------------------------------------------
-- 3. Avisos do gateway
-- -----------------------------------------------------------------------------
-- A trava de idempotência do webhook, e nada mais. O Mercado Pago reenvia o
-- mesmo aviso quando a resposta demora, então a primeira coisa que o webhook
-- faz é tentar inserir aqui: se a chave já existe, o aviso já foi tratado e a
-- requisição termina em silêncio.
--
-- Não guarda corpo de requisição nem assinatura do gateway: são dados de outra
-- pessoa e de outro sistema, e a tabela existe para responder uma pergunta só,
-- que é "já vi este evento?".

create table if not exists public.avisos_pagamento (
  provedor text not null,
  id_evento text not null,
  topico text,
  recebido_em timestamptz not null default now(),

  primary key (provedor, id_evento)
);

-- -----------------------------------------------------------------------------
-- 4. As funções da chave de serviço
-- -----------------------------------------------------------------------------

-- Pagamento confirmado. Grava a cobrança, deixa a assinatura ativa e empurra o
-- vencimento do plano, tudo na mesma transação.
--
-- Dentro de security definer o current_user é postgres, então protege_cobranca
-- cai no early return e a escrita em plano e plano_expira_em passa. Esta é a
-- única porta que o gatilho deixa aberta, e é por isso que o revoke desta
-- função, lá no fim do arquivo, é a linha mais importante daqui.
create or replace function public.registrar_cobranca_paga(
  p_negocio uuid,
  p_assinatura uuid,
  p_id_externo text,
  p_meio text,
  p_valor_centavos integer,
  p_ate timestamptz
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_plano text;
begin
  if p_negocio is null or p_id_externo is null or p_ate is null then
    raise exception 'registrar_cobranca_paga pede negócio, id externo e data'
      using errcode = 'check_violation';
  end if;

  -- A linha já existe quando a aplicação gravou antes de chamar o gateway, e
  -- não existe quando o webhook chegou primeiro. Os dois caminhos terminam com
  -- uma linha só, porque o arbitro é o par (provedor, id_externo).
  insert into public.cobrancas (
    id, negocio_id, assinatura_id, provedor, id_externo,
    meio, valor_centavos, status, pago_em
  )
  values (
    gen_random_uuid(), p_negocio, p_assinatura, 'mercadopago', p_id_externo,
    p_meio, p_valor_centavos, 'paga', now()
  )
  on conflict (provedor, id_externo) do update
    set status = 'paga',
        pago_em = now();

  -- O mesmo greatest da linha de baixo, e pelo mesmo motivo. Sem ele o aviso
  -- fora de ordem encurtaria o ciclo da assinatura enquanto o vencimento do
  -- plano ficava de pé, e as duas datas passariam a discordar na tela do dono.
  update public.assinaturas
     set status = 'ativa',
         ciclo_termina_em = greatest(coalesce(ciclo_termina_em, now()), p_ate),
         meio = coalesce(p_meio, meio),
         cancelada_em = null
   where id = p_assinatura;

  -- O instante absoluto que veio do pagamento, e o maior dos dois.
  --
  -- O greatest é o que segura o aviso fora de ordem: se o de setembro chegar
  -- depois do de outubro, o vencimento de outubro fica de pé. Somar intervalo
  -- aqui daria um mês a mais de graça, e no caminho contrário daria um mês a
  -- menos para quem pagou.
  update public.negocios
     set plano = 'pago',
         plano_expira_em = greatest(coalesce(plano_expira_em, now()), p_ate)
   where id = p_negocio;

  -- Rede de segurança contra um erro que seria silencioso.
  --
  -- protege_cobranca deixa passar quem é 'service_role' ou 'postgres'. Se um
  -- dia esta função for recriada com outro dono, o current_user muda, o gatilho
  -- devolve o valor de antes sem reclamar, e o cliente paga sem receber o
  -- plano. Melhor o webhook estourar e reentregar.
  select plano into v_plano from public.negocios where id = p_negocio;
  if v_plano is distinct from 'pago' then
    raise exception 'o gatilho protege_cobranca recusou a escrita do plano, confira o dono desta função'
      using errcode = 'insufficient_privilege';
  end if;
end;
$$;

-- Cancelamento, pedido pelo cliente ou pelo gateway.
--
-- NÃO toca em plano_expira_em, de propósito: quem cancela no dia 3 pagou até o
-- dia 30, e tirar a página do ar na hora seria cobrar por um mês e entregar
-- três dias. O vencimento sozinho rebaixa, que é o que plano_de() já garante.
create or replace function public.encerrar_assinatura(p_negocio uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.assinaturas
     set status = 'encerrada',
         cancelada_em = now()
   where negocio_id = p_negocio
     and status in ('teste', 'ativa', 'em_atraso');
end;
$$;

-- Pagamento recusado. Marca o atraso e dá uma carência.
--
-- A carência existe porque tirar a página do ar na tarde em que o cartão falhou
-- é o pior momento possível: o cartão falha por limite, por troca de número, por
-- banco fora do ar, e quase sempre o cliente resolve em um ou dois dias. Cinco
-- dias custa pouco e evita derrubar o negócio de quem ia pagar mesmo.
create or replace function public.marcar_atraso(
  p_negocio uuid,
  p_carencia_dias integer default 5
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_carencia integer := greatest(coalesce(p_carencia_dias, 5), 0);
begin
  update public.assinaturas
     set status = 'em_atraso'
   where negocio_id = p_negocio
     and status in ('teste', 'ativa');

  -- Mesmo greatest de sempre: a carência é um piso, e nunca encurta o que já
  -- estava pago.
  update public.negocios
     set plano_expira_em = greatest(
           coalesce(plano_expira_em, now()),
           now() + make_interval(days => v_carencia)
         )
   where id = p_negocio;
end;
$$;

-- Estorno e chargeback.
--
-- O único lugar do sistema onde a data anda para trás, e é por isso que é
-- função separada em vez de um parâmetro da registrar_cobranca_paga: parâmetro
-- vira engano de chamada, e engano de chamada aqui derruba a página de quem
-- está pagando em dia.
create or replace function public.desfazer_cobranca(p_id_externo text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Uma sentença só, para o caso de o mesmo id existir em mais de um provedor
  -- no dia em que existir um segundo provedor.
  with alvo as (
    update public.cobrancas
       set status = 'devolvida'
     where id_externo = p_id_externo
    returning negocio_id
  )
  update public.negocios n
     set plano_expira_em = now()
    from alvo
   where n.id = alvo.negocio_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. As duas funções do navegador
-- Os números do painel: um total por dia e por tipo.
--
-- security invoker de propósito, que é o padrão e está escrito para não parecer
-- esquecimento. Assim a função herda a RLS de eventos em vez de repetir a
-- regra: quem chama vê o que já veria consultando a tabela, e negócio de outra
-- pessoa volta vazio sozinho. Repetir a regra aqui seria criar um segundo lugar
-- para ela envelhecer.
--
-- O dia é o dia do fuso do negócio, e não o do UTC. No Brasil a diferença muda
-- a conta de verdade: visita das 21h30 cairia no dia seguinte.
create or replace function public.numeros_do_negocio(
  p_negocio uuid,
  p_dias integer
)
returns table (dia date, tipo text, total bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select (e.criado_em at time zone n.fuso)::date,
         e.tipo,
         count(*)
    from public.eventos e
    join public.negocios n on n.id = e.negocio_id
   where e.negocio_id = p_negocio
     and e.criado_em >= now() - make_interval(days => greatest(coalesce(p_dias, 7), 1))
   group by 1, 2
   order by 1, 2;
$$;

-- -----------------------------------------------------------------------------
-- 6. Row Level Security
-- -----------------------------------------------------------------------------
-- assinaturas e cobrancas seguem o desenho de eventos: o dono lê o que é dele,
-- e ninguém escreve pelo navegador. Quem escreve é o webhook, pela chave de
-- serviço, e sempre por função.
--
-- avisos_pagamento segue o desenho de denuncias: RLS ligada e política nenhuma,
-- então ninguém lê nem escreve pelo navegador.

alter table public.assinaturas      enable row level security;
alter table public.cobrancas        enable row level security;
alter table public.avisos_pagamento enable row level security;

drop policy if exists assinaturas_leitura_dono on public.assinaturas;
create policy assinaturas_leitura_dono on public.assinaturas
  for select to authenticated
  using (exists (select 1 from public.negocios n
                 where n.id = negocio_id and n.dono_id = auth.uid()));

drop policy if exists cobrancas_leitura_dono on public.cobrancas;
create policy cobrancas_leitura_dono on public.cobrancas
  for select to authenticated
  using (exists (select 1 from public.negocios n
                 where n.id = negocio_id and n.dono_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- 7. Permissões de tabela
-- -----------------------------------------------------------------------------
-- O Supabase mantém um default privilege que dá tudo em toda tabela nova para
-- anon e authenticated. A RLS já barraria a escrita, porque não existe política
-- de insert, update nem delete, mas privilégio que ninguém precisa é privilégio
-- que sobra. O revoke vem primeiro, e só depois o select volta para o dono.

revoke all on public.assinaturas, public.cobrancas, public.avisos_pagamento
  from anon, authenticated;

grant select on public.assinaturas, public.cobrancas to authenticated;

-- A chave de serviço é quem escreve, e ela é só do servidor.
grant all on public.assinaturas, public.cobrancas, public.avisos_pagamento
  to service_role;

-- -----------------------------------------------------------------------------
-- 8. Fechar as seis funções novas, na mão
-- -----------------------------------------------------------------------------
-- Função nova nasce aberta por dois caminhos, e os dois valem aqui:
--
-- 1. O EXECUTE para PUBLIC que o Postgres dá a toda função.
-- 2. O EXECUTE nominal para anon e authenticated que o Supabase dá por um
--    default privilege próprio, para publicar as funções em /rest/v1/rpc.
--
-- O "alter default privileges ... revoke execute on functions from public" do
-- schema.sql parece resolver o primeiro e não resolve: no Postgres 16 ele não
-- guarda linha nenhuma em pg_default_acl, e a função seguinte continua nascendo
-- com PUBLIC podendo executar. Medido, não deduzido. Quem fecha de verdade é o
-- "revoke execute on all functions", que passa por cima do que já existe e por
-- isso roda depois de as funções existirem, lá no fim do schema.sql. Arquivo de
-- correção roda sozinho, sem essa varredura.
--
-- Então: cada função nova pede o seu revoke escrito na mão, aqui. A bateria em
-- testes-rls.sql confere, e ela lista os nomes um a um.

revoke execute on function public.registrar_cobranca_paga(
    uuid, uuid, text, text, integer, timestamptz)
  from public, anon, authenticated;
revoke execute on function public.encerrar_assinatura(uuid)
  from public, anon, authenticated;
revoke execute on function public.marcar_atraso(uuid, integer)
  from public, anon, authenticated;
revoke execute on function public.desfazer_cobranca(text)
  from public, anon, authenticated;
revoke execute on function public.numeros_do_negocio(uuid, integer)
  from public, anon, authenticated;

-- E agora o que volta, e para quem.
--
-- As quatro de cima são a porta do dinheiro. registrar_cobranca_paga é a única
-- coisa no banco inteiro que consegue escrever plano e plano_expira_em, porque
-- é security definer e o protege_cobranca deixa o dono do banco passar. Nas
-- mãos de anon isso é plano pago de graça para quem souber mandar um POST em
-- /rest/v1/rpc. Só a chave de serviço, que é do servidor.
grant execute on function public.registrar_cobranca_paga(
    uuid, uuid, text, text, integer, timestamptz) to service_role;
grant execute on function public.encerrar_assinatura(uuid) to service_role;
grant execute on function public.marcar_atraso(uuid, integer) to service_role;
grant execute on function public.desfazer_cobranca(text) to service_role;

-- cadastra ainda pode estar sem conta, então anon também.

-- numeros_do_negocio é o painel. Visitante não tem painel, e mesmo que tivesse
-- a RLS de eventos devolveria vazio: o grant é o primeiro portão, e a RLS é o
-- segundo.
grant execute on function public.numeros_do_negocio(uuid, integer) to authenticated;

-- A chave de serviço continua podendo tudo, que é o princípio do schema.sql.
grant execute on function public.numeros_do_negocio(uuid, integer) to service_role;

-- -----------------------------------------------------------------------------
-- 9. Os ícones de link que o código já conhece
-- -----------------------------------------------------------------------------
-- Isto não é sobre cobrança, e está aqui porque foi encontrado agora e vira
-- erro na etapa logo depois desta.
--
-- IconeLink em lib/tipos.ts tem nove valores. A constraint icone_conhecido tem
-- cinco, os cinco de quando a tabela nasceu. Hoje ninguém percebe: nenhuma tela
-- grava em links ainda, e os exemplos de lib/exemplos.ts por sorte só usam os
-- cinco antigos. No dia em que a camada de dados começar a escrever link de
-- verdade, telefone, agenda, cardapio e loja batem num check violation.
--
-- Quem manda no conjunto de ícones é lib/tipos.ts, e a constraint existe só
-- para barrar lixo, não para ser a fonte da verdade. É a mesma decisão que a
-- categoria já carrega: a lista mora no código, muda com deploy e não com
-- migração. Ícone é enfeite de exibição, e ícone desconhecido cai no desenho
-- padrão em vez de derrubar a página.

alter table public.links
  drop constraint if exists icone_conhecido,
  add constraint icone_conhecido check (
    icone in ('instagram', 'mapa', 'ifood', 'site', 'link',
              'telefone', 'agenda', 'cardapio', 'loja')
  );

-- -----------------------------------------------------------------------------
-- 10. O endereço /assinar
-- -----------------------------------------------------------------------------
-- precos, assinatura e cobranca já estavam reservados desde o schema.sql, e
-- assinar ficou de fora. A rota existe, então o endereço sai da praça.

insert into public.slugs_reservados (slug) values ('assinar')
  on conflict do nothing;

commit;

-- =============================================================================
-- Conferir
-- =============================================================================
-- 1. As três tabelas existem, com RLS ligada:
--
--   select relname, relrowsecurity from pg_class
--    where relnamespace = 'public'::regnamespace
--      and relname in ('assinaturas', 'cobrancas', 'avisos_pagamento');
--
--   As três, as três com relrowsecurity verdadeiro.
--
-- 2. As quatro funções do dinheiro ficam fora do alcance do navegador:
--
--   select p.proname,
--          has_function_privilege('anon', p.oid, 'execute') as anon,
--          has_function_privilege('authenticated', p.oid, 'execute') as logado
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public'
--      and p.proname in ('registrar_cobranca_paga', 'encerrar_assinatura',
--                        'marcar_atraso', 'desfazer_cobranca');
--
--   As oito respostas têm que vir false.
--
-- 3. As duas do navegador respondem:
--
--   true nas duas colunas, numeros_do_negocio vem false em anon e true em
--   authenticated.
--
-- 4. Os dois índices da assinatura estão de pé:
--
--   select indexname from pg_indexes
--    where schemaname = 'public' and tablename = 'assinaturas'
--    order by indexname;
--
--   Tem que trazer assinaturas_externo_idx e assinaturas_viva_idx.
--
-- 5. O endereço novo está reservado:
--
--   select slug from public.slugs_reservados where slug = 'assinar';
--
-- 6. Os nove ícones estão na constraint:
--
--   select pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'public.links'::regclass and conname = 'icone_conhecido';
--
--   Tem que aparecer telefone, agenda, cardapio e loja junto com os cinco
--   antigos.
--
-- 7. A bateria inteira continua passando: rodar supabase/testes-rls.sql.
