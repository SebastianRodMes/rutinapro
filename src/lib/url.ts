/**
 * URL pública de la app para links y QR.
 * Usa el dominio de producción aunque el coach haya abierto un link de deployment
 * de Vercel (esos piden iniciar sesión en Vercel y el cliente no podría abrirlos).
 */
export function urlPublica() {
  const propia = process.env.NEXT_PUBLIC_SITE_URL;
  if (propia) return propia.replace(/\/$/, "");
  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return typeof window !== "undefined" ? window.location.origin : "";
}
