# RutinaPro

App para que un entrenador personal cree rutinas, las exporte a PDF y las comparta por WhatsApp.
El cliente abre su link (`/r/<token>`), marca las series que termina y anota el peso usado.

## Stack
- Next.js 15 (App Router) + Tailwind 4
- Supabase (Auth, Postgres con RLS)
- PDF generado en el navegador con `@react-pdf/renderer`
- Deploy en Vercel

## Correr local
```bash
cp .env.example .env.local   # ya trae la URL y la publishable key del proyecto
npm install
npm run dev
```

## Variables de entorno
| Variable | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key (`sb_publishable_...`) |

## Configuración en Supabase (una vez)
En **Authentication → URL Configuration**:
- **Site URL**: la URL de producción de Vercel.
- **Redirect URLs**: `https://<tu-dominio>/auth/callback`.

Si no quieres confirmar correo al registrarte: **Authentication → Sign In / Providers → Email → Confirm email** (apagar).

## Estructura
- `src/app/app/*` — panel del coach (requiere login)
- `src/app/app/rutinas/Constructor.tsx` — constructor de rutinas (autoguardado)
- `src/app/r/[token]` — vista pública del cliente
- `src/components/pdf` — plantilla y generación del PDF
- `supabase/` — notas del esquema
