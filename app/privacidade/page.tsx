import type { Metadata } from "next";
import { Artigo, Documento } from "@/componentes/Documento";
import { NOME_PRODUTO } from "@/lib/marca";
import { CONTATO_SUPORTE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacidade, ${NOME_PRODUTO}`,
  description:
    "Quais dados o serviço guarda, por quanto tempo, e quais são os seus direitos.",
};

/**
 * Política de privacidade.
 *
 * O item 3 é o que diferencia este produto, e ele é verdade no código: a
 * tabela `eventos` do schema tem negocio_id, tipo e data, e mais nada. Sem IP,
 * sem cookie, sem identificador de aparelho. Se algum dia alguém acrescentar
 * uma coluna lá, este texto passa a mentir, e é por isso que o schema traz o
 * comentário avisando.
 *
 * O item 4 tem o identificador de aparelho, e os dois itens convivem porque
 * falam de coisas diferentes: o do item 4 nasce na tela de pagamento, é criado
 * pelo programa do Mercado Pago, vai junto com a cobrança e serve ao
 * antifraude do cartão. Ele nunca entra em `eventos`, e nunca alcança quem
 * visita uma página pública. Ver `componentes/painel/CamposCartao.tsx` e
 * `lib/pagamento/mercadopago.ts`.
 */
export default function Privacidade() {
  return (
    <Documento
      titulo="Privacidade"
      resumo={`O que o ${NOME_PRODUTO} guarda, por quanto tempo, e o que você pode pedir a qualquer momento.`}
      atualizadoEm="2026-08-16"
    >
      <Artigo titulo="1. Em resumo">
        <p>
          Guardamos o que a sua página precisa para existir e o mínimo para
          contar quantas pessoas a visitam. Quem visita a página de um negócio
          fica anônimo para nós e para o dono dela.
        </p>
      </Artigo>

      <Artigo titulo="2. Dados de quem cria uma página">
        <p>
          Da sua Conta do Google recebemos o e-mail, o nome e a foto do perfil,
          que servem para identificar o dono da página e para o acesso ao painel.
        </p>
        <p>
          Do que você preenche, guardamos o que vai para a página: nome do
          negócio, frase, endereço, horários, telefone, WhatsApp, catálogo, fotos
          e links. Tudo isso é público por definição, porque é o conteúdo da
          página.
        </p>
        <p>
          Guardamos ainda a data e o endereço de IP do momento em que você
          aceitou estes termos, que é o registro do aceite.
        </p>
      </Artigo>

      <Artigo titulo="3. Dados de quem visita uma página">
        <p>
          A contagem de visitas e de cliques guarda três coisas: qual página, que
          tipo de evento, e quando. Nada mais.
        </p>
        <p>
          Nessa contagem não existe endereço de IP, cookie, identificador de
          aparelho nem perfil de comportamento. Nem nós nem o dono da página
          conseguem saber quem visitou, voltar no tempo para identificar alguém,
          ou ligar duas visitas à mesma pessoa. A contagem serve para o dono
          saber que a página está trabalhando, e para nada além disso.
        </p>
      </Artigo>

      <Artigo titulo="4. Dados de pagamento">
        <p>
          O número do seu cartão, a validade e o código de segurança são
          digitados em campos hospedados pelo Mercado Pago e vão direto para
          eles. Esses dados não passam pelos nossos servidores e nunca são
          guardados por nós.
        </p>
        <p>
          Do pagamento, guardamos o valor, a data, o meio usado, a situação e o
          código da transação no Mercado Pago. É o que permite mostrar seu
          histórico de cobranças e resolver uma disputa.
        </p>
        <p>
          Na tela de pagamento, o programa do Mercado Pago cria um identificador
          do aparelho que você está usando, e nós o repassamos junto com a
          cobrança. Ele fica com o Mercado Pago, que o usa para reconhecer a
          compra como sua e aprovar o cartão de quem é dono dele. O
          identificador vale para aquela compra e para a análise de fraude dela,
          e ele fica fora da contagem de visitas do item 3.
        </p>
        <p>
          Junto com a cobrança vão ainda o seu e-mail, o seu nome, o plano
          escolhido e o valor. No cartão, o CPF do titular é digitado nos campos
          do Mercado Pago e segue direto para eles, do mesmo jeito que o número
          do cartão.
        </p>
      </Artigo>

      <Artigo titulo="5. Quem mais trata esses dados">
        <p>
          O serviço funciona sobre quatro fornecedores, cada um com uma função:
          Supabase guarda o banco de dados e as imagens, Vercel hospeda e entrega
          as páginas, Mercado Pago processa os pagamentos, e Google faz a
          entrada na conta. Cada um trata apenas o necessário para a sua parte, e
          responde pelas próprias políticas.
        </p>
        <p>
          Fora esses quatro, os dados permanecem conosco. Nada é vendido nem
          cedido para publicidade.
        </p>
      </Artigo>

      <Artigo titulo="6. Por que podemos tratar esses dados">
        <p>
          Os dados da página e da conta são tratados para executar o contrato
          entre você e nós, conforme o artigo 7, inciso V, da LGPD. Os registros
          de pagamento e o aceite dos termos são guardados para cumprir
          obrigação legal e para exercer direitos em processo, incisos II e VI. A
          contagem anônima de visitas apoia o legítimo interesse de mostrar ao
          dono que a página funciona, inciso IX, e ela permanece anônima
          justamente para pesar o mínimo nesse balanço.
        </p>
      </Artigo>

      <Artigo titulo="7. Por quanto tempo">
        <p>
          Os dados da página permanecem enquanto a conta existir. Um rascunho que
          nunca foi publicado e ficou trinta dias parado é apagado, junto com a
          conta provisória que o criou. A contagem de visitas guarda quatrocentos
          dias, o suficiente para comparar com o mesmo período do ano anterior.
          Os registros de pagamento seguem o prazo fiscal de cinco anos.
        </p>
      </Artigo>

      <Artigo titulo="8. Seus direitos">
        <p>
          A LGPD garante que você peça, a qualquer momento, a confirmação de que
          tratamos seus dados, o acesso a eles, a correção do que estiver
          incorreto, a portabilidade, a informação sobre com quem compartilhamos,
          e a exclusão. O pedido é atendido em até quinze dias.
        </p>
        <p>
          A exclusão é imediata pelo painel: encerrar a conta tira a página do ar
          e apaga os dados, com a exceção dos registros de pagamento, que a lei
          fiscal manda guardar.
        </p>
      </Artigo>

      <Artigo titulo="9. Segurança">
        <p>
          O acesso aos dados é controlado no próprio banco, linha por linha:
          cada dono alcança apenas a própria página, e essa regra é conferida por
          uma bateria de testes a cada mudança no esquema. O tráfego é
          criptografado de ponta a ponta.
        </p>
      </Artigo>

      <Artigo titulo="10. Contato">
        {CONTATO_SUPORTE ? (
          <p>
            Para exercer qualquer um dos direitos do item 8, ou para tirar
            dúvidas sobre esta política, escreva para{" "}
            <a
              href={`mailto:${CONTATO_SUPORTE}`}
              className="font-medium text-destaque underline-offset-4 hover:underline"
            >
              {CONTATO_SUPORTE}
            </a>
            .
          </p>
        ) : (
          <p>
            O canal de contato para exercer os direitos do item 8 é publicado
            aqui assim que o endereço de atendimento estiver no ar.
          </p>
        )}
      </Artigo>
    </Documento>
  );
}
