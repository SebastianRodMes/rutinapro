import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="titulo text-5xl">No encontrado</h1>
      <p className="text-muted">El link no existe o la rutina fue eliminada. Pídele a tu coach el link nuevo.</p>
      <Link href="/" className="btn btn-lima">
        Ir al inicio
      </Link>
    </main>
  );
}
