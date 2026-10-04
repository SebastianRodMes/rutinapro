"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { diasEntre, hoyISO, iniciales, type Cliente } from "@/lib/tipos";

export function ListaClientes({
  clientes,
  programas,
  abrirNuevo,
}: {
  clientes: Cliente[];
  programas: { cliente_id: string | null; fecha_fin: string | null }[];
  abrirNuevo: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [nuevo, setNuevo] = useState(abrirNuevo);
  const [form, setForm] = useState({ nombre: "", objetivo: "", telefono: "" });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hoy = hoyISO();

  const filtrados = useMemo(
    () => clientes.filter((c) => c.nombre.toLowerCase().includes(q.trim().toLowerCase())),
    [clientes, q]
  );

  function estado(id: string) {
    const p = programas.find((x) => x.cliente_id === id);
    if (!p) return { texto: "Sin rutina", clase: "text-muted" };
    if (p.fecha_fin && p.fecha_fin < hoy) return { texto: "Rutina vencida", clase: "text-alerta" };
    if (p.fecha_fin && diasEntre(hoy, p.fecha_fin) <= 7)
      return { texto: `Vence en ${diasEntre(hoy, p.fecha_fin)} días`, clase: "text-alerta" };
    return { texto: "Rutina activa", clase: "text-lima-oscuro" };
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    const { data, error } = await createClient()
      .from("clientes")
      .insert({
        nombre: form.nombre.trim(),
        objetivo: form.objetivo.trim() || null,
        telefono: form.telefono.trim() || null,
      })
      .select("id")
      .single();
    setGuardando(false);
    if (error) {
      setError("No se pudo guardar el cliente. Intenta de nuevo.");
      return;
    }
    setForm({ nombre: "", objetivo: "", telefono: "" });
    setNuevo(false);
    router.push(`/app/clientes/${data.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="titulo text-4xl md:text-5xl">Clientes</h1>
        <button className="btn btn-lima" onClick={() => setNuevo(true)}>
          + Nuevo cliente
        </button>
      </header>

      {nuevo && (
        <form onSubmit={crear} className="tarjeta flex flex-col gap-4 p-5">
          <h2 className="titulo text-2xl">Nuevo cliente</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-muted">Nombre *</span>
              <input
                className="campo"
                required
                autoFocus
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-muted">Objetivo</span>
              <input
                className="campo"
                placeholder="Hipertrofia, glúteo y pierna…"
                value={form.objetivo}
                onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-muted">WhatsApp</span>
              <input
                className="campo"
                type="tel"
                placeholder="8888 8888"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </label>
          </div>
          {error && <p className="text-sm font-medium text-alerta">{error}</p>}
          <div className="flex gap-2">
            <button className="btn btn-lima" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar cliente"}
            </button>
            <button type="button" className="btn btn-borde" onClick={() => setNuevo(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <label className="flex min-h-11 max-w-sm items-center gap-2 rounded-[10px] border border-borde bg-white px-3.5 text-muted">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          aria-label="Buscar cliente"
          placeholder="Buscar cliente"
          className="w-full bg-transparent text-carbon outline-none"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>

      {clientes.length === 0 ? (
        <p className="text-muted">Todavía no tienes clientes.</p>
      ) : (
        <div className="tarjeta overflow-hidden">
          <ul>
            {filtrados.map((c) => {
              const e = estado(c.id);
              return (
                <li key={c.id} className="border-b border-[#EEF0EA] last:border-0">
                  <Link href={`/app/clientes/${c.id}`} className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-[#FAFAF7]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-suave font-bold">
                      {iniciales(c.nombre)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{c.nombre}</div>
                      <div className="truncate text-sm text-muted">{c.objetivo || "Sin objetivo"}</div>
                    </div>
                    <span className={`text-[13px] font-semibold ${e.clase}`}>{e.texto}</span>
                  </Link>
                </li>
              );
            })}
            {filtrados.length === 0 && <li className="px-5 py-5 text-sm text-muted">Nadie con ese nombre.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
