import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hoyISO, type Programa } from "@/lib/tipos";
import { Constructor } from "../Constructor";
import { datosConstructor } from "../datos";

export default async function NuevaRutina({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const { cliente } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const datos = await datosConstructor(supabase, user.id);
  const elegido = datos.clientes.find((c) => c.id === cliente);
  const hoy = hoyISO();
  const fin = new Date(Date.parse(hoy + "T12:00:00Z") + (8 * 7 - 1) * 86400000).toISOString().slice(0, 10);

  const inicial: Programa = {
    id: crypto.randomUUID(),
    nombre: "Nueva rutina",
    cliente_id: elegido?.id ?? null,
    fecha_inicio: hoy,
    fecha_fin: fin,
    notas: null,
    dias: [{ id: crypto.randomUUID(), nombre: "Día 1", ejercicios: [] }],
  };

  return <Constructor key={inicial.id} inicial={inicial} esNueva {...datos} />;
}
