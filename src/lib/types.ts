// Tipos compartidos entre la API y la interfaz

export type NivelConfianza = "alto" | "medio" | "bajo";

export interface Partido {
  equipoLocal: string;
  equipoVisitante: string;
  liga: string;
  horaColombia: string; // formato "HH:mm"
  probabilidadBTTS: number; // 0-100
  justificacion: string[]; // 2-3 datos duros
  nivelConfianza: NivelConfianza;
}

export interface AnalisisDiaResponse {
  fecha: string;
  partidos: Partido[];
  mensaje?: string; // aviso si el calendario está flaco
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
