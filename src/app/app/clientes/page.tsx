import { createClient } from "@/lib/supabase/server";
import { ListaClientes } from "./ListaClientes";

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ nuevo?: string }> }) {
  const { nuevo } = await searchParams;
  const supabase = await createClient();
  const [{ data: clientes }, { data: programas }] = await Promise.all([
    supabase.from("clientes").select("id, nombre, objetivo, telefono, notas").order("nombre"),
    supabase.from("programas").select("cliente_id, fecha_fin").order("updated_at", { ascending: false }),
  ]);

  return (
    <ListaClientes
      clientes={clientes ?? []}
      programas={(programas ?? []) as { cliente_id: string | null; fecha_fin: string | null }[]}
      abrirNuevo={nuevo === "1"}
    />
  );
}
