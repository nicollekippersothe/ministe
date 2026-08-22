import { IconeRelogio } from "./Icones";
import { SeloHorario } from "./SeloHorario";
import {
  dadosSelo,
  diaCivilDe,
  DIAS_LONGO,
  estadoAgora,
  montarJanela,
  porDiaSemana,
} from "@/lib/horarios";
import type { Negocio } from "@/lib/tipos";

/**
 * O servidor ja escreve o estado certo no HTML, entao a pagina esta correta
 * mesmo sem JavaScript e nao pisca ao carregar. O script abaixo so recalcula,
 * porque a pagina fica em cache e o HTML envelhece.
 */
const SCRIPT = `!function(){var e=document.getElementById("selo");if(!e)return;var d;try{d=JSON.parse(document.getElementById("selo-dados").textContent)}catch(_){return}
var t=e.querySelector("[data-t]"),u=e.querySelector("[data-u]"),m=Date.now(),s=m/1000,h=Math.floor((m+d.o)/864e5),a=null,p=null,i,x;
for(i=0;i<d.s.length;i++){x=d.s[i];if(s>=x[0]&&s<x[1])a=x;else if(!p&&x[0]>s)p=x}
if(a){e.setAttribute("data-aberto","1");t.textContent="Aberto";u.textContent="até "+a[4]}
else{e.setAttribute("data-aberto","0");t.textContent="Fechado";u.textContent=p?"abre "+(p[2]<=h?"":p[2]===h+1?"amanhã ":p[5]+" ")+p[3]:""}
var r=document.querySelectorAll("[data-dia]"),w=(h+4)%7;for(i=0;i<r.length;i++)r[i].toggleAttribute("data-hoje",+r[i].getAttribute("data-dia")===w)}();`;

const ORDEM_SEMANA = [1, 2, 3, 4, 5, 6, 0];

export function Horarios({ negocio }: { negocio: Negocio }) {
  if (negocio.horarios.length === 0) return null;

  const agora = Date.now();
  const janela = montarJanela(negocio.horarios, negocio.fuso, agora);
  const estado = estadoAgora(janela, agora, diaCivilDe(agora, negocio.fuso));
  const dados = JSON.stringify(dadosSelo(janela, negocio.fuso, agora)).replace(
    /</g,
    "\\u003c",
  );
  const semana = porDiaSemana(negocio.horarios);

  return (
    <div className="px-5 py-6">
      <SeloHorario estado={estado} id="selo" />

      <details className="group mt-3">
        {/* Alvo de 44, pelo mesmo motivo do botão do catálogo: quem abre isto
            está no celular, decidindo se dá tempo de ir hoje. */}
        <summary className="-mx-2 inline-flex min-h-11 cursor-pointer list-none items-center gap-2 px-2 text-sm text-suave hover:text-texto">
          <IconeRelogio className="h-4 w-4" />
          Horários da semana
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>

        <ul className="mt-3 space-y-1.5 text-sm">
          {ORDEM_SEMANA.map((dia) => {
            const intervalos = semana[dia];
            return (
              <li
                key={dia}
                data-dia={dia}
                className="flex items-start justify-between gap-4 text-suave"
              >
                <span>{DIAS_LONGO[dia]}</span>
                <span className="text-right tabular-nums">
                  {intervalos.length === 0
                    ? "Fechado"
                    : intervalos.map((i) => (
                        <span key={`${i.abre}-${i.fecha}`} className="block">
                          {i.abre} às {i.fecha}
                        </span>
                      ))}
                </span>
              </li>
            );
          })}
        </ul>
      </details>

      <script
        id="selo-dados"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: dados }}
      />
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </div>
  );
}
