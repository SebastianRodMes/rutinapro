import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { diasEntre, fechaCorta, hoyISO, iniciales } from "@/lib/tipos";

type ProgramaFila = {
  id: string;
  nombre: string;
  fecha_fin: string | null;
  cliente_id: string | null;
  clientes: { nombre: string } | null;
  dias: { count: number }[];
};

type RegistroFila = {
  programa_id: string;
  fecha: string;
  peso: number | null;
  ejercicios: { nombre: string } | null;
  programas: { nombre: string; clientes: { nombre: string } | null } | null;
};

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export default async function Dashboard() {
  const supabase = await createClient();
  const hoy = hoyISO();
  const hace7 = new Date(Date.parse(hoy) - 7 * 86400000).toISOString().slice(0, 10);

  const [{ data: coach }, { data: clientes }, { data: programasRaw }, { data: registrosRaw }] = await Promise.all([
    supabase.from("coaches").select("nombre").maybeSingle(),
    supabase.from("clientes").select("id, nombre, objetivo").order("nombre"),
    supabase
      .from("programas")
      .select("id, nombre, fecha_fin, cliente_id, clientes(nombre), dias(count)")
      .order("updated_at", { ascending: false }),
    supabase
      .from("registros")
      .select("programa_id, fecha, peso, ejercicios(nombre), programas(nombre, clientes(nombre))")
      .eq("hecha", true)
      .gte("fecha", hace7)
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  const programas = (programasRaw ?? []) as unknown as ProgramaFila[];
  const registros = (registrosRaw ?? []) as unknown as RegistroFila[];

  const activos = programas.filter((p) => !p.fecha_fin || p.fecha_fin >= hoy);
  const porVencer = activos
    .filter((p) => p.fecha_fin && diasEntre(hoy, p.fecha_fin) <= 14)
    .sort((a, b) => (a.fecha_fin! < b.fecha_fin! ? -1 : 1));
  const vencenSemana = porVencer.filter((p) => diasEntre(hoy, p.fecha_fin!) <= 7).length;

  const clientesConRutina = new Set(activos.map((p) => p.cliente_id).filter(Boolean));
  const sinRutina = (clientes ?? []).filter((c) => !clientesConRutina.has(c.id)).length;

  // Actividad: agrupar por programa + fecha
  const actividadMap = new Map<string, { cliente: string; programa: string; fecha: string; series: number; ejercicios: Set<string>; conPeso: number }>();
  for (const r of registros) {
    const key = r.programa_id + r.fecha;
    const item =
      actividadMap.get(key) ??
      {
        cliente: r.programas?.clientes?.nombre ?? "Cliente",
        programa: r.programas?.nombre ?? "",
        fecha: r.fecha,
        series: 0,
        ejercicios: new Set<string>(),
        conPeso: 0,
      };
    item.series++;
    if (r.ejercicios?.nombre) item.ejercicios.add(r.ejercicios.nombre);
    if (r.peso != null) item.conPeso++;
    actividadMap.set(key, item);
  }
  const actividad = [...actividadMap.values()].slice(0, 6);

  const fechaHoy = new Date(hoy + "T12:00:00Z");
  const saludo = `${DIAS_SEMANA[fechaHoy.getUTCDay()]} ${fechaHoy.getUTCDate()} de ${MESES[fechaHoy.getUTCMonth()]}`;
  const nombre = (coach?.nombre ?? "").split(" ")[0];

  const estadoCliente = (id: string) => {
    const p = programas.find((x) => x.cliente_id === id);
    if (!p) return { texto: "Sin rutina", clase: "text-muted" };
    if (p.fecha_fin && p.fecha_fin < hoy) return { texto: "Rutina vencida", clase: "text-alerta" };
    if (p.fecha_fin && diasEntre(hoy, p.fecha_fin) <= 7)
      return { texto: `Vence en ${diasEntre(hoy, p.fecha_fin)} días`, clase: "text-alerta" };
    return { texto: "Rutina activa", clase: "text-lima-oscuro" };
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium capitalize text-muted">{saludo}</div>
          <h1 className="titulo mt-1 text-4xl md:text-5xl">Hola{nombre ? `, ${nombre}` : ""}</h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/app/clientes?nuevo=1" className="btn btn-borde">
            Nuevo cliente
          </Link>
          <Link href="/app/rutinas/nueva" className="btn btn-lima">
            + Nueva rutina
          </Link>
        </div>
      </header>

      <section aria-label="Resumen" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="tarjeta px-5 py-5">
          <div className="text-sm font-medium text-muted">Clientes</div>
          <div className="titulo mt-1 text-5xl">{clientes?.length ?? 0}</div>
          <div className="mt-1 text-[13px] text-muted">
            {sinRutina > 0 ? `${sinRutina} sin rutina activa` : "Todos con rutina activa"}
          </div>
        </div>
        <div className="tarjeta px-5 py-5">
          <div className="text-sm font-medium text-muted">Rutinas activas</div>
          <div className="titulo mt-1 text-5xl">{activos.length}</div>
          <div className="mt-1 text-[13px] text-muted">{programas.length} en total</div>
        </div>
        <div className="rounded-2xl bg-carbon px-5 py-5 text-fondo">
          <div className="text-sm font-medium text-[#C9CCC4]">Vencen esta semana</div>
          <div className="titulo mt-1 text-5xl text-lima">{vencenSemana}</div>
          <div className="mt-1 text-[13px] text-[#C9CCC4]">Renuévalas antes de que terminen</div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <section className="tarjeta overflow-hidden lg:col-span-3">
          <div className="flex items-center justify-between border-b border-borde px-5 py-4">
            <h2 className="titulo text-2xl">Próximos vencimientos</h2>
            <Link href="/app/rutinas" className="text-sm font-semibold underline">
              Ver todas
            </Link>
          </div>
          {porVencer.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">Ninguna rutina vence en las próximas dos semanas.</p>
          ) : (
            <ul>
              {porVencer.slice(0, 6).map((p) => {
                const dias = diasEntre(hoy, p.fecha_fin!);
                const urgente = dias <= 7;
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-3.5 border-b border-[#EEF0EA] px-5 py-3.5 last:border-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-suave font-bold">
                      {iniciales(p.clientes?.nombre ?? "?")}
                    </div>
                    <div className="min-w-0 flex-1 basis-40">
                      <div className="font-semibold">{p.clientes?.nombre ?? "Sin cliente"}</div>
                      <div className="truncate text-sm text-muted">
                        {p.nombre} · {p.dias?.[0]?.count ?? 0} días
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[13px] font-semibold ${
                        urgente ? "bg-alerta-fondo text-alerta" : "bg-suave text-[#3A3F45]"
                      }`}
                    >
                      Vence {fechaCorta(p.fecha_fin, false)}
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

        <section className="tarjeta overflow-hidden lg:col-span-2">
          <div className="border-b border-borde px-5 py-4">
            <h2 className="titulo text-2xl">Actividad de clientes</h2>
          </div>
          {actividad.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">
              Cuando tus clientes marquen series desde su link, lo vas a ver aquí.
            </p>
          ) : (
            <ul className="flex flex-col gap-4 px-5 py-4">
              {actividad.map((a) => (
                <li key={a.cliente + a.fecha + a.programa} className="flex gap-3">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#7FA600]" />
                  <div>
                    <div className="font-semibold">
                      {a.cliente} entrenó {a.programa}
                    </div>
                    <div className="text-sm text-muted">
                      {a.series} series en {a.ejercicios.size} ejercicios
                      {a.conPeso > 0 ? ` · ${a.conPeso} con peso` : ""} · {a.fecha === hoy ? "hoy" : fechaCorta(a.fecha, false)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h2 className="titulo text-2xl">Clientes</h2>
          <Link href="/app/clientes" className="text-sm font-semibold underline">
            Ver todos
          </Link>
        </div>
        {(clientes ?? []).length === 0 ? (
          <div className="tarjeta flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-muted">Todavía no tienes clientes. Agrega el primero para armarle su rutina.</p>
            <Link href="/app/clientes?nuevo=1" className="btn btn-lima">
              Agregar cliente
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
            {(clientes ?? []).slice(0, 12).map((c) => {
              const e = estadoCliente(c.id);
              return (
                <Link key={c.id} href={`/app/clientes/${c.id}`} className="tarjeta flex flex-col gap-1 p-4 hover:border-carbon">
                  <div className="font-bold">{c.nombre}</div>
                  <div className="text-[13px] text-muted">{c.objetivo || "Sin objetivo"}</div>
                  <div className={`text-[13px] font-semibold ${e.clase}`}>{e.texto}</div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
