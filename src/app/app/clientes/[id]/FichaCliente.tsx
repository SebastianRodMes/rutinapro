"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fechaCorta, hoyISO, type Cliente } from "@/lib/tipos";

type ProgramaResumen = {
  id: string;
  nombre: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  dias: { count: number }[];
};

export function FichaCliente({ cliente, programas }: { cliente: Cliente; programas: ProgramaResumen[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: cliente.nombre,
    objetivo: cliente.objetivo ?? "",
    telefono: cliente.telefono ?? "",
    notas: cliente.notas ?? "",
  });
  const [estado, setEstado] = useState<"" | "guardando" | "guardado" | "error">("");
  const hoy = hoyISO();

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("guardando");
    const { error } = await createClient()
      .from("clientes")
      .update({
        nombre: form.nombre.trim(),
        objetivo: form.objetivo.trim() || null,
        telefono: form.telefono.trim() || null,
        notas: form.notas.trim() || null,
      })
      .eq("id", cliente.id);
    setEstado(error ? "error" : "guardado");
    router.refresh();
  }

  async function eliminar() {
    if (!confirm(`¿Eliminar a ${cliente.nombre}? Sus rutinas quedan guardadas pero sin cliente asignado.`)) return;
    await createClient().from("clientes").delete().eq("id", cliente.id);
    router.push("/app/clientes");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="text-sm font-medium text-muted">
        <Link href="/app/clientes" className="underline">
          Clientes
        </Link>{" "}
        / {cliente.nombre}
      </div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="titulo text-4xl md:text-5xl">{cliente.nombre}</h1>
        <Link href={`/app/rutinas/nueva?cliente=${cliente.id}`} className="btn btn-lima">
          + Crear rutina
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <section className="tarjeta overflow-hidden lg:col-span-3">
          <div className="border-b border-borde px-5 py-4">
            <h2 className="titulo text-2xl">Rutinas</h2>
          </div>
          {programas.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">Todavía no tiene rutinas.</p>
          ) : (
            <ul>
              {programas.map((p) => {
                const vigente = !p.fecha_fin || p.fecha_fin >= hoy;
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 border-b border-[#EEF0EA] px-5 py-3.5 last:border-0">
                    <div className="min-w-0 flex-1 basis-48">
                      <div className="truncate font-semibold">{p.nombre}</div>
                      <div className="text-sm text-muted">
                        {fechaCorta(p.fecha_inicio)} → {fechaCorta(p.fecha_fin)} · {p.dias?.[0]?.count ?? 0} días
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[13px] font-semibold ${
                        vigente ? "bg-lima text-carbon" : "bg-suave text-[#3A3F45]"
                      }`}
                    >
                      {vigente ? "Activa" : "Anterior"}
                    </span>
                    <Link href={`/app/rutinas/${p.id}`} className="btn btn-borde min-h-10 text-sm">
                      Abrir
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <form onSubmit={guardar} className="tarjeta flex flex-col gap-3.5 p-5 lg:col-span-2">
          <h2 className="titulo text-2xl">Datos</h2>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-muted">Nombre</span>
            <input className="campo" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-muted">Objetivo</span>
            <input className="campo" value={form.objetivo} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} />
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
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-muted">Notas (lesiones, horarios…)</span>
            <textarea className="campo" rows={3} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-oscuro" disabled={estado === "guardando"}>
              {estado === "guardando" ? "Guardando…" : "Guardar"}
            </button>
            {estado === "guardado" && <span className="text-sm font-semibold text-lima-oscuro">Guardado</span>}
            {estado === "error" && <span className="text-sm font-semibold text-alerta">No se pudo guardar</span>}
            <button type="button" onClick={eliminar} className="ml-auto text-sm font-semibold text-alerta underline">
              Eliminar cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
