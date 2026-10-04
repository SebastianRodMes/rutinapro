export type Ejercicio = {
  id: string;
  nombre: string;
  metodologia: string;
  series: number | null;
  reps: string | null;
  rir: number | null;
  cadencia: string | null;
  descanso: string | null;
  implemento: string | null;
  notas: string | null;
  video_url: string | null;
};

export type Dia = {
  id: string;
  nombre: string;
  ejercicios: Ejercicio[];
};

export type Programa = {
  id: string;
  nombre: string;
  cliente_id: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  notas: string | null;
  share_token?: string;
  dias: Dia[];
};

export type Cliente = {
  id: string;
  nombre: string;
  objetivo: string | null;
  telefono: string | null;
  notas: string | null;
};

export type Coach = {
  id: string;
  nombre: string;
  telefono_whatsapp: string | null;
  color_marca: string;
};

export type EjercicioBiblioteca = {
  id: string;
  nombre: string;
  grupo: string;
  implemento: string | null;
};

export const METODOLOGIAS = [
  "Tradicional",
  "Superserie",
  "Biserie",
  "Drop set",
  "Rest-pause",
  "Piramidal",
  "Isométrico",
];

export const DESCANSOS = ["30 seg", "45 seg", "1 min", "1:30 min", "2 min", "2:30 min", "3 min"];

export const RIRS = [0, 1, 2, 3, 4];

export function nuevoId() {
  return crypto.randomUUID();
}

export function ejercicioVacio(nombre = "", implemento: string | null = null): Ejercicio {
  return {
    id: nuevoId(),
    nombre,
    metodologia: "Tradicional",
    series: 3,
    reps: "10-12",
    rir: 2,
    cadencia: "1-1-1",
    descanso: "2 min",
    implemento,
    notas: null,
    video_url: null,
  };
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "2026-10-06" -> "6 oct 2026" */
export function fechaCorta(iso: string | null | undefined, conAnio = true) {
  if (!iso) return "—";
  const [a, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]}${conAnio ? ` ${a}` : ""}`;
}

/** "2026-10-06" -> "06/10/2026" */
export function fechaNumerica(iso: string | null | undefined) {
  if (!iso) return "—";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

export function hoyISO() {
  // Fecha local de Costa Rica (UTC-6)
  const ahora = new Date(Date.now() - 6 * 3600 * 1000);
  return ahora.toISOString().slice(0, 10);
}

export function diasEntre(desdeISO: string, hastaISO: string) {
  const a = Date.parse(desdeISO + "T00:00:00Z");
  const b = Date.parse(hastaISO + "T00:00:00Z");
  return Math.round((b - a) / 86400000);
}

/** Normaliza un teléfono de CR para wa.me (agrega 506 si tiene 8 dígitos). */
export function telefonoWhatsApp(tel: string | null | undefined) {
  if (!tel) return "";
  const digitos = tel.replace(/\D/g, "");
  if (digitos.length === 8) return "506" + digitos;
  return digitos;
}

export function iniciales(nombre: string) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function nombreArchivoPDF(cliente: string | null | undefined, programa: string) {
  const limpio = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `Rutina_${limpio(cliente || "cliente")}_${limpio(programa) || "programa"}.pdf`;
}
