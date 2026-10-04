import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Dia, Ejercicio, Programa } from "@/lib/tipos";
import { Constructor } from "../Constructor";
import { datosConstructor } from "../datos";

type Fila = Omit<Programa, "dias"> & {
  dias: (Omit<Dia, "ejercicios"> & { orden: number; ejercicios: (Ejercicio & { orden: number })[] })[];
};

export default async function EditarRutina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data }, datos] = await Promise.all([
    supabase
      .from("programas")
      .select(
        "id, nombre, cliente_id, fecha_inicio, fecha_fin, notas, share_token, dias(id, nombre, orden, ejercicios(id, orden, nombre, metodologia, series, reps, rir, cadencia, descanso, implemento, notas, video_url))"
      )
      .eq("id", id)
      .maybeSingle(),
    datosConstructor(supabase, user.id),
  ]);
  if (!data) notFound();

  const fila = data as unknown as Fila;
  const programa: Programa = {
    ...fila,
    dias: [...fila.dias]
      .sort((a, b) => a.orden - b.orden)
      .map((d) => ({
        id: d.id,
        nombre: d.nombre,
        ejercicios: [...d.ejercicios]
          .sort((a, b) => a.orden - b.orden)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .map(({ orden, ...e }) => e),
      })),
  };
  if (programa.dias.length === 0) programa.dias = [{ id: crypto.randomUUID(), nombre: "Día 1", ejercicios: [] }];

  return <Constructor key={programa.id} inicial={programa} esNueva={false} {...datos} />;
}
