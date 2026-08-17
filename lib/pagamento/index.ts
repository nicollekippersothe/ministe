import { mercadoPago } from "./mercadopago.ts";
import type { Gateway } from "./tipos.ts";

/**
 * A porta de entrada da cobrança.
 *
 * O resto do produto importa daqui e conhece só o contrato de `tipos.ts`.
 * Nenhuma rota, nenhum componente e nenhum teste importa `mercadopago.ts`
 * direto: assim trocar de provedor é trocar a linha de baixo, e um gateway de
 * mentira em teste é um objeto que cumpre `Gateway`, sem nada para interceptar.
 */

export const gateway: Gateway = mercadoPago;

export {
  DIAS_DE_TESTE,
  MESES_DE_CORTESIA_PROMETIDOS,
  MESES_DO_CICLO,
  PLANOS,
  economiaAnualEmCentavos,
  mesesDeCortesia,
} from "./precos.ts";
export type { PrecoDoPlano } from "./precos.ts";

export {
  FUSO_PADRAO,
  diasNoMes,
  fimDoPeriodo,
  fimDoPeriodoIso,
  fimDoTeste,
  somarDias,
  somarMeses,
} from "./ciclo.ts";

export {
  MOTIVOS_PAGAMENTO,
  mensagemDeRecusa,
  mensagemDoStatusDetail,
  motivoDoStatusDetail,
  normalizarDetalhe,
} from "./erros.ts";

/**
 * A conferência do webhook sai exportada porque a rota pode querer prender o
 * manifesto ao `data.id` da query da URL, que é o que a documentação do
 * Mercado Pago descreve, em vez do `data.id` do corpo que o `lerAviso` usa.
 */
export {
  JANELA_DO_AVISO_SEGUNDOS,
  conferirAssinatura,
  lerCabecalhoDeAssinatura,
  montarManifesto,
} from "./assinatura.ts";
export type { CabecalhoAssinatura, EntradaDeConferencia } from "./assinatura.ts";

export type {
  AssinaturaCriada,
  Aviso,
  Ciclo,
  CobrancaCriada,
  CobrancaDaAssinatura,
  DadosAvulso,
  DadosCartao,
  Documento,
  Gateway,
  Meio,
  MotivoRecusa,
  Resultado,
  SituacaoAssinatura,
  SituacaoCobranca,
} from "./tipos.ts";
