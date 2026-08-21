import type { NextConfig } from "next";

/**
 * O host do Supabase, tirado da mesma variável que o resto do produto usa.
 *
 * O otimizador de imagem do Next recusa host que não esteja nesta lista, e a
 * recusa aparece só em produção, com a imagem que a pessoa acabou de enviar
 * saindo quebrada na página dela. Ler da variável em vez de escrever o host à
 * mão é o que mantém isto certo no dia em que o projeto do Supabase mudar.
 */
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const hostDoSupabase = supabase === "" ? null : new URL(supabase).hostname;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: hostDoSupabase
      ? [
          {
            protocol: "https",
            hostname: hostDoSupabase,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
