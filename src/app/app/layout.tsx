import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navegacion } from "@/components/Navegacion";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: coach } = await supabase.from("coaches").select("nombre").eq("id", user.id).maybeSingle();

  return (
    <div className="min-h-screen md:flex">
      <Navegacion nombreCoach={coach?.nombre || user.email || "Coach"} />
      <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-12 md:pt-8 lg:px-10">{children}</main>
    </div>
  );
}
