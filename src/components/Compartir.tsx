"use client";

import { useEffect, useState } from "react";
import { fechaCorta, telefonoWhatsApp } from "@/lib/tipos";

export function Compartir({
  abierto,
  onCerrar,
  url,
  cliente,
  telefono,
  fechaInicio,
  fechaFin,
  onDescargar,
  descargando,
  resumen,
}: {
  abierto: boolean;
  onCerrar: () => void;
  url: string;
  cliente: string | null;
  telefono: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  onDescargar: () => void;
  descargando: boolean;
  resumen: string;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const nombre = cliente?.split(" ")[0] ?? "";
  const rango = fechaInicio && fechaFin ? ` (${fechaCorta(fechaInicio, false)} – ${fechaCorta(fechaFin, false)})` : "";
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!abierto) return;
    setMensaje(
      `Hola${nombre ? ` ${nombre}` : ""}, aquí está tu rutina nueva${rango}. Ábrela desde el celular y marca tus series y pesos: ${url}`
    );
    import("qrcode").then((QR) => QR.toDataURL(url, { margin: 1, width: 360 }).then(setQr));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, url]);

  useEffect(() => {
    if (!abierto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const tel = telefonoWhatsApp(telefono);
  const waUrl = `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`;

  async function copiar() {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-carbon/55 md:items-center" onClick={onCerrar}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Compartir rutina"
        className="flex max-h-[92vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-[22px] bg-white px-5 pb-6 pt-3 md:rounded-[22px] md:pt-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-borde-2 md:hidden" />
        <div className="flex items-center justify-between">
          <h2 className="titulo text-3xl">Compartir rutina</h2>
          <button onClick={onCerrar} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-fondo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-fondo p-3">
          <div className="flex h-[54px] w-11 shrink-0 flex-col justify-end rounded-md bg-carbon p-1.5">
            <div className="h-1 rounded-sm bg-lima" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">Rutina de {cliente || "tu cliente"}</div>
            <div className="text-[13px] text-muted">{resumen}</div>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-muted">Mensaje{cliente ? ` para ${nombre}` : ""}</span>
          <textarea
            className="campo rounded-[14px] rounded-bl-sm bg-[#E7F7D4] text-sm leading-relaxed"
            rows={4}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
          />
        </label>

        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-lima min-h-[52px] text-base">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" />
          </svg>
          Enviar por WhatsApp
        </a>
        {!tel && (
          <p className="-mt-2 text-[13px] text-muted">
            Este cliente no tiene WhatsApp guardado: se abrirá WhatsApp para que elijas el contacto.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={copiar} className="btn btn-borde min-h-12">
            {copiado ? "¡Copiado!" : "Copiar link"}
          </button>
          <button onClick={onDescargar} disabled={descargando} className="btn btn-borde min-h-12">
            {descargando ? "Generando…" : "Descargar PDF"}
          </button>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-borde p-3">
          <div className="flex h-[96px] w-[96px] shrink-0 items-center justify-center rounded-lg border border-borde bg-white p-1">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="Código QR del link de la rutina" className="h-full w-full" />
            ) : (
              <span className="text-xs text-muted">QR…</span>
            )}
          </div>
          <div>
            <div className="font-bold">¿Está aquí en el gym?</div>
            <div className="text-sm leading-snug text-muted">
              Que escanee el código y la rutina se le abre en el celular, sin instalar nada.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
