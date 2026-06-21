import * as XLSX from "xlsx";
import { nivelDesdeProbabilidad, type AnalisisDiaResponse } from "./types";

const NOMBRE_NIVEL: Record<string, string> = {
  elite: "Élite (≥75%)",
  solido: "Sólido (70-74%)",
  vigilar: "Vigilar (65-69%)",
};

const COLS_ANCHO = [
  { wch: 16 },
  { wch: 22 },
  { wch: 22 },
  { wch: 20 },
  { wch: 14 },
  { wch: 20 },
  { wch: 10 },
  { wch: 70 },
];

export function descargarInformeExcel(datos: AnalisisDiaResponse): void {
  const libro = XLSX.utils.book_new();

  // Hoja 1: BTTS Sí
  const filasSi = datos.partidos.map((p) => {
    const nivel = nivelDesdeProbabilidad(p.probabilidadBTTS);
    return {
      Nivel: nivel ? NOMBRE_NIVEL[nivel] : "Sin nivel",
      "Equipo local": p.equipoLocal,
      "Equipo visitante": p.equipoVisitante,
      Liga: p.liga,
      "Hora (Colombia)": p.horaColombia,
      "Prob. BTTS Sí (%)": p.probabilidadBTTS,
      Confianza: p.nivelConfianza,
      Justificación: p.justificacion.join(" | "),
    };
  });

  const hojaSi = filasSi.length
    ? XLSX.utils.json_to_sheet(filasSi)
    : XLSX.utils.aoa_to_sheet([["No se encontraron partidos BTTS Sí para esta fecha."]]);
  hojaSi["!cols"] = COLS_ANCHO;
  XLSX.utils.book_append_sheet(libro, hojaSi, "BTTS Sí — Ambos Marcan");

  // Hoja 2: BTTS No
  const filasNo = (datos.partidosBttsNo ?? []).map((p) => {
    const nivel = nivelDesdeProbabilidad(p.probabilidadBttsNo);
    return {
      Nivel: nivel ? NOMBRE_NIVEL[nivel] : "Sin nivel",
      "Equipo local": p.equipoLocal,
      "Equipo visitante": p.equipoVisitante,
      Liga: p.liga,
      "Hora (Colombia)": p.horaColombia,
      "Prob. BTTS No (%)": p.probabilidadBttsNo,
      Confianza: p.nivelConfianza,
      Justificación: p.justificacion.join(" | "),
    };
  });

  const hojaNo = filasNo.length
    ? XLSX.utils.json_to_sheet(filasNo)
    : XLSX.utils.aoa_to_sheet([["No se encontraron partidos BTTS No para esta fecha."]]);
  hojaNo["!cols"] = COLS_ANCHO;
  XLSX.utils.book_append_sheet(libro, hojaNo, "BTTS No — Portería a Cero");

  if (datos.mensaje) {
    const hojaNota = XLSX.utils.aoa_to_sheet([["Nota del análisis"], [datos.mensaje]]);
    hojaNota["!cols"] = [{ wch: 100 }];
    XLSX.utils.book_append_sheet(libro, hojaNota, "Notas");
  }

  XLSX.writeFile(libro, `informe-btts-${datos.fecha}.xlsx`);
}
