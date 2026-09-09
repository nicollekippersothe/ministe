import type { MetadataRoute } from "next";
import { urlBase } from "@/lib/site";

/**
 * O rastreamento, e a trava do preview.
 *
 * O deploy de preview da Vercel tem endereço próprio e indexável. Deixado
 * aberto, ele disputa posição com o domínio oficial e vaza rascunho para a
 * busca. Só produção libera o rastreamento; qualquer outro ambiente recusa
 * tudo. `VERCEL_ENV` é `production`, `preview` ou `development`; na máquina ele
 * não existe, e aí vale como produção para o `robots.txt` local fazer sentido.
 *
 * O painel, o cadastro e as rotas de máquina ficam de fora mesmo em produção:
 * são do dono logado, não da busca.
 */
const producao =
  !process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production";

export default function robots(): MetadataRoute.Robots {
  if (!producao) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/painel", "/criar", "/auth", "/api"],
    },
    sitemap: `${urlBase}/sitemap.xml`,
    host: urlBase,
  };
}
