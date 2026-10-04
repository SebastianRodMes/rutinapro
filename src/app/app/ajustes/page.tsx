"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const COLORES = ["#C6F432", "#38BDF8", "#FB923C", "#F472B6", "#A78BFA", "#FACC15"];

export default function AjustesPage() {
  const [form, setForm] = useState({ nombre: "", telefono_whatsapp: "", color_marca: "#C6F432" });
  const [id, setId] = useState<string | null>(null);
  const [estado, setEstado] = useState<"" | "cargando" | "guardando" | "guardado" | "error">("cargando");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setId(data.user.id);
      const { data: c } = await supabase
        .from("coaches")
        .select("nombre, telefono_whatsapp, color_marca")
        .eq("id", data.user.id)
        .maybeSingle();
      if (c) setForm({ nombre: c.nombre ?? "", telefono_whatsapp: c.telefono_whatsapp ?? "", color_marca: c.color_marca });
      setEstado("");
    });
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setEstado("guardando");
    const { error } = await createClient()
      .from("coaches")
      .update({
        nombre: form.nombre.trim(),
        telefono_whatsapp: form.telefono_whatsapp.trim() || null,
        color_marca: form.color_marca,
      })
      .eq("id", id);
    setEstado(error ? "error" : "guardado");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="titulo text-4xl md:text-5xl">Ajustes</h1>
      <form onSubmit={guardar} className="tarjeta flex flex-col gap-4 p-5">
        <h2 className="titulo text-2xl">Tu marca en el PDF</h2>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-muted">Nombre que sale en las rutinas</span>
          <input className="campo" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-muted">Tu WhatsApp (sale al pie del PDF)</span>
          <input
            className="campo"
            type="tel"
            placeholder="+506 8888 8888"
            value={form.telefono_whatsapp}
            onChange={(e) => setForm({ ...form, telefono_whatsapp: e.target.value })}
          />
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-semibold text-muted">Color de acento</legend>
          <div className="flex flex-wrap items-center gap-2">
            {COLORES.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                aria-pressed={form.color_marca.toLowerCase() === c.toLowerCase()}
                onClick={() => setForm({ ...form, color_marca: c })}
                className={`h-11 w-11 rounded-full border-2 ${
                  form.color_marca.toLowerCase() === c.toLowerCase() ? "border-carbon ring-2 ring-carbon ring-offset-2" : "border-white"
                }`}
                style={{ background: c }}
              />
            ))}
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="color"
                className="h-11 w-11 cursor-pointer rounded-full border border-borde-2"
                value={form.color_marca}
                onChange={(e) => setForm({ ...form, color_marca: e.target.value })}
              />
              Otro
            </label>
          </div>
        </fieldset>
        <div className="flex items-center gap-3">
          <button className="btn btn-lima" disabled={estado === "guardando" || estado === "cargando"}>
            {estado === "guardando" ? "Guardando…" : "Guardar"}
          </button>
          {estado === "guardado" && <span className="text-sm font-semibold text-lima-oscuro">Guardado</span>}
          {estado === "error" && <span className="text-sm font-semibold text-alerta">No se pudo guardar</span>}
        </div>
      </form>
    </div>
  );
}
