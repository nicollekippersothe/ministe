import type { Metadata } from "next";
import { Artigo, Documento } from "@/componentes/Documento";
import { NOME_PRODUTO } from "@/lib/marca";
import { CONTATO_SUPORTE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Termos de uso, ${NOME_PRODUTO}`,
  description:
    "As regras de uso do serviço, os planos, a cobrança e o cancelamento.",
};

/**
 * Termos de uso.
 *
 * A seção de cobrança precisa bater, palavra por palavra, com o que o código
 * faz em lib/pagamento e no gatilho protege_cobranca. Quando o preço, o ciclo
 * ou a regra de devolução mudarem no código, mudam aqui no mesmo commit.
 *
 * O texto diz o que é permitido e o que faz a página sair do ar. A regra de
 * escrita sem palavra negativa vale para tela de produto, e aqui a precisão
 * vale mais: um termo que evita dizer "recusamos" não protege ninguém, nem a
 * gente nem o cliente.
 */
export default function Termos() {
  return (
    <Documento
      titulo="Termos de uso"
      resumo={`Estas são as regras do ${NOME_PRODUTO}. Ao criar uma página você concorda com elas.`}
      atualizadoEm="2026-08-16"
    >
      <Artigo titulo="1. O que o serviço faz">
        <p>
          O {NOME_PRODUTO} monta e hospeda uma página pública para o seu
          negócio, com endereço, horário, catálogo e botões de contato. Você
          preenche os dados pelo painel e a página fica no ar num endereço
          próprio.
        </p>
      </Artigo>

      <Artigo titulo="2. Sua conta">
        <p>
          Você começa a montar a página numa conta provisória, sem cadastro. Para
          publicar, entre com sua Conta do Google: é ela que passa a ser a dona
          da página, e o trabalho já feito continua onde está.
        </p>
        <p>
          Cada conta responde pelo que a sua página publica. Mantenha o acesso ao
          seu e-mail em dia, porque é por ele que você volta ao painel.
        </p>
      </Artigo>

      <Artigo titulo="3. Planos e preços">
        <p>
          O plano gratuito publica a página, com limites de catálogo, fotos e
          links, a letra padrão e a assinatura do {NOME_PRODUTO} no rodapé.
        </p>
        <p>
          O plano pago custa R$ 19,90 por mês ou R$ 179 por ano. Ele abre a
          escolha da letra, os números completos de visitas e cliques, limites
          maiores e o rodapé sem a nossa assinatura. Os valores valem para novas
          assinaturas e para as renovações das assinaturas em vigor, e qualquer
          reajuste é avisado com trinta dias de antecedência.
        </p>
      </Artigo>

      <Artigo titulo="4. Teste de sete dias">
        <p>
          Quem assina com cartão de crédito usa o plano pago por sete dias antes
          da primeira cobrança. O cartão é cadastrado no começo e a primeira
          cobrança acontece no oitavo dia. Cancelando dentro dos sete dias, o
          cartão permanece sem cobrança alguma.
        </p>
        <p>
          Pagamentos por Pix e por cartão de débito compram um período à vista, e
          já entram no plano pago no momento da aprovação.
        </p>
      </Artigo>

      <Artigo titulo="5. Cobrança e renovação">
        <p>
          No cartão de crédito, a renovação é automática, no mesmo ciclo
          escolhido, até que você cancele. O processamento é feito pelo Mercado
          Pago, e os dados do seu cartão são digitados em campos dele: eles vão
          direto para o Mercado Pago e o {NOME_PRODUTO} recebe apenas a
          confirmação e os quatro últimos dígitos.
        </p>
        <p>
          No Pix e no cartão de débito, cada período é comprado separadamente. O
          painel avisa quando a data está próxima, e a renovação é feita por
          você.
        </p>
      </Artigo>

      <Artigo titulo="6. Cancelamento">
        <p>
          Você cancela pelo painel, na tela do plano, a qualquer momento e sem
          precisar falar com ninguém. O cancelamento encerra as próximas
          cobranças e o plano pago continua valendo até o fim do período que já
          está pago.
        </p>
      </Artigo>

      <Artigo titulo="7. Direito de arrependimento">
        <p>
          O artigo 49 do Código de Defesa do Consumidor dá sete dias corridos
          para desistir de uma compra feita pela internet, com devolução
          integral do valor.
        </p>
        <p>
          No plano mensal, o teste de sete dias já cobre esse prazo, porque a
          primeira cobrança acontece depois dele. No plano anual, o cancelamento
          pedido em até sete dias do pagamento devolve o valor integral. Depois
          desse prazo, o plano segue valendo até o fim do período pago.
        </p>
      </Artigo>

      <Artigo titulo="8. Pagamento que volta do banco">
        <p>
          Quando uma renovação no cartão volta do banco, a página permanece no ar
          por cinco dias enquanto o Mercado Pago tenta de novo. O painel mostra o
          que está acontecendo e permite trocar o cartão. Passado esse prazo sem
          uma cobrança aprovada, a página passa a valer com os recursos do plano
          gratuito.
        </p>
      </Artigo>

      <Artigo titulo="9. Voltar para o plano gratuito">
        <p>
          Tudo o que você cadastrou permanece salvo. Os itens do catálogo, as
          fotos e os links continuam lá, e a página continua no ar. O que muda são
          os recursos: a letra volta a ser a padrão, a assinatura do{" "}
          {NOME_PRODUTO} volta ao rodapé, os números completos ficam guardados
          para quando você assinar de novo, e os limites do plano gratuito passam
          a valer para o que você acrescentar dali em diante.
        </p>
      </Artigo>

      <Artigo titulo="10. Uso do serviço">
        <p>
          A página é para divulgar um negócio de verdade, com informações
          verdadeiras sobre ele.
        </p>
        <p>
          Fica proibido usar o serviço para se passar por instituição financeira,
          por órgão público ou pelo próprio {NOME_PRODUTO}; para cobrar,
          intermediar pagamento ou pedir dados bancários, senha ou código de
          verificação de terceiros; para divulgar produto de venda proibida; e
          para publicar conteúdo que viole direito de outra pessoa.
        </p>
        <p>
          Endereços que soem como banco, cobrança ou atendimento oficial são
          barrados no cadastro, e toda página pública traz um link de denúncia no
          rodapé, inclusive as pagas.
        </p>
      </Artigo>

      <Artigo titulo="11. Suspensão">
        <p>
          Uma página que descumpra o item 10 pode ser tirada do ar, com aviso ao
          dono no e-mail da conta. Em caso de suspeita de golpe em andamento, a
          retirada acontece na hora e o aviso vem em seguida, porque o prejuízo
          de quem clica é imediato. Os dados permanecem guardados, e a página
          volta ao ar quando a questão for resolvida.
        </p>
        <p>
          Assinatura ativa em página suspensa é cancelada e o período pago que
          restar é devolvido.
        </p>
      </Artigo>

      <Artigo titulo="12. O conteúdo é seu">
        <p>
          Os textos, as fotos e as informações que você publica continuam seus.
          Você nos autoriza a exibi-los na sua página pública e nas prévias de
          link, que é o que o serviço faz. Ao encerrar a conta, a página sai do ar
          e os dados são apagados.
        </p>
      </Artigo>

      <Artigo titulo="13. Disponibilidade">
        <p>
          Trabalhamos para manter as páginas no ar o tempo todo, e cuidamos disso
          com atenção. Ainda assim, o serviço depende de terceiros como
          hospedagem e provedores de rede, e pode haver interrupção. Nossa
          responsabilidade por qualquer prejuízo fica limitada ao valor pago nos
          últimos doze meses.
        </p>
      </Artigo>

      <Artigo titulo="14. Mudanças nestes termos">
        <p>
          Quando estes termos mudarem, o aviso vem no painel e no e-mail da conta
          com trinta dias de antecedência. Continuar usando o serviço depois
          disso significa concordar com a versão nova. Se preferir sair, o
          cancelamento devolve o valor proporcional ao período que restava.
        </p>
      </Artigo>

      <Artigo titulo="15. Lei e foro">
        <p>
          Estes termos seguem a lei brasileira. Fica eleito o foro do domicílio
          do consumidor para resolver qualquer questão, conforme o Código de
          Defesa do Consumidor.
        </p>
        {CONTATO_SUPORTE ? (
          <p>
            Dúvidas sobre estes termos:{" "}
            <a
              href={`mailto:${CONTATO_SUPORTE}`}
              className="font-medium text-destaque underline-offset-4 hover:underline"
            >
              {CONTATO_SUPORTE}
            </a>
            .
          </p>
        ) : null}
      </Artigo>
    </Documento>
  );
}
