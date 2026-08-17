-- =============================================================================
-- Correção 011: a assinatura recorrente nasce pelo webhook
-- =============================================================================
-- Rodar no SQL Editor. Não precisa da senha do banco. Depende da 009.
--
-- O buraco que ela fecha
-- ----------------------
-- A 009 trouxe quatro funções, e todas tratam dinheiro que já entrou:
-- registrar_cobranca_paga, marcar_atraso, desfazer_cobranca e
-- encerrar_assinatura. Faltou a primeira de todas, que é a assinatura passar a
-- existir.
--
-- Isso importa porque o crédito começa com sete dias de teste, e teste é
-- exatamente o caso em que o plano vira pago sem nenhum centavo ter entrado.
-- Fazer isso com registrar_cobranca_paga exigiria inventar uma cobrança de
-- valor zero, que a constraint valor_positivo recusa, e com razão: linha em
-- cobrancas é dinheiro, e dinheiro que não entrou não vira linha.
--
-- Quem chama, e por que só ele
-- ----------------------------
-- Só o webhook, com a chave de serviço, depois de conferir o HMAC do aviso e
-- de consultar o preapproval na API do Mercado Pago. O corpo do aviso nunca é
-- acreditado, e por isso todo parâmetro daqui sai da consulta, e não do aviso.
--
-- A tela de checkout NÃO grava esta linha, de propósito. O id da assinatura no
-- Mercado Pago só existe depois que o POST /preapproval responde, e o aviso do
-- webhook costuma chegar antes de a Server Action terminar de gravar. Se os
-- dois escrevessem, o webhook criaria uma segunda linha para a mesma
-- assinatura e o índice assinaturas_viva_idx recusaria a segunda, deixando o
-- cliente pago e a página no gratuito. Com um escritor só, a corrida some.
-- =============================================================================

begin;

-- A assinatura recorrente existe e está valendo até tal dia.
--
-- Idempotente pelo par (provedor, id_externo), que é o mesmo árbitro que a
-- registrar_cobranca_paga usa em cobrancas: o mesmo preapproval entregue duas
-- vezes atualiza a linha em vez de criar outra.
--
-- As duas datas entram por greatest, pela regra que atravessa a 009: aviso que
-- chega fora de ordem nunca encurta o que já estava valendo.
create or replace function public.abrir_assinatura(
  p_negocio uuid,
  p_id_externo text,
  p_ciclo text,
  p_meio text,
  p_valor_centavos integer,
  -- Fim do teste grátis. Nulo quando a assinatura nasceu já cobrando.
  p_teste_ate timestamptz,
  -- Fim do ciclo pago. Nulo enquanto só existe teste.
  p_ciclo_ate timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_ate timestamptz;
  v_status text;
  v_plano text;
begin
  if p_negocio is null or p_id_externo is null then
    raise exception 'abrir_assinatura pede negócio e id externo'
      using errcode = 'check_violation';
  end if;

  -- Até quando esta assinatura entrega o plano pago. É o maior dos dois porque
  -- a assinatura com teste tem as duas datas preenchidas depois da primeira
  -- cobrança, e a que manda é sempre a de mais longe.
  v_ate := greatest(p_teste_ate, p_ciclo_ate);
  if v_ate is null then
    raise exception 'abrir_assinatura pede pelo menos uma data de validade'
      using errcode = 'check_violation';
  end if;

  -- 'teste' enquanto o dinheiro ainda não entrou, 'ativa' depois. O status vem
  -- da existência de p_ciclo_ate, e não da data de hoje: a pergunta é se já
  -- houve cobrança, e não se o teste terminou.
  v_status := case when p_ciclo_ate is null then 'teste' else 'ativa' end;

  insert into public.assinaturas (
    negocio_id, provedor, id_externo, ciclo, meio,
    status, valor_centavos, teste_termina_em, ciclo_termina_em
  )
  values (
    p_negocio, 'mercadopago', p_id_externo, p_ciclo, p_meio,
    v_status, p_valor_centavos, p_teste_ate, p_ciclo_ate
  )
  on conflict (provedor, id_externo) where id_externo is not null
  do update set
    -- A assinatura encerrada continua encerrada: aviso atrasado de uma
    -- assinatura que a pessoa já cancelou não a ressuscita.
    status = case
               when assinaturas.status = 'encerrada' then 'encerrada'
               else v_status
             end,
    ciclo = coalesce(excluded.ciclo, assinaturas.ciclo),
    meio = coalesce(excluded.meio, assinaturas.meio),
    teste_termina_em = greatest(
      assinaturas.teste_termina_em, excluded.teste_termina_em),
    ciclo_termina_em = greatest(
      assinaturas.ciclo_termina_em, excluded.ciclo_termina_em)
  returning id, status into v_id, v_status;

  -- Assinatura que já estava encerrada não escreve plano. Sem esta saída, um
  -- aviso repetido do Mercado Pago devolveria o plano pago para quem cancelou.
  if v_status = 'encerrada' then
    return v_id;
  end if;

  update public.negocios
     set plano = 'pago',
         plano_expira_em = greatest(coalesce(plano_expira_em, now()), v_ate)
   where id = p_negocio;

  -- A mesma rede de segurança da registrar_cobranca_paga, e pelo mesmo motivo:
  -- se um dia esta função for recriada com outro dono, protege_cobranca devolve
  -- o valor de antes sem reclamar, e a pessoa fica com o teste que não abriu.
  select plano into v_plano from public.negocios where id = p_negocio;
  if v_plano is distinct from 'pago' then
    raise exception 'o gatilho protege_cobranca recusou a escrita do plano, confira o dono desta função'
      using errcode = 'insufficient_privilege';
  end if;

  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Fechar a função nova, na mão
-- -----------------------------------------------------------------------------
-- Pelo mesmo motivo escrito na 009: arquivo de correção roda sozinho, sem a
-- varredura de revoke do fim do schema.sql, então função nova nasce chamável
-- por PUBLIC e por anon. Esta escreve plano pago sem cobrar nada, o que em
-- mãos erradas é assinatura de graça por um POST em /rest/v1/rpc.

revoke execute on function public.abrir_assinatura(
    uuid, text, text, text, integer, timestamptz, timestamptz)
  from public, anon, authenticated;

grant execute on function public.abrir_assinatura(
    uuid, text, text, text, integer, timestamptz, timestamptz)
  to service_role;

commit;
