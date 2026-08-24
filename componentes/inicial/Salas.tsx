import Link from "next/link";
import { Cartela } from "@/componentes/inicial/Cartela";
import { Telefone } from "@/componentes/inicial/Telefone";
import { IconeSeta } from "@/componentes/Icones";
import type { Negocio } from "@/lib/tipos";

/**
 * As duas salas: quem expõe o próprio trabalho e quem tem porta na rua.
 *
 * Antes os dois públicos vinham amontoados numa promessa só, e cada um lia
 * metade dela como sendo de outra pessoa. Aqui cada um ganha uma sala, com o
 * nome do público na entrada, três coisas que só a página dele carrega, e a
 * página de um exemplo do ramo pendurada dentro.
 *
 * As salas têm tamanhos diferentes de propósito, e a decisão é do produto, e
 * não de gosto: quem está no centro da entrais é a profissional autônoma, que
 * hoje só tem uma lista de links. Quem tem loja com ponto na rua já aparece no
 * mapa. A sala maior é a de quem precisa mais, e ela vem primeiro na leitura
 * do celular.
 *
 * Nada aqui é desenho: o celular é o componente que roda na página do cliente,
 * com os dados do exemplo, calculados no servidor na hora.
 */

export type Sala = {
  publico: string;
  titulo: string;
  itens: string[];
  negocio: Negocio;
  tipo: string;
};

function Quadro({ sala, largo }: { sala: Sala; largo: boolean }) {
  return (
    <article
      className={`surge flex flex-col overflow-hidden rounded-3xl border border-borda bg-superficie ${
        largo ? "lg:col-span-3" : "lg:col-span-2"
      }`}
    >
      <div className="flex flex-col gap-6 px-6 pt-7 pb-8 sm:px-8 sm:pt-9">
        <div>
          <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-destaque uppercase">
            {sala.publico}
          </p>
          <h3 className="titulo mt-3 text-[1.7rem] leading-[1.05] text-balance text-texto sm:text-[2rem]">
            {sala.titulo}
          </h3>
        </div>

        <ul className="flex flex-col">
          {sala.itens.map((item) => (
            <li
              key={item}
              className="border-t border-borda py-3 text-[0.95rem] leading-snug text-suave first:border-t-0 first:pt-0 last:pb-0"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/*
        A janela que corta o celular embaixo.

        A página do exemplo é bem mais alta que este cartão, e mostrar ela
        inteira aqui empurraria o resto da tela inicial para longe. Cortada, a
        peça fica pendurada passando da borda, que é como quadro grande fica
        numa parede baixa, e o que aparece já é uma tela cheia de produto: capa,
        nome, frase e o selo de aberto agora. Quem quiser o resto abre a página,
        e o link fica logo abaixo.
      */}
      <div className="h-[17rem] overflow-hidden px-6 sm:px-8" aria-hidden>
        <Telefone negocio={sala.negocio} prioridade={false} leve />
      </div>

      <div className="mt-auto flex flex-col gap-4 px-6 pt-6 pb-7 sm:px-8">
        <Cartela negocio={sala.negocio} tipo={sala.tipo} />
        <Link
          href={`/${sala.negocio.slug}`}
          className="inline-flex items-center gap-2 self-start py-1 text-[0.95rem] font-semibold text-destaque underline-offset-4 hover:underline"
        >
          Abrir a página
          <IconeSeta className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export function Salas({ criador, loja }: { criador: Sala; loja: Sala }) {
  return (
    <div className="grid gap-5 lg:grid-cols-5 lg:items-start lg:gap-6">
      <Quadro sala={criador} largo />
      <Quadro sala={loja} largo={false} />
    </div>
  );
}
