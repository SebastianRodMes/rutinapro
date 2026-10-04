import type { SupabaseClient } from "@supabase/supabase-js";
import type { Cliente, Coach, EjercicioBiblioteca } from "@/lib/tipos";

export async function datosConstructor(supabase: SupabaseClient, userId: string) {
  const [{ data: clientes }, { data: biblioteca }, { data: coach }] = await Promise.all([
    supabase.from("clientes").select("id, nombre, objetivo, telefono, notas").order("nombre"),
    supabase.from("biblioteca_ejercicios").select("id, nombre, grupo, implemento").order("grupo").order("nombre"),
    supabase.from("coaches").select("id, nombre, telefono_whatsapp, color_marca").eq("id", userId).maybeSingle(),
  ]);
  return {
    clientes: (clientes ?? []) as Cliente[],
    biblioteca: (biblioteca ?? []) as EjercicioBiblioteca[],
    coach: (coach ?? { id: userId, nombre: "", telefono_whatsapp: null, color_marca: "#C6F432" }) as Coach,
  };
}
