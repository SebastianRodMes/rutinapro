"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DESCANSOS,
  METODOLOGIAS,
  RIRS,
  diasEntre,
  ejercicioVacio,
  hoyISO,
  nombreArchivoPDF,
  nuevoId,
  type Cliente,
  type Coach,
  type Dia,
  type Ejercicio,
  type EjercicioBiblioteca,
  type Programa,
} from "@/lib/tipos";
import { Compartir } from "@/components/Compartir";
import { descargarBlob, generarPDF } from "@/components/pdf/generar";

type Estado = "nuevo" | "sin-guardar" | "guardando" | "guardado" | "error";

const Icono = {
  arriba: <path d="m6 15 6-6 6 6" />,
  abajo: <path d="m6 9 6 6 6-6" />,
  copiar: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a1 1 0 0 1 1-1h10" />
    </>
  ),
  borrar: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  nota: <path d="M4 20h4L19 9l-4-4L4 16z" />,
};

function BotonIcono({
  label,
  icono,
  onClick,
  disabled,
  activo,
}: {
  label: string;
  icono: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  activo?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg disabled:opacity-30 ${
        activo ? "bg-suave text-carbon" : "text-muted hover:bg-suave hover:text-carbon"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icono}
      </svg>
    </button>
  );
}

const etiqueta = "text-[11px] font-bold uppercase tracking-wider text-muted xl:sr-only";
const celda = "flex flex-col gap-1";
const input = "campo min-h-10 px-2.5 text-[15px]";

export function Constructor({
  inicial,
  esNueva,
  clientes,
  biblioteca,
  coach,
}: {
  inicial: Programa;
  esNueva: boolean;
  clientes: Cliente[];
  biblioteca: EjercicioBiblioteca[];
  coach: Coach;
}) {
  const router = useRouter();
  const [prog, setProg] = useState<Programa>(inicial);
  const [diaIdx, setDiaIdx] = useState(0);
  const [estado, setEstado] = useState<Estado>(esNueva ? "nuevo" : "guardado");
  const [notasAbiertas, setNotasAbiertas] = useState<Record<string, boolean>>({});
  const [verBiblioteca, setVerBiblioteca] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [grupo, setGrupo] = useState("Todos");
  const [compartir, setCompartir] = useState(false);
  const [pdfCargando, setPdfCargando] = useState(false);
  const [masivo, setMasivo] = useState({ descanso: "2 min", rir: "2", metodologia: "Tradicional" });
  const [aviso, setAviso] = useState<string | null>(null);

  // ids que ya existen en la base de datos (para saber qué borrar al guardar)
  const originales = useRef({
    dias: new Set(esNueva ? [] : inicial.dias.map((d) => d.id)),
    ejercicios: new Set(esNueva ? [] : inicial.dias.flatMap((d) => d.ejercicios.map((e) => e.id))),
  });
  const guardadoUnaVez = useRef(!esNueva);
  const guardandoRef = useRef(false);
  const pendienteRef = useRef(false);
  const progRef = useRef(prog);
  progRef.current = prog;

  const dia = prog.dias[diaIdx] ?? prog.dias[0];
  const cliente = clientes.find((c) => c.id === prog.cliente_id) ?? null;

  // ---------- edición ----------
  const cambiar = useCallback((fn: (p: Programa) => Programa) => {
    setProg((p) => fn(structuredClone(p)));
    setEstado("sin-guardar");
  }, []);

  const cambiarDia = (fn: (d: Dia) => void) =>
    cambiar((p) => {
      fn(p.dias[diaIdx]);
      return p;
    });

  const cambiarEj = (i: number, campos: Partial<Ejercicio>) =>
    cambiarDia((d) => {
      d.ejercicios[i] = { ...d.ejercicios[i], ...campos };
    });

  function completarDesdeBiblioteca(i: number, nombre: string) {
    const b = biblioteca.find((x) => x.nombre.toLowerCase() === nombre.trim().toLowerCase());
    if (b && !dia.ejercicios[i].implemento) cambiarEj(i, { nombre: b.nombre, implemento: b.implemento });
  }

  function mover(i: number, delta: number) {
    cambiarDia((d) => {
      const j = i + delta;
      if (j < 0 || j >= d.ejercicios.length) return;
      [d.ejercicios[i], d.ejercicios[j]] = [d.ejercicios[j], d.ejercicios[i]];
    });
  }

  function agregar(nombre = "", implemento: string | null = null) {
    const ultimo = dia.ejercicios[dia.ejercicios.length - 1];
    const nuevo = ejercicioVacio(nombre, implemento);
    if (ultimo) {
      // hereda descanso/RIR/metodología del anterior: así se arma más rápido
      nuevo.descanso = ultimo.descanso;
      nuevo.rir = ultimo.rir;
      nuevo.metodologia = ultimo.metodologia;
      nuevo.cadencia = ultimo.cadencia;
    }
    cambiarDia((d) => {
      d.ejercicios.push(nuevo);
    });
    if (nombre) {
      setAviso(`${nombre} agregado a ${dia.nombre}`);
      setTimeout(() => setAviso(null), 1800);
    }
  }

  function agregarDia() {
    cambiar((p) => {
      p.dias.push({ id: nuevoId(), nombre: `Día ${p.dias.length + 1}`, ejercicios: [] });
      return p;
    });
    setDiaIdx(prog.dias.length);
  }

  function duplicarDia() {
    cambiar((p) => {
      const d = p.dias[diaIdx];
      p.dias.splice(diaIdx + 1, 0, {
        id: nuevoId(),
        nombre: `${d.nombre} (copia)`,
        ejercicios: d.ejercicios.map((e) => ({ ...e, id: nuevoId() })),
      });
      return p;
    });
    setDiaIdx(diaIdx + 1);
  }

  function borrarDia() {
    if (prog.dias.length === 1) return;
    if (dia.ejercicios.length > 0 && !confirm(`¿Borrar el día "${dia.nombre}" y sus ${dia.ejercicios.length} ejercicios?`)) return;
    cambiar((p) => {
      p.dias.splice(diaIdx, 1);
      return p;
    });
    setDiaIdx(Math.max(0, diaIdx - 1));
  }

  function aplicarATodos() {
    cambiarDia((d) => {
      d.ejercicios = d.ejercicios.map((e) => ({
        ...e,
        descanso: masivo.descanso,
        rir: Number(masivo.rir),
        metodologia: masivo.metodologia,
      }));
    });
  }

  function ponerDuracion(semanas: number) {
    const inicio = prog.fecha_inicio || hoyISO();
    const fin = new Date(Date.parse(inicio + "T12:00:00Z") + (semanas * 7 - 1) * 86400000).toISOString().slice(0, 10);
    cambiar((p) => ({ ...p, fecha_inicio: inicio, fecha_fin: fin }));
  }

  // ---------- guardar ----------
  const guardar = useCallback(async () => {
    if (guardandoRef.current) {
      pendienteRef.current = true;
      return;
    }
    guardandoRef.current = true;
    setEstado("guardando");
    const p = progRef.current;
    const supabase = createClient();

    const payload = {
      id: p.id,
      cliente_id: p.cliente_id,
      nombre: p.nombre,
      fecha_inicio: p.fecha_inicio,
      fecha_fin: p.fecha_fin,
      notas: p.notas,
      dias: p.dias.map((d) => ({
        id: d.id,
        nombre: d.nombre,
        ejercicios: d.ejercicios.map((e) => ({ ...e })),
      })),
    };

    const { error } = await supabase.rpc("guardar_programa", { payload });
    if (error) {
      console.error(error);
      guardandoRef.current = false;
      setEstado("error");
      return;
    }

    const diasActuales = new Set(p.dias.map((d) => d.id));
    const ejActuales = new Set(p.dias.flatMap((d) => d.ejercicios.map((e) => e.id)));
    const ejBorrados = [...originales.current.ejercicios].filter((id) => !ejActuales.has(id));
    const diasBorrados = [...originales.current.dias].filter((id) => !diasActuales.has(id));
    if (ejBorrados.length) await supabase.from("ejercicios").delete().in("id", ejBorrados);
    if (diasBorrados.length) await supabase.from("dias").delete().in("id", diasBorrados);
    originales.current = { dias: diasActuales, ejercicios: ejActuales };

    if (!p.share_token) {
      const { data } = await supabase.from("programas").select("share_token").eq("id", p.id).single();
      if (data) setProg((x) => ({ ...x, share_token: data.share_token }));
    }

    const primeraVez = !guardadoUnaVez.current;
    guardadoUnaVez.current = true;
    guardandoRef.current = false;

    if (pendienteRef.current) {
      pendienteRef.current = false;
      guardar();
      return;
    }
    setEstado((e) => (e === "guardando" ? "guardado" : e));
    // cambia la URL sin recargar el constructor (así no se pierde el estado)
    if (primeraVez) window.history.replaceState(null, "", `/app/rutinas/${p.id}`);
  }, []);

  // autoguardado 1.5 s después del último cambio
  useEffect(() => {
    if (estado !== "sin-guardar") return;
    const t = setTimeout(guardar, 1500);
    return () => clearTimeout(t);
  }, [prog, estado, guardar]);

  // avisar si se cierra con cambios
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (estado === "sin-guardar" || estado === "guardando") e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [estado]);

  // ---------- PDF / compartir ----------
  const urlCompartir = prog.share_token && typeof window !== "undefined" ? `${window.location.origin}/r/${prog.share_token}` : null;

  async function pdf(accion: "ver" | "descargar") {
    setPdfCargando(true);
    const ventana = accion === "ver" ? window.open("", "_blank") : null;
    try {
      const blob = await generarPDF(
        {
          programa: prog.nombre,
          cliente: cliente?.nombre ?? null,
          fechaInicio: prog.fecha_inicio,
          fechaFin: prog.fecha_fin,
          notas: prog.notas,
          dias: prog.dias,
          coach: { nombre: coach.nombre, telefono: coach.telefono_whatsapp, color: coach.color_marca },
        },
        urlCompartir
      );
      if (ventana) ventana.location.href = URL.createObjectURL(blob);
      else descargarBlob(blob, nombreArchivoPDF(cliente?.nombre, prog.nombre));
    } catch (e) {
      console.error(e);
      ventana?.close();
      alert("No se pudo generar el PDF.");
    } finally {
      setPdfCargando(false);
    }
  }

  async function abrirCompartir() {
    if (estado !== "guardado") await guardar();
    setCompartir(true);
  }

  async function duplicarRutina() {
    if (estado !== "guardado") await guardar();
    const hoy = hoyISO();
    const duracion = prog.fecha_inicio && prog.fecha_fin ? diasEntre(prog.fecha_inicio, prog.fecha_fin) : null;
    const copia = {
      id: nuevoId(),
      cliente_id: prog.cliente_id,
      nombre: `${prog.nombre} (renovada)`,
      fecha_inicio: hoy,
      fecha_fin: duracion != null ? new Date(Date.parse(hoy) + duracion * 86400000).toISOString().slice(0, 10) : null,
      notas: prog.notas,
      dias: prog.dias.map((d) => ({
        id: nuevoId(),
        nombre: d.nombre,
        ejercicios: d.ejercicios.map((e) => ({ ...e, id: nuevoId() })),
      })),
    };
    const { error } = await createClient().rpc("guardar_programa", { payload: copia });
    if (error) {
      alert("No se pudo duplicar la rutina.");
      return;
    }
    router.push(`/app/rutinas/${copia.id}`);
  }

  async function eliminarRutina() {
    if (!confirm("¿Eliminar esta rutina? También se borran los registros de pesos del cliente.")) return;
    if (guardadoUnaVez.current) await createClient().from("programas").delete().eq("id", prog.id);
    router.push(cliente ? `/app/clientes/${cliente.id}` : "/app/rutinas");
    router.refresh();
  }

  // ---------- biblioteca ----------
  const grupos = useMemo(() => ["Todos", ...Array.from(new Set(biblioteca.map((b) => b.grupo)))], [biblioteca]);
  const filtrada = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return biblioteca.filter((b) => (grupo === "Todos" || b.grupo === grupo) && (!q || b.nombre.toLowerCase().includes(q)));
  }, [biblioteca, busqueda, grupo]);

  const totalSeries = dia.ejercicios.reduce((a, e) => a + (e.series ?? 0), 0);
  const totalEjercicios = prog.dias.reduce((a, d) => a + d.ejercicios.length, 0);
  const semanas = prog.fecha_inicio && prog.fecha_fin ? Math.round((diasEntre(prog.fecha_inicio, prog.fecha_fin) + 1) / 7) : null;

  const textoEstado: Record<Estado, string> = {
    nuevo: "Sin guardar",
    "sin-guardar": "Cambios sin guardar…",
    guardando: "Guardando…",
    guardado: "Guardado",
    error: "Error al guardar — reintenta",
  };

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5">
      <datalist id="biblioteca-lista">
        {biblioteca.map((b) => (
          <option key={b.id} value={b.nombre} />
        ))}
      </datalist>

      {/* ---------- encabezado ---------- */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 basis-80 flex-col gap-1.5">
            <div className="text-sm font-medium text-muted">
              <Link href="/app/rutinas" className="underline">
                Rutinas
              </Link>
              {cliente && (
                <>
                  {" / "}
                  <Link href={`/app/clientes/${cliente.id}`} className="underline">
                    {cliente.nombre}
                  </Link>
                </>
              )}
            </div>
            <label className="sr-only" htmlFor="nombre-programa">
              Nombre del programa
            </label>
            <input
              id="nombre-programa"
              value={prog.nombre}
              onChange={(e) => cambiar((p) => ({ ...p, nombre: e.target.value }))}
              className="titulo w-full rounded-lg border border-transparent bg-transparent px-1 py-1 text-2xl hover:border-borde-2 focus:border-carbon focus:bg-white focus:outline-none sm:text-3xl md:text-4xl"
            />
            <div className="flex items-center gap-2 px-1">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${
                  estado === "error" ? "bg-alerta-fondo text-alerta" : estado === "guardado" ? "bg-lima text-carbon" : "bg-suave text-[#3A3F45]"
                }`}
              >
                {textoEstado[estado]}
              </span>
              {estado === "error" && (
                <button className="text-sm font-semibold underline" onClick={guardar}>
                  Reintentar
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-borde" onClick={() => pdf("ver")} disabled={pdfCargando || totalEjercicios === 0}>
              {pdfCargando ? "Generando…" : "Ver PDF"}
            </button>
            <button className="btn btn-borde" onClick={() => pdf("descargar")} disabled={pdfCargando || totalEjercicios === 0}>
              Descargar PDF
            </button>
            <button className="btn btn-lima" onClick={abrirCompartir} disabled={totalEjercicios === 0}>
              Compartir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <label className="col-span-2 flex flex-col gap-1.5 md:col-span-1">
            <span className="text-[13px] font-semibold text-muted">Cliente</span>
            <select
              className="campo"
              value={prog.cliente_id ?? ""}
              onChange={(e) => cambiar((p) => ({ ...p, cliente_id: e.target.value || null }))}
            >
              <option value="">— Sin asignar —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-muted">Fecha de inicio</span>
            <input
              type="date"
              className="campo"
              value={prog.fecha_inicio ?? ""}
              onChange={(e) => cambiar((p) => ({ ...p, fecha_inicio: e.target.value || null }))}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-muted">Fecha final</span>
            <input
              type="date"
              className="campo"
              value={prog.fecha_fin ?? ""}
              min={prog.fecha_inicio ?? undefined}
              onChange={(e) => cambiar((p) => ({ ...p, fecha_fin: e.target.value || null }))}
            />
          </label>
          <div className="col-span-2 flex flex-col gap-1.5 md:col-span-1">
            <span className="text-[13px] font-semibold text-muted">
              Duración{semanas ? `: ${semanas} semanas · ${prog.dias.length} días` : ""}
            </span>
            <div className="flex gap-1.5">
              {[4, 6, 8, 12].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ponerDuracion(s)}
                  className={`min-h-11 flex-1 rounded-[10px] border text-sm font-semibold ${
                    semanas === s ? "border-carbon bg-carbon text-fondo" : "border-borde-2 bg-white"
                  }`}
                >
                  {s} sem
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ---------- días ---------- */}
      <div role="tablist" aria-label="Días del programa" className="flex flex-wrap items-center gap-2">
        {prog.dias.map((d, i) => (
          <button
            key={d.id}
            role="tab"
            aria-selected={i === diaIdx}
            onClick={() => setDiaIdx(i)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-[10px] border-[1.5px] px-3.5 font-semibold ${
              i === diaIdx ? "border-carbon bg-carbon text-fondo" : "border-borde-2 bg-white"
            }`}
          >
            {d.nombre || `Día ${i + 1}`}
            <span
              className={`inline-flex h-[22px] min-w-6 items-center justify-center rounded-full px-1.5 text-[13px] ${
                i === diaIdx ? "bg-lima text-carbon" : "bg-suave text-[#3A3F45]"
              }`}
            >
              {d.ejercicios.length}
            </span>
          </button>
        ))}
        <button
          onClick={agregarDia}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border-[1.5px] border-dashed border-[#9FA39A] px-3.5 font-semibold"
        >
          + Día
        </button>
      </div>

      {/* ---------- tabla del día ---------- */}
      <section className="tarjeta overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-borde bg-[#FAFAF7] px-4 py-3.5">
          <div className="flex min-w-0 flex-1 basis-64 items-end gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Nombre del día</span>
              <input
                className="campo titulo min-h-10 text-2xl"
                value={dia.nombre}
                onChange={(e) =>
                  cambiarDia((d) => {
                    d.nombre = e.target.value;
                  })
                }
              />
            </label>
            <BotonIcono label="Duplicar día" icono={Icono.copiar} onClick={duplicarDia} />
            <BotonIcono label="Borrar día" icono={Icono.borrar} onClick={borrarDia} disabled={prog.dias.length === 1} />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <span className="pb-2.5 text-sm font-semibold text-muted">Aplicar a todo el día:</span>
            <label className="flex flex-col gap-1">
              <span className="sr-only">Descanso</span>
              <select className="campo min-h-10 w-auto" value={masivo.descanso} onChange={(e) => setMasivo({ ...masivo, descanso: e.target.value })}>
                {DESCANSOS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="sr-only">RIR</span>
              <select className="campo min-h-10 w-auto" value={masivo.rir} onChange={(e) => setMasivo({ ...masivo, rir: e.target.value })}>
                {RIRS.map((r) => (
                  <option key={r} value={r}>
                    RIR {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="sr-only">Metodología</span>
              <select
                className="campo min-h-10 w-auto"
                value={masivo.metodologia}
                onChange={(e) => setMasivo({ ...masivo, metodologia: e.target.value })}
              >
                {METODOLOGIAS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <button className="btn btn-oscuro min-h-10" onClick={aplicarATodos} disabled={dia.ejercicios.length === 0}>
              Aplicar
            </button>
          </div>
        </div>

        <div className="hidden grid-cols-[44px_minmax(170px,1fr)_136px_64px_80px_70px_88px_104px_minmax(110px,150px)_176px] gap-2 border-b border-borde px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted xl:grid">
          <span>N°</span>
          <span>Ejercicio</span>
          <span>Metodología</span>
          <span>Series</span>
          <span>Reps</span>
          <span>RIR</span>
          <span>Cadencia</span>
          <span>Descanso</span>
          <span>Implemento</span>
          <span className="sr-only">Acciones</span>
        </div>

        <ol className="flex flex-col gap-3 p-3 xl:gap-0 xl:p-0">
          {dia.ejercicios.map((e, i) => (
            <li key={e.id} className="rounded-xl border border-borde xl:rounded-none xl:border-0 xl:border-b xl:border-[#EEF0EA]">
              <div className="grid grid-cols-4 items-end gap-2 p-3 xl:grid-cols-[44px_minmax(170px,1fr)_136px_64px_80px_70px_88px_104px_minmax(110px,150px)_176px] xl:items-center xl:px-4 xl:py-2">
                <div className="col-span-1 flex h-10 items-center">
                  <span className="titulo flex h-8 w-8 items-center justify-center rounded-lg bg-carbon text-lg text-lima">{i + 1}</span>
                </div>
                <label className={`${celda} col-span-3 xl:col-span-1`}>
                  <span className={etiqueta}>Ejercicio</span>
                  <input
                    className={`${input} font-semibold`}
                    list="biblioteca-lista"
                    placeholder="Nombre del ejercicio"
                    value={e.nombre}
                    onChange={(ev) => cambiarEj(i, { nombre: ev.target.value })}
                    onBlur={(ev) => completarDesdeBiblioteca(i, ev.target.value)}
                  />
                </label>
                <label className={`${celda} col-span-2 xl:col-span-1`}>
                  <span className={etiqueta}>Metodología</span>
                  <select className={input} value={e.metodologia} onChange={(ev) => cambiarEj(i, { metodologia: ev.target.value })}>
                    {METODOLOGIAS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </label>
                <label className={celda}>
                  <span className={etiqueta}>Series</span>
                  <input
                    className={`${input} text-center font-semibold`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20}
                    value={e.series ?? ""}
                    onChange={(ev) => cambiarEj(i, { series: ev.target.value ? Number(ev.target.value) : null })}
                  />
                </label>
                <label className={celda}>
                  <span className={etiqueta}>Reps</span>
                  <input
                    className={`${input} text-center font-semibold`}
                    placeholder="10-12"
                    value={e.reps ?? ""}
                    onChange={(ev) => cambiarEj(i, { reps: ev.target.value })}
                  />
                </label>
                <label className={celda}>
                  <span className={etiqueta}>RIR</span>
                  <select
                    className={`${input} text-center`}
                    value={e.rir ?? ""}
                    onChange={(ev) => cambiarEj(i, { rir: ev.target.value === "" ? null : Number(ev.target.value) })}
                  >
                    <option value="">—</option>
                    {RIRS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={celda}>
                  <span className={etiqueta}>Cadencia</span>
                  <input
                    className={`${input} text-center`}
                    placeholder="3-1-1"
                    value={e.cadencia ?? ""}
                    onChange={(ev) => cambiarEj(i, { cadencia: ev.target.value })}
                  />
                </label>
                <label className={`${celda} col-span-2 xl:col-span-1`}>
                  <span className={etiqueta}>Descanso</span>
                  <select className={input} value={e.descanso ?? ""} onChange={(ev) => cambiarEj(i, { descanso: ev.target.value || null })}>
                    <option value="">—</option>
                    {DESCANSOS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                    {e.descanso && !DESCANSOS.includes(e.descanso) && <option>{e.descanso}</option>}
                  </select>
                </label>
                <label className={`${celda} col-span-2 xl:col-span-1`}>
                  <span className={etiqueta}>Implemento</span>
                  <input
                    className={input}
                    placeholder="Máquina"
                    value={e.implemento ?? ""}
                    onChange={(ev) => cambiarEj(i, { implemento: ev.target.value })}
                  />
                </label>
                <div className="col-span-2 flex items-center justify-end gap-0.5 xl:col-span-1">
                  <BotonIcono
                    label={`Notas y video de ${e.nombre || "ejercicio"}`}
                    icono={Icono.nota}
                    activo={!!notasAbiertas[e.id] || !!e.notas || !!e.video_url}
                    onClick={() => setNotasAbiertas((n) => ({ ...n, [e.id]: !n[e.id] }))}
                  />
                  <BotonIcono label="Subir" icono={Icono.arriba} onClick={() => mover(i, -1)} disabled={i === 0} />
                  <BotonIcono label="Bajar" icono={Icono.abajo} onClick={() => mover(i, 1)} disabled={i === dia.ejercicios.length - 1} />
                  <BotonIcono
                    label="Duplicar ejercicio"
                    icono={Icono.copiar}
                    onClick={() =>
                      cambiarDia((d) => {
                        d.ejercicios.splice(i + 1, 0, { ...d.ejercicios[i], id: nuevoId() });
                      })
                    }
                  />
                  <BotonIcono
                    label="Eliminar ejercicio"
                    icono={Icono.borrar}
                    onClick={() =>
                      cambiarDia((d) => {
                        d.ejercicios.splice(i, 1);
                      })
                    }
                  />
                </div>
              </div>
              {notasAbiertas[e.id] && (
                <div className="grid grid-cols-1 gap-2 border-t border-dashed border-borde px-3 pb-3 pt-2.5 md:grid-cols-2 xl:pl-[68px]">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Nota para el cliente</span>
                    <input
                      className={input}
                      placeholder="Ej: en superserie con el siguiente"
                      value={e.notas ?? ""}
                      onChange={(ev) => cambiarEj(i, { notas: ev.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Link de video (técnica)</span>
                    <input
                      className={input}
                      type="url"
                      placeholder="https://youtube.com/…"
                      value={e.video_url ?? ""}
                      onChange={(ev) => cambiarEj(i, { video_url: ev.target.value })}
                    />
                  </label>
                </div>
              )}
            </li>
          ))}
          {dia.ejercicios.length === 0 && (
            <li className="px-4 py-8 text-center text-muted">Este día no tiene ejercicios. Agrega uno abajo.</li>
          )}
        </ol>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setVerBiblioteca((v) => !v)} className="btn btn-oscuro">
              {verBiblioteca ? "Cerrar biblioteca" : "+ Desde biblioteca"}
            </button>
            <button
              onClick={() => agregar()}
              className="btn border-[1.5px] border-dashed border-[#9FA39A] bg-transparent"
            >
              + Ejercicio en blanco
            </button>
          </div>
          <div className="text-sm font-medium text-muted" aria-live="polite">
            {aviso ?? `${dia.ejercicios.length} ejercicios · ${totalSeries} series en total`}
          </div>
        </div>

        {verBiblioteca && (
          <div className="flex flex-col gap-3.5 border-t border-borde bg-[#FAFAF7] px-4 pb-5 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="titulo text-xl">Biblioteca de ejercicios</h3>
              <label className="flex min-h-10 max-w-sm flex-1 basis-56 items-center gap-2 rounded-[10px] border border-borde-2 bg-white px-3 text-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  type="search"
                  aria-label="Buscar ejercicio"
                  placeholder="Buscar: hip thrust, jalón, press…"
                  className="w-full bg-transparent text-carbon outline-none"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {grupos.map((g) => (
                <button
                  key={g}
                  onClick={() => setGrupo(g)}
                  className={`min-h-9 rounded-full border-[1.5px] px-3 text-sm font-semibold ${
                    g === grupo ? "border-carbon bg-carbon text-fondo" : "border-borde-2 bg-white"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2">
              {filtrada.map((b) => (
                <button
                  key={b.id}
                  onClick={() => agregar(b.nombre, b.implemento)}
                  aria-label={`Agregar ${b.nombre} a ${dia.nombre}`}
                  className="flex min-h-[52px] items-center justify-between gap-2 rounded-[10px] border border-borde bg-white py-2 pl-3 pr-2.5 text-left hover:border-carbon"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold">{b.nombre}</span>
                    <span className="text-xs text-muted">
                      {b.grupo}
                      {b.implemento ? ` · ${b.implemento}` : ""}
                    </span>
                  </span>
                  <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-lima font-bold">+</span>
                </button>
              ))}
              {filtrada.length === 0 && (
                <p className="text-sm text-muted">
                  No está en la biblioteca. Usa “Ejercicio en blanco” y escribe el nombre.
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ---------- notas y acciones ---------- */}
      <section className="tarjeta flex flex-col gap-2 p-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-muted">Notas generales (salen en el PDF)</span>
          <textarea
            className="campo"
            rows={3}
            placeholder="Calentamiento, cardio al final, hidratación…"
            value={prog.notas ?? ""}
            onChange={(e) => cambiar((p) => ({ ...p, notas: e.target.value }))}
          />
        </label>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button className="btn btn-borde" onClick={duplicarRutina} disabled={totalEjercicios === 0}>
          Duplicar para renovar
        </button>
        <button className="text-sm font-semibold text-alerta underline" onClick={eliminarRutina}>
          Eliminar rutina
        </button>
      </div>

      {urlCompartir && (
        <Compartir
          abierto={compartir}
          onCerrar={() => setCompartir(false)}
          url={urlCompartir}
          cliente={cliente?.nombre ?? null}
          telefono={cliente?.telefono ?? null}
          fechaInicio={prog.fecha_inicio}
          fechaFin={prog.fecha_fin}
          onDescargar={() => pdf("descargar")}
          descargando={pdfCargando}
          resumen={`${prog.dias.length} días · ${totalEjercicios} ejercicios`}
        />
      )}
    </div>
  );
}
