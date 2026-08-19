import type { DiaContado } from "@/lib/numeros";
import { pico } from "@/lib/numeros";

/**
 * O gráfico de barras dos números, em CSS puro.
 *
 * Sem biblioteca de gráfico. São `div` com altura em porcentagem, e noventa
 * dias num celular de 375px dão barra de três pixels, o que ainda lê como
 * forma. Uma biblioteca traria a própria árvore de dependências e o próprio
 * calendário de atualização de segurança para desenhar retângulos.
 *
 * **A acessibilidade é o que decide o desenho, e não o visual.** Este gráfico
 * carrega o dado, e não é enfeite: quem usa leitor de tela precisa dos números,
 * e não de uma descrição vaga do formato. Então as barras vão `aria-hidden` e
 * ao lado vai uma tabela de verdade, escondida só visualmente, com um dia por
 * linha. O leitor de tela recebe uma tabela navegável, com cabeçalho, em vez de
 * uma pilha de caixas sem nome.
 *
 * A alternativa comum, um `role="img"` com `aria-label` resumindo, entrega
 * "gráfico de visitas dos últimos 30 dias" e mais nada. Isso é descrever a
 * moldura e esconder o quadro.
 */

const ROTULOS = {
  visitas: "Visitas",
  whatsapp: "Cliques no WhatsApp",
  acao: "Cliques nos outros botões",
} as const;

export type Faixa = keyof typeof ROTULOS;

export function Barras({
  serie,
  faixas,
  titulo,
}: {
  serie: DiaContado[];
  /** Quais tipos desenhar, na ordem. */
  faixas: Faixa[];
  /** Vira o `caption` da tabela escondida, então descreve o período. */
  titulo: string;
}) {
  const maior = pico(serie);
  const primeiro = serie[0];
  const ultimo = serie[serie.length - 1];

  return (
    <div>
      <div
        aria-hidden
        className="flex h-32 items-end gap-px rounded-xl border border-borda bg-superficie p-3"
      >
        {serie.map((dia) => (
          <div key={dia.dia} className="flex h-full flex-1 items-end gap-px">
            {faixas.map((faixa) => (
              <div
                key={faixa}
                className={`min-h-px flex-1 rounded-t-[2px] ${
                  faixa === "visitas"
                    ? "bg-destaque/70"
                    : faixa === "whatsapp"
                      ? "bg-zap/70"
                      : "bg-suave/50"
                }`}
                style={{ height: `${(dia[faixa] / maior) * 100}%` }}
              />
            ))}
          </div>
        ))}
      </div>

      {primeiro && ultimo ? (
        <p aria-hidden className="mt-2 flex justify-between text-xs text-suave">
          <span>{diaCurto(primeiro.dia)}</span>
          <span>{diaCurto(ultimo.dia)}</span>
        </p>
      ) : null}

      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Dia</th>
            {faixas.map((f) => (
              <th key={f} scope="col">
                {ROTULOS[f]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {serie.map((dia) => (
            <tr key={dia.dia}>
              <th scope="row">{diaPorExtenso(dia.dia)}</th>
              {faixas.map((f) => (
                <td key={f}>{dia[f]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * A legenda de cores, que só existe quando há mais de uma faixa.
 *
 * Cor sozinha nunca é a única informação: cada cor vem com o nome escrito ao
 * lado, que é o que a regra de contraste do projeto pede.
 */
export function Legenda({ faixas }: { faixas: Faixa[] }) {
  if (faixas.length < 2) return null;

  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-suave">
      {faixas.map((f) => (
        <li key={f} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={`h-2.5 w-2.5 rounded-sm ${
              f === "visitas"
                ? "bg-destaque/70"
                : f === "whatsapp"
                  ? "bg-zap/70"
                  : "bg-suave/50"
            }`}
          />
          {ROTULOS[f]}
        </li>
      ))}
    </ul>
  );
}

/** "13/08", para as pontas do eixo. */
function diaCurto(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

/** "13 de agosto", para quem ouve a tabela. */
function diaPorExtenso(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}
