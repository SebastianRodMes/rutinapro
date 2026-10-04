import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FichaCliente } from "./FichaCliente";

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: cliente }, { data: programas }] = await Promise.all([
    supabase.from("clientes").select("id, nombre, objetivo, telefono, notas").eq("id", id).maybeSingle(),
    supabase
      .from("programas")
      .select("id, nombre, fecha_inicio, fecha_fin, dias(count)")
      .eq("cliente_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!cliente) notFound();

  return (
    <FichaCliente
      cliente={cliente}
      programas={
        (programas ?? []) as unknown as {
          id: string;
          nombre: string;
          fecha_inicio: string | null;
          fecha_fin: string | null;
          dias: { count: number }[];
        }[]
      }
    />
  );
}
