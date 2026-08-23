-- =============================================================================
-- Correção 015: o banco passa a conferir o endereço dos links
-- =============================================================================
-- Rodar no SQL Editor. Não precisa da senha do banco. Idempotente.
--
-- -----------------------------------------------------------------------------
-- O buraco, e por que ele é o mais caro que a revisão achou
-- -----------------------------------------------------------------------------
-- `lib/links.ts` é o portão de todo link que o dono digita, e o AGENTS.md diz
-- que campo novo de URL sem passar por lá é buraco de golpe. Ele recusa quatro
-- coisas: esquema que não seja http, encurtador, usuário antes do arroba, e IP
-- puro. As Server Actions chamam ele em todos os campos, conferido.
--
-- O problema é que o portão mora só ali. **O painel escreve direto pelo
-- PostgREST, com o token da própria pessoa**, e nesse caminho a conferência da
-- tela é enfeite. Do lado do banco existia:
--
--   acao_principal / acao_secundaria  conferiam `tipo` e `rotulo`, e o `url`
--                                     de dentro do JSON passava intocado
--   links.url                         só `^https?://`
--
-- Ou seja, um PATCH à mão põe o que quiser no botão principal da página, que é
-- o mais clicado, fixo no rodapé:
--
--   {"tipo":"link","rotulo":"Pagar agora",
--    "url":"https://nubank.com.br@golpe.net/pix","icone":"link"}
--
-- O usuário antes do arroba faz o endereço parecer um banco e levar para outro
-- lugar. É exatamente o golpe que `lib/links.ts` foi escrito para barrar.
--
-- Não vira execução de script: o React sanitiza `href`, então `javascript:`
-- morre antes. O estrago é phishing com destino disfarçado, com a página de uma
-- pessoa de verdade dando credibilidade ao link.
--
-- -----------------------------------------------------------------------------
-- O que muda
-- -----------------------------------------------------------------------------
-- Uma função de conferência, espelhando as quatro regras de lib/links.ts, e as
-- três constraints passando a usá-la. A lista de encurtadores fica curta de
-- propósito: ela nunca vai estar completa, e o comentário de lib/links.ts
-- explica por que isso está certo. Encurtador novo tem tráfego zero, e o
-- golpista usa o que a vítima reconhece.

begin;

create or replace function public.endereco_de_link_valido(p_url text)
returns boolean
language sql
immutable
set search_path = pg_catalog, public, pg_temp
as $$
  select
    p_url is not null
    -- Só https. O `conferirLink` completa o http para https antes de gravar,
    -- então quem chega aqui com http veio por fora da tela.
    and p_url ~ '^https://'
    -- Usuário antes do arroba, que é o disfarce mais eficaz: o olho lê o começo
    -- e o navegador obedece o fim.
    and split_part(split_part(p_url, '://', 2), '/', 1) !~ '@'
    -- IP puro no lugar do domínio.
    and split_part(split_part(p_url, '://', 2), '/', 1) !~ '^[0-9]{1,3}(\.[0-9]{1,3}){3}(:[0-9]+)?$'
    -- Encurtador esconde o destino, e destino escondido é o oposto do que esta
    -- página promete.
    and lower(split_part(split_part(p_url, '://', 2), '/', 1)) not in (
      'bit.ly', 'tinyurl.com', 'www.tinyurl.com', 'encurtador.com.br',
      'is.gd', 't.co', 'goo.gl', 'ow.ly', 'buff.ly', 'rebrand.ly',
      'cutt.ly', 'shorturl.at', 'rb.gy', 'l.ead.me', 'linktr.ee'
    )
    -- Domínio com ponto. Fecha `https://localhost` e nome de máquina interna.
    and split_part(split_part(p_url, '://', 2), '/', 1) ~ '\.'
$$;

comment on function public.endereco_de_link_valido(text) is
  'Espelho das regras de lib/links.ts, para o banco recusar o que a tela recusa. Ver correção 015.';

-- Os links extras.
alter table public.links drop constraint if exists url_http;
alter table public.links drop constraint if exists url_conferida;
alter table public.links add constraint url_conferida
  check (public.endereco_de_link_valido(url));

-- Os dois botões do rodapé. O `url` é nulo quando a ação é WhatsApp, que monta
-- o endereço na hora a partir do número, então nulo continua valendo.
alter table public.negocios drop constraint if exists acao_principal_url;
alter table public.negocios add constraint acao_principal_url
  check (
    acao_principal is null
    or acao_principal ->> 'url' is null
    or public.endereco_de_link_valido(acao_principal ->> 'url')
  );

alter table public.negocios drop constraint if exists acao_secundaria_url;
alter table public.negocios add constraint acao_secundaria_url
  check (
    acao_secundaria is null
    or acao_secundaria ->> 'url' is null
    or public.endereco_de_link_valido(acao_secundaria ->> 'url')
  );

commit;

-- =============================================================================
-- Conferir
-- =============================================================================
-- 1. A função recusa os quatro casos e aceita o normal:
--
--   select
--     public.endereco_de_link_valido('https://ateliedaana.com.br/agenda') as ok,
--     public.endereco_de_link_valido('https://nubank.com.br@golpe.net/pix') as arroba,
--     public.endereco_de_link_valido('https://bit.ly/3xYz')                as encurtador,
--     public.endereco_de_link_valido('https://192.168.0.1/x')              as ip,
--     public.endereco_de_link_valido('http://exemplo.com.br')              as sem_tls;
--
--   Tem que vir: ok true, e as outras quatro false.
--
-- 2. As três constraints existem:
--
--   select conrelid::regclass as tabela, conname from pg_constraint
--    where conname in ('url_conferida', 'acao_principal_url', 'acao_secundaria_url')
--    order by conname;
--
--   Tem que trazer três linhas.
--
-- 3. NADA que já está gravado quebra. Rode ANTES do begin acima se quiser
--    conferir primeiro, porque um alter table com dado violando a restrição
--    falha e desfaz a transação inteira, sem estrago:
--
--   select id, slug, url from public.links
--    where not public.endereco_de_link_valido(url);
--
--   select id, slug, acao_principal ->> 'url', acao_secundaria ->> 'url'
--     from public.negocios
--    where (acao_principal ->> 'url' is not null
--           and not public.endereco_de_link_valido(acao_principal ->> 'url'))
--       or (acao_secundaria ->> 'url' is not null
--           and not public.endereco_de_link_valido(acao_secundaria ->> 'url'));
--
--   As duas têm que vir vazias. Se vier alguma linha, PARE e me avise: existe
--   link de gente que a regra nova recusaria, e apagar ou reescrever o link de
--   uma pessoa é decisão dela, e não nossa.
