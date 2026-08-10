/** Endereço base do site, usado no JSON-LD, no canonical e no Open Graph. */
export const urlBase = (
  process.env.NEXT_PUBLIC_URL_BASE ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");
