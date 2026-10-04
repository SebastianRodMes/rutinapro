import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VistaCliente, type RutinaPublica } from "./VistaCliente";

async function cargar(token: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("rutina_publica", { p_token: token });
  return (data ?? null) as RutinaPublica | null;
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const r = await cargar(token);
  return {
    title: r ? `Rutina de ${r.cliente ?? ""} · ${r.nombre}` : "Rutina",
    robots: { index: false, follow: false },
  };
}

export default async function RutinaCliente({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const rutina = await cargar(token);
  if (!rutina) notFound();
  return <VistaCliente token={token} inicial={rutina} />;
}
