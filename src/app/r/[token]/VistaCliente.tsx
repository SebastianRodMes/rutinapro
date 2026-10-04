"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { diasEntre, fechaCorta, nombreArchivoPDF, type Ejercicio } from "@/lib/tipos";
import { descargarBlob, generarPDF } from "@/components/pdf/generar";
import { urlPublica } from "@/lib/url";

type EjercicioPublico = Ejercicio & { hechas: number[]; peso_hoy: number | null; ultimo_peso: number | null };

export type RutinaPublica = {
  id: string;
  nombre: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  notas: string | null;
  cliente: string | null;
  hoy: string;
  coach: { nombre: string; telefono: string | null; color: string };
  dias: { id: string; nombre: string; ejercicios: EjercicioPublico[] }[];
};

export function VistaCliente({ token, inicial }: { token: string; inicial: RutinaPublica }) {
  const [rutina, setRutina] = useState(inicial);
  const [diaIdx, setDiaIdx] = useState(() => {
    // abre el primer día con algo marcado hoy; si no, el primero
    const i = inicial.dias.findIndex((d) => d.ejercicios.some((e) => e.hechas.length > 0));
    return i >= 0 ? i : 0;
  });
  const [pesos, setPesos] = useState<Record<string, string>>(() =>
    Object.fromEntries(inicial.dias.flatMap((d) => d.ejercicios.map((e) => [e.id, e.peso_hoy != null ? String(e.peso_hoy) : ""])))
  );
  const [error, setError] = useState<string | null>(null);
  const [pdfCargando, setPdfCargando] = useState(false);

  const dia = rutina.dias[diaIdx];
  const nombre = rutina.cliente?.split(" ")[0] ?? "";

  const semana = useMemo(() => {
    if (!rutina.fecha_inicio || !rutina.fecha_fin) return null;
    const total = Math.max(1, Math.round((diasEntre(rutina.fecha_inicio, rutina.fecha_fin) + 1) / 7));
    const actual = Math.min(total, Math.max(1, Math.floor(diasEntre(rutina.fecha_inicio, rutina.hoy) / 7) + 1));
    return { actual, total };
  }, [rutina]);

  const completos = dia ? dia.ejercicios.filter((e) => e.series && e.hechas.length >= e.series).length : 0;
  const pct = dia && dia.ejercicios.length ? Math.round((completos / dia.ejercicios.length) * 100) : 0;

  function pesoNumero(id: string) {
    const v = parseFloat((pesos[id] ?? "").replace(",", "."));
    return Number.isFinite(v) ? v : null;
  }

  async function alternarSerie(ej: EjercicioPublico, serie: number) {
    const hecha = !ej.hechas.includes(serie);
    // optimista
    setRutina((r) => ({
      ...r,
      dias: r.dias.map((d) => ({
        ...d,
        ejercicios: d.ejercicios.map((e) =>
          e.id !== ej.id
            ? e
            : { ...e, hechas: hecha ? [...e.hechas, serie].sort((a, b) => a - b) : e.hechas.filter((s) => s !== serie) }
        ),
      })),
    }));
    const { error } = await createClient().rpc("registrar_serie", {
      p_token: token,
      p_ejercicio_id: ej.id,
      p_serie: serie,
      p_hecha: hecha,
      p_peso: pesoNumero(ej.id),
    });
    if (error) {
      setError("No se pudo guardar. Revisa tu conexión.");
      setTimeout(() => setError(null), 3000);
    }
  }

  async function guardarPeso(ej: EjercicioPublico) {
    const p = pesoNumero(ej.id);
    if (p == null || ej.hechas.length === 0) return;
    await createClient().rpc("registrar_peso", { p_token: token, p_ejercicio_id: ej.id, p_peso: p });
  }

  async function descargar() {
    setPdfCargando(true);
    try {
      const blob = await generarPDF(
        {
          programa: rutina.nombre,
          cliente: rutina.cliente,
          fechaInicio: rutina.fecha_inicio,
          fechaFin: rutina.fecha_fin,
          notas: rutina.notas,
          dias: rutina.dias,
          coach: rutina.coach,
        },
        `${urlPublica()}/r/${token}`
      );
      descargarBlob(blob, nombreArchivoPDF(rutina.cliente, rutina.nombre));
    } finally {
      setPdfCargando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col bg-fondo">
      <header className="flex flex-col gap-3.5 bg-carbon px-5 pb-5 pt-5 text-fondo">
        <div className="flex items-center justify-between">
          <div className="titulo text-lg tracking-wider">
            Rutina<span style={{ color: rutina.coach.color }}>Pro</span>
          </div>
          <button
            onClick={descargar}
            disabled={pdfCargando}
            className="flex min-h-10 items-center gap-2 rounded-[10px] border border-[#3A3F45] px-3 text-sm font-semibold"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 4v12M7 11l5 5 5-5M5 20h14" />
            </svg>
            {pdfCargando ? "Generando…" : "PDF"}
          </button>
        </div>
        <div>
          <h1 className="titulo text-4xl">Hola{nombre ? `, ${nombre}` : ""}</h1>
          <div className="mt-1 text-sm text-[#C9CCC4]">
            {rutina.nombre}
            {semana ? ` · Semana ${semana.actual} de ${semana.total}` : ""}
            {rutina.coach.nombre ? ` · Coach ${rutina.coach.nombre}` : ""}
          </div>
        </div>
        {dia && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[13px] font-semibold">
              <span>{dia.nombre} de hoy</span>
              <span style={{ color: rutina.coach.color }}>
                {completos} de {dia.ejercicios.length} ejercicios
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#33373C]">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: rutina.coach.color }} />
            </div>
          </div>
        )}
      </header>

      <div role="tablist" aria-label="Días" className="flex gap-2 overflow-x-auto px-4 py-3">
        {rutina.dias.map((d, i) => (
          <button
            key={d.id}
            role="tab"
            aria-selected={i === diaIdx}
            onClick={() => setDiaIdx(i)}
            className={`min-h-10 shrink-0 rounded-full border-[1.5px] px-3.5 font-semibold ${
              i === diaIdx ? "border-carbon bg-carbon text-fondo" : "border-borde-2 bg-white"
            }`}
          >
            {d.nombre}
          </button>
        ))}
      </div>

      <main className="flex flex-col gap-2.5 px-4 pb-10">
        {rutina.fecha_fin && rutina.fecha_fin < rutina.hoy && (
          <p className="rounded-xl bg-alerta-fondo px-4 py-3 text-sm font-semibold text-alerta">
            Esta rutina terminó el {fechaCorta(rutina.fecha_fin)}. Pídele a tu coach la nueva.
          </p>
        )}
        {dia?.ejercicios.map((e, i) => {
          const completo = !!e.series && e.hechas.length >= e.series;
          return (
            <article
              key={e.id}
              className={`flex flex-col gap-3 rounded-2xl bg-white p-3.5 ${completo ? "border-2 border-carbon" : "border border-borde"}`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted">
                    Ejercicio {i + 1}
                    {e.implemento ? ` · ${e.implemento}` : ""}
                  </div>
                  <h2 className="mt-0.5 text-lg font-bold leading-tight">{e.nombre}</h2>
                </div>
                {completo && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-carbon px-2 py-1 text-xs font-bold text-lima">
                    ✓ Listo
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 text-[13px] font-semibold">
                <span className="rounded-lg bg-fondo px-2 py-1">
                  {e.series ?? "—"} × {e.reps ?? "—"}
                </span>
                {e.rir != null && <span className="rounded-lg bg-fondo px-2 py-1">RIR {e.rir}</span>}
                {e.cadencia && <span className="rounded-lg bg-fondo px-2 py-1">Cadencia {e.cadencia}</span>}
                {e.descanso && <span className="rounded-lg bg-fondo px-2 py-1">Descanso {e.descanso}</span>}
                {e.metodologia && e.metodologia !== "Tradicional" && (
                  <span className="rounded-lg bg-suave px-2 py-1">{e.metodologia}</span>
                )}
              </div>
              {e.notas && <p className="text-sm text-[#3A3F45]">{e.notas}</p>}

              {!!e.series && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-muted">Toca cada serie al terminarla</span>
                  <div className="flex gap-1.5">
                    {Array.from({ length: e.series }, (_, k) => k + 1).map((s) => {
                      const hecha = e.hechas.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => alternarSerie(e, s)}
                          aria-pressed={hecha}
                          aria-label={`Serie ${s} ${hecha ? "completada" : "pendiente"}`}
                          className={`min-h-11 flex-1 rounded-[10px] text-base font-bold ${
                            hecha ? "border-[1.5px] border-carbon text-carbon" : "border-[1.5px] border-dashed border-[#9FA39A] bg-white text-muted"
                          }`}
                          style={hecha ? { background: rutina.coach.color } : undefined}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-end gap-2">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-xs font-bold text-muted">Peso usado (kg)</span>
                  <input
                    className="campo"
                    inputMode="decimal"
                    placeholder={e.ultimo_peso != null ? `La vez pasada: ${e.ultimo_peso}` : "Ej: 20"}
                    value={pesos[e.id] ?? ""}
                    onChange={(ev) => setPesos((p) => ({ ...p, [e.id]: ev.target.value }))}
                    onBlur={() => guardarPeso(e)}
                  />
                </label>
                {e.video_url && (
                  <a
                    href={e.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn min-h-11 border-[1.5px] border-carbon text-sm"
                  >
                    ▶ Técnica
                  </a>
                )}
              </div>
            </article>
          );
        })}
        {dia && dia.ejercicios.length === 0 && <p className="py-6 text-center text-muted">Este día no tiene ejercicios.</p>}

        {rutina.notas && (
          <section className="mt-2 rounded-2xl border border-borde bg-white p-4">
            <h2 className="titulo text-xl">Notas de tu coach</h2>
            <p className="mt-1.5 whitespace-pre-line text-[15px]">{rutina.notas}</p>
          </section>
        )}
        <details className="rounded-2xl border border-borde bg-white p-4 text-sm">
          <summary className="cursor-pointer font-semibold">¿Qué es RIR y cadencia?</summary>
          <p className="mt-2">
            <strong>RIR</strong> son las repeticiones que te deberían quedar en reserva al terminar la serie. RIR 2 = podrías hacer 2
            más; RIR 0 = al fallo.
          </p>
          <p className="mt-1.5">
            <strong>Cadencia 3-1-1</strong>: segundos para bajar el peso, pausa, y segundos para subirlo.
          </p>
        </details>
      </main>

      {error && (
        <div role="alert" className="fixed inset-x-4 bottom-4 mx-auto max-w-md rounded-xl bg-alerta px-4 py-3 text-center font-semibold text-white">
          {error}
        </div>
      )}
    </div>
  );
}
