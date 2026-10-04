import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { diasEntre, fechaCorta, hoyISO } from "@/lib/tipos";

type Fila = {
  id: string;
  nombre: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  clientes: { id: string; nombre: string } | null;
  dias: { count: number }[];
};

export default async function RutinasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programas")
    .select("id, nombre, fecha_inicio, fecha_fin, clientes(id, nombre), dias(count)")
    .order("updated_at", { ascending: false });
  const programas = (data ?? []) as unknown as Fila[];
  const hoy = hoyISO();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="titulo text-4xl md:text-5xl">Rutinas</h1>
        <Link href="/app/rutinas/nueva" className="btn btn-lima">
          + Nueva rutina
        </Link>
      </header>

      {programas.length === 0 ? (
        <div className="tarjeta p-6 text-muted">
          Todavía no hay rutinas. Crea la primera o entra a un cliente y dale a “Crear rutina”.
        </div>
      ) : (
        <div className="tarjeta overflow-hidden">
          <ul>
            {programas.map((p) => {
              let chip = { texto: "Activa", clase: "bg-lima text-carbon" };
              if (p.fecha_fin && p.fecha_fin < hoy) chip = { texto: "Vencida", clase: "bg-suave text-[#3A3F45]" };
              else if (p.fecha_fin && diasEntre(hoy, p.fecha_fin) <= 7)
                chip = { texto: `Vence ${fechaCorta(p.fecha_fin, false)}`, clase: "bg-alerta-fondo text-alerta" };
              return (
                <li key={p.id} className="border-b border-[#EEF0EA] last:border-0">
                  <Link href={`/app/rutinas/${p.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3.5 hover:bg-[#FAFAF7]">
                    <div className="min-w-0 flex-1 basis-52">
                      <div className="truncate font-semibold">{p.nombre}</div>
                      <div className="text-sm text-muted">
                        {p.clientes?.nombre ?? "Sin cliente"} · {p.dias?.[0]?.count ?? 0} días · {fechaCorta(p.fecha_inicio)} →{" "}
                        {fechaCorta(p.fecha_fin)}
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[13px] font-semibold ${chip.clase}`}>{chip.texto}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
