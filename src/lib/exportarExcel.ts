import * as XLSX from "xlsx";
import { nivelDesdeProbabilidad, type AnalisisDiaResponse } from "./types";

const NOMBRE_NIVEL: Record<string, string> = {
  elite: "Élite (≥75%)",
  solido: "Sólido (70-74%)",
  vigilar: "Vigilar (65-69%)",
};

export function descargarInformeExcel(datos: AnalisisDiaResponse): void {
  const filas = datos.partidos.map((partido) => {
    const nivel = nivelDesdeProbabilidad(partido.probabilidadBTTS);
    return {
      Nivel: nivel ? NOMBRE_NIVEL[nivel] : "Sin nivel",
      "Equipo local": partido.equipoLocal,
      "Equipo visitante": partido.equipoVisitante,
      Liga: partido.liga,
      "Hora (Colombia)": partido.horaColombia,
      "Probabilidad BTTS (%)": partido.probabilidadBTTS,
      "Confianza": partido.nivelConfianza,
      Justificación: partido.justificacion.join(" | "),
    };
  });

  const hoja = XLSX.utils.json_to_sheet(filas);
  hoja["!cols"] = [
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
    { wch: 14 },
    { wch: 20 },
    { wch: 10 },
    { wch: 60 },
  ];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Partidos BTTS");

  if (datos.mensaje) {
    const hojaMensaje = XLSX.utils.aoa_to_sheet([["Mensaje"], [datos.mensaje]]);
    hojaMensaje["!cols"] = [{ wch: 100 }];
    XLSX.utils.book_append_sheet(libro, hojaMensaje, "Notas");
  }

  XLSX.writeFile(libro, `informe-btts-${datos.fecha}.xlsx`);
}
