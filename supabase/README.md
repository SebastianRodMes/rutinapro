# Base de datos (Supabase)

El esquema ya está aplicado en el proyecto `rutinapro` (ref `qxuywvoxjrlzekpfiinc`).

Tablas: `coaches`, `clientes`, `biblioteca_ejercicios`, `programas`, `dias`, `ejercicios`, `registros`.
Todas tienen RLS: cada coach solo ve lo suyo.

Funciones:
- `guardar_programa(payload jsonb)`: upsert de programa + días + ejercicios (corre con permisos del coach).
- `rutina_publica(token)`: lo que ve el cliente en `/r/[token]`, sin login.
- `registrar_serie(token, ejercicio, serie, hecha, peso)` y `registrar_peso(...)`: el cliente marca series y pesos.

`hardening.sql` tiene un ajuste opcional para correr en el SQL Editor de Supabase.
