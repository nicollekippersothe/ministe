import type { MetadataRoute } from "next";
import { urlBase } from "@/lib/site";

/**
 * O mapa das páginas públicas do produto (a tela inicial, o preço e os dois
 * documentos legais). As páginas dos negócios têm endereço próprio e entram na
 * busca pela prioridade delas, não daqui; este mapa é do site do Entrais.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const agora = new Date();
  const paginas: { caminho: string; prioridade: number }[] = [
    { caminho: "", prioridade: 1 },
    { caminho: "/precos", prioridade: 0.8 },
    { caminho: "/termos", prioridade: 0.3 },
    { caminho: "/privacidade", prioridade: 0.3 },
  ];

  return paginas.map(({ caminho, prioridade }) => ({
    url: `${urlBase}${caminho}`,
    lastModified: agora,
    changeFrequency: "weekly",
    priority: prioridade,
  }));
}
