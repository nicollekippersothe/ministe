import { configurado } from "./supabase/config";

/** Endereço base do site, usado no JSON-LD, no canonical e no Open Graph. */
export const urlBase = (
  process.env.NEXT_PUBLIC_URL_BASE ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

/**
 * O endereço deste deploy, que pode ser diferente do endereço do site.
 *
 * `urlBase` é o domínio de produção, e é o certo para o canonical e o Open
 * Graph: prévia de branch nenhuma deveria se anunciar como o site. O webhook
 * de pagamento precisa do oposto. Ele diz ao Mercado Pago para onde mandar o
 * aviso daquela cobrança, e o aviso precisa voltar para o código que criou a
 * cobrança. Numa prévia, `urlBase` apontaria para produção, que roda outra
 * versão, e o aviso morreria em 404 com o dinheiro já dentro.
 */
export const urlDesteDeploy =
  process.env.VERCEL_ENV === "preview" && process.env.VERCEL_BRANCH_URL
    ? `https://${process.env.VERCEL_BRANCH_URL}`
    : urlBase;

/**
 * E-mail de suporte. Fica nulo até existir de verdade: a tela de ajuda
 * simplesmente não mostra o bloco de contato, em vez de inventar um endereço
 * para o qual ninguém responde.
 */
export const CONTATO_SUPORTE: string | null =
  process.env.NEXT_PUBLIC_CONTATO_SUPORTE ?? null;

/**
 * Modo vitrine.
 *
 * Enquanto o login não existe, o painel não pode ir para a internet: quem
 * chegasse no endereço editaria a página dos outros. Em modo vitrine as
 * páginas de exemplo e a tela inicial funcionam, e as rotas de painel e
 * cadastro respondem 404. Os dados também ficam só de leitura, o que resolve
 * o outro problema: na Vercel o disco é somente leitura.
 *
 * O padrão é ligado na Vercel e desligado na máquina, e é de propósito:
 * esquecer de definir uma variável não pode ser o que abre o painel para a
 * internet. O erro possível passa a ser o inofensivo (vitrine demais), e não
 * o perigoso. Para abrir na Vercel é preciso dizer MODO_VITRINE=0, na mão,
 * sabendo o que está fazendo.
 *
 * Sai quando o Supabase Auth entrar.
 */
export const MODO_VITRINE =
  process.env.MODO_VITRINE === "1" ||
  (process.env.MODO_VITRINE !== "0" && process.env.VERCEL === "1");

/**
 * Se dá para criar uma página agora.
 *
 * Existe como conceito próprio porque a pergunta apareceu escrita à mão em oito
 * lugares, e metade deles ficou para trás quando o Supabase entrou: a tela
 * inicial continuou dizendo "Continuar" no botão, e escondendo o link de
 * entrar, semanas depois de o cadastro estar funcionando. Quem lê `MODO_VITRINE`
 * numa tela está quase sempre querendo saber isto aqui.
 *
 * Com Supabase, o cadastro abre: cada pessoa tem a própria conta e a RLS separa
 * uma da outra. Sem Supabase, o único destino é um arquivo no disco do
 * servidor, que seria o mesmo arquivo para todo mundo, e aí o modo vitrine
 * decide.
 *
 * `lib/dados.ts` continua olhando `MODO_VITRINE` direto, e é de propósito: lá a
 * pergunta é outra, se dá para escrever no disco.
 */
export const CADASTRO_ABERTO = configurado || !MODO_VITRINE;
