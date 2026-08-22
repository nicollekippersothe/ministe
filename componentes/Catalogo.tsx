import Image from "next/image";
import { IconeWhatsapp } from "./Icones";
import { linkWhatsapp, mensagemDoItem, preco } from "@/lib/formato";
import type { Item, Negocio } from "@/lib/tipos";

function Fotos({ item }: { item: Item }) {
  if (item.fotos.length === 0) return null;

  if (item.fotos.length === 1) {
    const foto = item.fotos[0];
    return (
      <div className="overflow-hidden rounded-xl bg-borda">
        <Image
          src={foto.url}
          alt={foto.alt}
          width={foto.largura}
          height={foto.altura}
          sizes="(max-width: 640px) 88vw, 250px"
          className="aspect-square w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="faixa -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {item.fotos.map((foto, i) => (
          <div
            key={foto.url}
            className="w-[91%] shrink-0 overflow-hidden rounded-xl bg-borda"
          >
            <Image
              src={foto.url}
              alt={i === 0 ? foto.alt : `${foto.alt}, foto ${i + 1}`}
              width={foto.largura}
              height={foto.altura}
              sizes="(max-width: 640px) 80vw, 230px"
              className="aspect-square w-full object-cover"
            />
          </div>
        ))}
      </div>
      <p className="sr-only">
        {item.fotos.length} fotos, arraste para o lado para ver as outras.
      </p>
    </div>
  );
}

function Cartao({ item, negocio }: { item: Item; negocio: Negocio }) {
  const mensagem = mensagemDoItem(negocio.mensagemItem, item.titulo);

  return (
    <li className="flex flex-col gap-2.5">
      <Fotos item={item} />

      <div className="flex flex-col gap-1">
        <h3 className="text-[0.95rem] leading-snug font-semibold text-texto text-pretty">
          {item.titulo}
        </h3>

        {item.descricao ? (
          <p className="text-sm leading-relaxed text-suave text-pretty">
            {item.descricao}
          </p>
        ) : null}

        {negocio.mostrarPrecos && item.precoCentavos !== null ? (
          <p className="mt-0.5 text-[0.95rem] font-semibold tabular-nums text-texto">
            {preco(item.precoCentavos)}
          </p>
        ) : null}

        {negocio.whatsapp && mensagem ? (
          <a
            href={linkWhatsapp(negocio.whatsapp, mensagem)}
            target="_blank"
            rel="noopener noreferrer"
            /*
             * O respiro vem de dentro do alvo, e a margem negativa devolve o
             * alinhamento. Este é o botão que converte a página inteira: ele
             * fica no celular de quem está decidindo pedir, e com 20 pixels de
             * altura o dedo erra e a pessoa desiste. Medido em 169 por 20
             * antes desta linha.
             */
            className="-mx-2 mt-0.5 inline-flex min-h-11 w-fit items-center gap-1.5 px-2 text-sm font-medium text-zap hover:text-zap-forte"
          >
            <IconeWhatsapp className="h-4 w-4" />
            Pedir pelo WhatsApp
            <span className="sr-only">, {item.titulo}, abre em outra aba</span>
          </a>
        ) : null}
      </div>
    </li>
  );
}

export function Catalogo({ negocio }: { negocio: Negocio }) {
  const itens = negocio.itens.filter((i) => i.ativo);
  if (itens.length === 0) return null;

  return (
    <ul className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-8">
      {itens.map((item) => (
        <Cartao key={item.id} item={item} negocio={negocio} />
      ))}
    </ul>
  );
}
