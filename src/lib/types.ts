// Tipos compartidos entre la API y la interfaz

export type NivelConfianza = "alto" | "medio" | "bajo";

export interface Partido {
  equipoLocal: string;
  equipoVisitante: string;
  liga: string;
  horaColombia: string; // formato "HH:mm"
  probabilidadBTTS: number; // 0-100
  justificacion: string[]; // 3-4 datos duros
  nivelConfianza: NivelConfianza;
}

export interface PartidoBttsNo {
  equipoLocal: string;
  equipoVisitante: string;
  liga: string;
  horaColombia: string;
  probabilidadBttsNo: number; // 65-100: prob de que al menos un equipo NO anote
  justificacion: string[];
  nivelConfianza: NivelConfianza;
}

export interface AnalisisDiaResponse {
  fecha: string;
  partidos: Partido[];              // BTTS Sí: ambos anotan ≥65%
  partidosBttsNo: PartidoBttsNo[];  // BTTS No: al menos uno NO anota ≥65%
  mensaje?: string;
}

export interface AnalisisProfundoResponse {
  partido: {
    equipoLocal: string;
    equipoVisitante: string;
    liga: string;
    horaColombia: string;
  };
  probabilidadBTTS: number;
  resumen: string;
  estadisticasLocal: string[];
  estadisticasVisitante: string[];
  contextoMotivacional: string;
  nivelConfianza: NivelConfianza;
  mensaje?: string;
}

export function nivelDesdeProbabilidad(probabilidad: number): "elite" | "solido" | "vigilar" | null {
  if (probabilidad >= 75) return "elite";
  if (probabilidad >= 70) return "solido";
  if (probabilidad >= 65) return "vigilar";
  return null;
}
