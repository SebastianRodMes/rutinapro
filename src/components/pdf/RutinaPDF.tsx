import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Dia } from "@/lib/tipos";
import { fechaNumerica } from "@/lib/tipos";

export type DatosPDF = {
  programa: string;
  cliente: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  notas: string | null;
  dias: Dia[];
  coach: { nombre: string; telefono: string | null; color: string };
  qrDataUrl: string | null;
};

// Sin cortar palabras con guiones (ej. "SE-RIES")
Font.registerHyphenationCallback((palabra) => [palabra]);

const CARBON = "#15171A";
const MUTED = "#585D64";
const BORDE = "#D5D8D0";

const COLS = [
  { key: "n", label: "N°", width: 20, align: "left" as const },
  { key: "nombre", label: "Ejercicio", flex: 1, align: "left" as const },
  { key: "metodologia", label: "Metodología", width: 60, align: "left" as const },
  { key: "series", label: "Series", width: 38, align: "center" as const },
  { key: "reps", label: "Reps", width: 42, align: "center" as const },
  { key: "rir", label: "RIR", width: 26, align: "center" as const },
  { key: "cadencia", label: "Cadencia", width: 50, align: "center" as const },
  { key: "descanso", label: "Descanso", width: 52, align: "center" as const },
  { key: "implemento", label: "Implemento", width: 84, align: "left" as const },
];

const s = StyleSheet.create({
  page: { paddingBottom: 46, fontFamily: "Helvetica", fontSize: 8.5, color: CARBON },
  header: {
    backgroundColor: CARBON,
    color: "#F3F4EF",
    paddingHorizontal: 32,
    paddingTop: 22,
    paddingBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  coachNombre: { fontFamily: "Helvetica-Bold", fontSize: 17, textTransform: "uppercase" },
  coachSub: { fontSize: 9, color: "#C9CCC4", marginTop: 3 },
  etiqueta: { fontFamily: "Helvetica-Bold", fontSize: 7.5, letterSpacing: 1.2, textTransform: "uppercase" },
  programa: { fontFamily: "Helvetica-Bold", fontSize: 18, textTransform: "uppercase", textAlign: "right", maxWidth: 300 },
  info: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E1E3DC" },
  infoCelda: { flex: 1, paddingVertical: 9, paddingHorizontal: 14, borderRightWidth: 1, borderRightColor: "#E1E3DC" },
  infoLabel: { fontFamily: "Helvetica-Bold", fontSize: 6.5, letterSpacing: 0.8, textTransform: "uppercase", color: MUTED },
  infoValor: { fontFamily: "Helvetica-Bold", fontSize: 11, marginTop: 2 },
  cuerpo: { paddingHorizontal: 32, paddingTop: 14 },
  dia: { marginBottom: 14 },
  diaHead: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  diaBadge: { fontFamily: "Helvetica-Bold", fontSize: 8, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, marginRight: 7 },
  diaNombre: { fontFamily: "Helvetica-Bold", fontSize: 13, textTransform: "uppercase" },
  tabla: { borderWidth: 1, borderColor: BORDE, borderRadius: 5 },
  filaHead: { flexDirection: "row", backgroundColor: CARBON, color: "#F3F4EF", borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  celdaHead: { fontFamily: "Helvetica-Bold", fontSize: 6.5, letterSpacing: 0.3, textTransform: "uppercase", paddingVertical: 5, paddingHorizontal: 4 },
  fila: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#E6E8E1", alignItems: "center" },
  celda: { paddingVertical: 5, paddingHorizontal: 4 },
  nota: { fontSize: 7, color: MUTED, marginTop: 1.5 },
  pie: { flexDirection: "row", marginTop: 4 },
  leyenda: { flex: 1, borderWidth: 1, borderColor: BORDE, borderRadius: 5, padding: 10, marginRight: 12 },
  leyendaTitulo: { fontFamily: "Helvetica-Bold", fontSize: 10, textTransform: "uppercase", marginBottom: 5 },
  leyendaTexto: { fontSize: 8, lineHeight: 1.4, marginBottom: 3 },
  negrita: { fontFamily: "Helvetica-Bold" },
  notasCaja: { borderWidth: 1, borderColor: BORDE, borderRadius: 5, padding: 10, marginBottom: 12 },
  qrCaja: { width: 104, alignItems: "center" },
  qrTexto: { fontSize: 7, color: MUTED, textAlign: "center", marginTop: 4 },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: MUTED,
    borderTopWidth: 1,
    borderTopColor: "#E1E3DC",
    paddingTop: 7,
  },
});

function valor(ej: Dia["ejercicios"][number], key: string, i: number) {
  switch (key) {
    case "n":
      return String(i + 1);
    case "series":
      return ej.series != null ? String(ej.series) : "—";
    case "rir":
      return ej.rir != null ? String(ej.rir) : "—";
    default: {
      const v = (ej as Record<string, unknown>)[key];
      return v ? String(v) : "—";
    }
  }
}

export function RutinaPDF({ d }: { d: DatosPDF }) {
  const acento = d.coach.color || "#C6F432";
  const frecuencia = d.dias.length === 1 ? "1 día" : `${d.dias.length} días`;

  return (
    <Document title={`Rutina ${d.cliente ?? ""} - ${d.programa}`} author={d.coach.nombre} creator="RutinaPro">
      <Page size="LETTER" style={s.page}>
        <View style={s.header} fixed={false}>
          <View>
            <Text style={s.coachNombre}>{d.coach.nombre || "Tu entrenador"}</Text>
            <Text style={s.coachSub}>Entrenamiento personalizado</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[s.etiqueta, { color: acento }]}>Programa de rutina</Text>
            <Text style={s.programa}>{d.programa}</Text>
          </View>
        </View>
        <View style={{ height: 4, backgroundColor: acento }} />

        <View style={s.info}>
          <View style={[s.infoCelda, { paddingLeft: 32 }]}>
            <Text style={s.infoLabel}>Cliente</Text>
            <Text style={s.infoValor}>{d.cliente || "—"}</Text>
          </View>
          <View style={s.infoCelda}>
            <Text style={s.infoLabel}>Inicio</Text>
            <Text style={s.infoValor}>{fechaNumerica(d.fechaInicio)}</Text>
          </View>
          <View style={s.infoCelda}>
            <Text style={s.infoLabel}>Final</Text>
            <Text style={s.infoValor}>{fechaNumerica(d.fechaFin)}</Text>
          </View>
          <View style={[s.infoCelda, { borderRightWidth: 0 }]}>
            <Text style={s.infoLabel}>Frecuencia</Text>
            <Text style={s.infoValor}>{frecuencia} / semana</Text>
          </View>
        </View>

        <View style={s.cuerpo}>
          {d.dias.map((dia, di) => (
            <View key={dia.id} style={s.dia} wrap={dia.ejercicios.length > 14}>
              <View style={s.diaHead}>
                <Text style={[s.diaBadge, { backgroundColor: acento }]}>DÍA {di + 1}</Text>
                <Text style={s.diaNombre}>{dia.nombre}</Text>
              </View>
              <View style={s.tabla}>
                <View style={s.filaHead}>
                  {COLS.map((c) => (
                    <Text
                      key={c.key}
                      style={[
                        s.celdaHead,
                        c.width ? { width: c.width } : { flex: 1 },
                        { textAlign: c.align },
                        c.key === "n" ? { paddingLeft: 7 } : {},
                      ]}
                    >
                      {c.label}
                    </Text>
                  ))}
                </View>
                {dia.ejercicios.length === 0 && (
                  <View style={s.fila}>
                    <Text style={[s.celda, { color: MUTED }]}>Sin ejercicios.</Text>
                  </View>
                )}
                {dia.ejercicios.map((ej, i) => (
                  <View key={ej.id} style={[s.fila, { backgroundColor: i % 2 ? "#F6F7F2" : "#FFFFFF" }]} wrap={false}>
                    {COLS.map((c) =>
                      c.key === "nombre" ? (
                        <View key={c.key} style={[s.celda, { flex: 1 }]}>
                          <Text style={s.negrita}>{ej.nombre}</Text>
                          {ej.notas ? <Text style={s.nota}>{ej.notas}</Text> : null}
                        </View>
                      ) : (
                        <Text
                          key={c.key}
                          style={[
                            s.celda,
                            { width: c.width, textAlign: c.align },
                            c.key === "n" || c.key === "series" || c.key === "reps" ? s.negrita : {},
                            c.key === "n" ? { paddingLeft: 7 } : {},
                          ]}
                        >
                          {valor(ej, c.key, i)}
                        </Text>
                      )
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          {d.notas ? (
            <View style={s.notasCaja} wrap={false}>
              <Text style={s.leyendaTitulo}>Notas del coach</Text>
              <Text style={s.leyendaTexto}>{d.notas}</Text>
            </View>
          ) : null}

          <View style={s.pie} wrap={false}>
            <View style={s.leyenda}>
              <Text style={s.leyendaTitulo}>Cómo leer tu rutina</Text>
              <Text style={s.leyendaTexto}>
                <Text style={s.negrita}>RIR (repeticiones en reserva): </Text>
                cuántas repeticiones te deberían quedar al terminar la serie. RIR 2 = podrías hacer 2 más; RIR 0 = al fallo.
              </Text>
              <Text style={s.leyendaTexto}>
                <Text style={s.negrita}>Cadencia 3-1-1: </Text>
                segundos para bajar el peso · pausa · segundos para subirlo.
              </Text>
              <Text style={s.leyendaTexto}>
                <Text style={s.negrita}>Reps 10-12: </Text>
                elige un peso con el que llegues a ese rango respetando el RIR.{" "}
                <Text style={s.negrita}>Descanso: </Text>
                tiempo entre series.
              </Text>
            </View>
            {d.qrDataUrl ? (
              <View style={s.qrCaja}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={d.qrDataUrl} style={{ width: 92, height: 92 }} />
                <Text style={s.qrTexto}>Escanea para ver tu rutina y anotar tus pesos</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>
            {d.coach.nombre}
            {d.coach.telefono ? ` · WhatsApp ${d.coach.telefono}` : ""}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
