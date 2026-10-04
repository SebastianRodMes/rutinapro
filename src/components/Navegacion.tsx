"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo, IconoPesa } from "./Logo";

const ICONOS: Record<string, React.ReactNode> = {
  inicio: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  ),
  clientes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
      <path d="M16 4.1a4 4 0 0 1 0 7.8" />
      <path d="M22 21c0-3-1.8-5.6-4.5-6.6" />
    </svg>
  ),
  rutinas: <IconoPesa size={18} />,
  ajustes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  ),
};

const LINKS = [
  { href: "/app", label: "Inicio", icono: "inicio" },
  { href: "/app/clientes", label: "Clientes", icono: "clientes" },
  { href: "/app/rutinas", label: "Rutinas", icono: "rutinas" },
  { href: "/app/ajustes", label: "Ajustes", icono: "ajustes" },
];

export function Navegacion({ nombreCoach }: { nombreCoach: string }) {
  const path = usePathname();
  const router = useRouter();
  const activo = (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));

  async function salir() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      {/* Escritorio */}
      <nav
        aria-label="Principal"
        className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col gap-7 bg-carbon px-4 py-6 text-[#E9EBE4] md:flex print:hidden"
      >
        <div className="px-2">
          <Logo />
        </div>
        <div className="flex flex-col gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 font-medium ${
                activo(l.href) ? "bg-lima font-semibold text-carbon" : "text-[#C9CCC4] hover:bg-carbon-2"
              }`}
            >
              {ICONOS[l.icono]}
              {l.label}
            </Link>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-center gap-2.5 rounded-xl bg-carbon-2 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lima font-bold text-carbon">
              {nombreCoach.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{nombreCoach}</div>
              <div className="text-[13px] text-[#A9ADA5]">Entrenador</div>
            </div>
          </div>
          <button onClick={salir} className="min-h-10 rounded-[10px] text-sm font-medium text-[#C9CCC4] hover:bg-carbon-2">
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Celular */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-carbon px-4 py-3 md:hidden print:hidden">
        <Logo />
        <button onClick={salir} className="text-sm font-medium text-[#C9CCC4]">
          Salir
        </button>
      </header>
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-borde bg-white pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
      >
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
              activo(l.href) ? "text-carbon" : "text-muted"
            }`}
          >
            <span className={`rounded-full px-3 py-0.5 ${activo(l.href) ? "bg-lima" : ""}`}>{ICONOS[l.icono]}</span>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
