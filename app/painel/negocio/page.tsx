import Link from "next/link";
import { salvarBasico } from "../acoes";
import { Aviso } from "@/componentes/painel/Aviso";
import {
  AreaTexto,
  BarraSalvar,
  Botao,
  Escolha,
  Grupo,
  Marcar,
  Texto,
} from "@/componentes/painel/Campos";
import { doDono } from "@/lib/dados";
import { telefoneVisivel } from "@/lib/formato";

import { exigirLogin } from "@/app/painel/vitrine";

export const dynamic = "force-dynamic";

const TITULOS_CATALOGO = [
  { valor: "Catálogo", rotulo: "Catálogo" },
  { valor: "Cardápio", rotulo: "Cardápio" },
  { valor: "Serviços", rotulo: "Serviços" },
  { valor: "Produtos", rotulo: "Produtos" },
  { valor: "Aulas e planos", rotulo: "Aulas e planos" },
  { valor: "Atendimentos", rotulo: "Atendimentos" },
];

const FUSOS = [
  { valor: "America/Sao_Paulo", rotulo: "Brasília (a maior parte do país)" },
  { valor: "America/Manaus", rotulo: "Manaus (AM, RR, RO, MT oeste)" },
  { valor: "America/Cuiaba", rotulo: "Cuiabá (MT)" },
  { valor: "America/Campo_Grande", rotulo: "Campo Grande (MS)" },
  { valor: "America/Rio_Branco", rotulo: "Rio Branco (AC)" },
  { valor: "America/Noronha", rotulo: "Fernando de Noronha" },
];

export default async function Informacoes({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string; erro?: string }>;
}) {
  exigirLogin();
  const [negocio, params] = await Promise.all([doDono(), searchParams]);

  return (
    <main className="mt-6">
      <Link href="/painel" className="text-sm text-suave">
        Voltar
      </Link>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-texto">
        Informações do negócio
      </h1>

      <Aviso salvo={params.salvo === "1"} erro={params.erro} />

      <form action={salvarBasico} className="mt-6 flex flex-col gap-8">
        <Grupo titulo="Sobre o negócio">
          <Texto
            id="nome"
            rotulo="Nome do negócio"
            valor={negocio.nome}
            required
            maxLength={80}
            autoComplete="organization"
          />
          <AreaTexto
            id="frase"
            rotulo="Uma frase curta"
            dica="Aparece abaixo do nome. Se ficar em branco, não é exibida."
            valor={negocio.frase}
            maxLength={160}
          />
        </Grupo>

        <Grupo titulo="WhatsApp e catálogo">
          <Texto
            id="whatsapp"
            rotulo="Número do WhatsApp"
            dica="Com DDD. Pode digitar com parênteses e traço."
            valor={negocio.whatsapp ? telefoneVisivel(negocio.whatsapp) : null}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
          />
          <AreaTexto
            id="mensagemPadrao"
            rotulo="Mensagem que já vem escrita"
            dica="É o que o cliente vê digitado quando toca no botão."
            valor={negocio.mensagemPadrao}
            maxLength={200}
          />
          <AreaTexto
            id="mensagemItem"
            rotulo="Mensagem dos itens"
            dica="Vale para todos os itens de uma vez. O {item} vira o nome do produto."
            valor={negocio.mensagemItem}
            maxLength={200}
          />
          <Escolha
            id="tituloCatalogo"
            rotulo="Nome dessa seção na página"
            dica="Nem todo negócio tem cardápio. Escolha o nome que faz sentido para o seu."
            valor={negocio.tituloCatalogo}
            opcoes={TITULOS_CATALOGO}
          />
          <Marcar
            id="mostrarPrecos"
            rotulo="Mostrar preços na página"
            dica="Desmarcado, nenhum preço aparece, mesmo nos itens que têm preço preenchido."
            marcado={negocio.mostrarPrecos}
          />
        </Grupo>

        <Grupo titulo="Endereço">
          <Texto
            id="endereco"
            rotulo="Rua, número e bairro"
            valor={negocio.endereco}
            maxLength={120}
            autoComplete="street-address"
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <Texto
                id="cidade"
                rotulo="Cidade"
                valor={negocio.cidade}
                maxLength={60}
              />
            </div>
            <div className="w-20">
              <Texto
                id="estado"
                rotulo="UF"
                valor={negocio.estado}
                maxLength={2}
                pattern="[A-Za-z]{2}"
              />
            </div>
          </div>
          <Texto
            id="cep"
            rotulo="CEP"
            valor={negocio.cep}
            inputMode="numeric"
            maxLength={9}
            autoComplete="postal-code"
          />
          <Texto
            id="mapsUrl"
            rotulo="Link do Google Maps"
            dica="Abra seu endereço no Maps, toque em compartilhar e cole aqui."
            valor={negocio.mapsUrl}
            type="url"
            inputMode="url"
          />
          <Escolha
            id="fuso"
            rotulo="Fuso horário"
            dica="Define a hora usada no selo de aberto e fechado."
            valor={negocio.fuso}
            opcoes={FUSOS}
          />
        </Grupo>

        <BarraSalvar>
          <Botao type="submit">Salvar</Botao>
        </BarraSalvar>
      </form>
    </main>
  );
}
