"use client";

import type { DatosPDF } from "./RutinaPDF";

/** Genera el PDF en el navegador. Se carga bajo demanda para no inflar el bundle. */
export async function generarPDF(datos: Omit<DatosPDF, "qrDataUrl">, urlCompartir: string | null): Promise<Blob> {
  const [{ pdf }, { RutinaPDF }, QR] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./RutinaPDF"),
    import("qrcode"),
  ]);
  const qrDataUrl = urlCompartir ? await QR.toDataURL(urlCompartir, { margin: 1, width: 300 }) : null;
  return pdf(RutinaPDF({ d: { ...datos, qrDataUrl } })).toBlob();
}

export function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
