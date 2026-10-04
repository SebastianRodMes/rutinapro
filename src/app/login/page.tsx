"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { urlPublica } from "@/lib/url";

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<"entrar" | "registro">("entrar");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setAviso(null);
    const supabase = createClient();

    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(
          error.message.includes("Email not confirmed")
            ? "Todavía no confirmaste tu correo. Revisa tu bandeja de entrada."
            : "Correo o contraseña incorrectos."
        );
        setCargando(false);
        return;
      }
      router.replace("/app");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
        emailRedirectTo: `${urlPublica()}/auth/callback`,
      },
    });
    setCargando(false);
    if (error) {
      setError(
        error.message.includes("Password")
          ? "La contraseña debe tener al menos 6 caracteres."
          : error.message
      );
      return;
    }
    if (data.session) {
      router.replace("/app");
      router.refresh();
    } else {
      setAviso("Listo. Te enviamos un correo para confirmar tu cuenta; ábrelo desde este dispositivo.");
    }
  }

  return (
    <main className="flex min-h-screen flex-col md:flex-row">
      <section className="flex flex-col justify-between gap-10 bg-carbon p-8 text-white md:w-[44%] md:p-12">
        <Logo />
        <div className="max-w-md">
          <h1 className="titulo text-5xl md:text-6xl">
            Rutinas listas para <span className="text-lima">compartir</span>
          </h1>
          <p className="mt-4 text-lg text-[#C9CCC4]">
            Arma la rutina de cada cliente, descárgala en PDF y mándala por WhatsApp. Tus clientes marcan sus series y
            anotan sus pesos desde el celular.
          </p>
        </div>
        <p className="text-sm text-[#A9ADA5]">Hecho para entrenadores personales.</p>
      </section>

      <section className="flex flex-1 items-center justify-center p-6">
        <form onSubmit={enviar} className="tarjeta flex w-full max-w-sm flex-col gap-4 p-7">
          <h2 className="titulo text-3xl">{modo === "entrar" ? "Entrar" : "Crear cuenta"}</h2>

          {modo === "registro" && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-muted">Tu nombre</span>
              <input className="campo" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </label>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-muted">Correo</span>
            <input
              className="campo"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-muted">Contraseña</span>
            <input
              className="campo"
              type="password"
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <p className="rounded-lg bg-alerta-fondo px-3 py-2 text-sm font-medium text-alerta">{error}</p>}
          {aviso && <p className="rounded-lg bg-suave px-3 py-2 text-sm font-medium">{aviso}</p>}

          <button className="btn btn-lima mt-1" disabled={cargando}>
            {cargando ? "Un momento…" : modo === "entrar" ? "Entrar" : "Crear cuenta"}
          </button>
          <button
            type="button"
            className="text-sm font-semibold underline"
            onClick={() => {
              setModo(modo === "entrar" ? "registro" : "entrar");
              setError(null);
              setAviso(null);
            }}
          >
            {modo === "entrar" ? "¿Eres nuevo? Crea tu cuenta" : "Ya tengo cuenta"}
          </button>
        </form>
      </section>
    </main>
  );
}
