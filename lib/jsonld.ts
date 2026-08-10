import { telefoneE164 } from "./formato";
import { porDiaSemana } from "./horarios";
import type { Negocio } from "./tipos";

const DIAS_SCHEMA = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * LocalBusiness do schema.org.
 *
 * Regra do projeto: campo vazio nao entra. Nada de string vazia nem de
 * placeholder, porque dado inventado no JSON-LD e pior que JSON-LD ausente.
 */
export function localBusiness(negocio: Negocio, urlBase: string) {
  const url = `${urlBase}/${negocio.slug}`;

  const endereco: Record<string, string> = { "@type": "PostalAddress" };
  if (negocio.endereco) endereco.streetAddress = negocio.endereco;
  if (negocio.cidade) endereco.addressLocality = negocio.cidade;
  if (negocio.estado) endereco.addressRegion = negocio.estado;
  if (negocio.cep) endereco.postalCode = negocio.cep;
  endereco.addressCountry = "BR";

  const horarios = porDiaSemana(negocio.horarios).flatMap((intervalos, dia) =>
    intervalos.map((i) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${DIAS_SCHEMA[dia]}`,
      opens: i.abre,
      closes: i.fecha,
    })),
  );

  const telefone = negocio.telefone ?? negocio.whatsapp;
  const imagens = [negocio.capa?.url, negocio.logo?.url]
    .filter((x): x is string => Boolean(x))
    .map((x) => `${urlBase}${x}`);

  const precos = negocio.itens
    .filter((i) => i.ativo && i.precoCentavos !== null)
    .map((i) => i.precoCentavos as number);

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: negocio.nome,
    url,
    ...(negocio.frase ? { description: negocio.frase } : {}),
    ...(imagens.length ? { image: imagens } : {}),
    ...(negocio.logo ? { logo: `${urlBase}${negocio.logo.url}` } : {}),
    ...(telefone ? { telephone: telefoneE164(telefone) } : {}),
    ...(negocio.endereco || negocio.cidade ? { address: endereco } : {}),
    ...(negocio.mapsUrl ? { hasMap: negocio.mapsUrl } : {}),
    ...(horarios.length ? { openingHoursSpecification: horarios } : {}),
    ...(negocio.mostrarPrecos && precos.length
      ? {
          priceRange: `R$ ${(Math.min(...precos) / 100).toFixed(0)} a R$ ${(
            Math.max(...precos) / 100
          ).toFixed(0)}`,
        }
      : {}),
    ...(negocio.links.length
      ? { sameAs: negocio.links.map((l) => l.url) }
      : {}),
  };
}
