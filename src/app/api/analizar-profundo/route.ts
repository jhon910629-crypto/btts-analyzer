import { NextRequest, NextResponse } from "next/server";
import { AI_MODEL, conReintentos, extraerJSON, getAIClient } from "@/lib/ai";
import type { AnalisisProfundoResponse } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let equipoLocal: unknown;
  let equipoVisitante: unknown;
  let fecha: unknown;

  try {
    ({ equipoLocal, equipoVisitante, fecha } = await request.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  if (
    typeof equipoLocal !== "string" ||
    typeof equipoVisitante !== "string" ||
    !equipoLocal.trim() ||
    !equipoVisitante.trim() ||
    typeof fecha !== "string" ||
    !fecha.trim()
  ) {
    return NextResponse.json(
      { error: "Debes indicar equipoLocal, equipoVisitante y fecha." },
      { status: 400 }
    );
  }

  const prompt = `Eres un analista deportivo experto. Realiza un análisis profundo de probabilidad BTTS (ambos equipos anotan) para el partido:

${equipoLocal} vs ${equipoVisitante}
Fecha: ${fecha}

Investiga en profundidad basándote en tu conocimiento estadístico:
1. % BTTS de los últimos 10 partidos de cada equipo (separado: como local / como visitante)
2. Promedio de goles marcados y recibidos por partido en la temporada actual y anterior
3. Historial de enfrentamientos directos: últimos 5 partidos cara a cara con resultados
4. Delanteros y defensas clave: estado conocido del plantel
5. Posición en tabla y contexto motivacional del partido
6. Fase de la competición (liga regular, playoff, eliminatoria, grupo)
7. Estadísticas defensivas: porterías a cero, goles recibidos en casa/fuera

Devuelve SOLO un JSON válido (sin texto adicional, sin bloques de código markdown):
{
  "partido": {
    "equipoLocal": "${equipoLocal}",
    "equipoVisitante": "${equipoVisitante}",
    "liga": "string",
    "horaColombia": "HH:mm o TBD"
  },
  "probabilidadBTTS": número entre 0 y 100,
  "resumen": "Resumen ejecutivo de 2-3 frases con los argumentos principales",
  "estadisticasLocal": [
    "% BTTS como local en últimas 10 jornadas",
    "Promedio de goles marcados/recibidos en casa",
    "Racha ofensiva o defensiva reciente"
  ],
  "estadisticasVisitante": [
    "% BTTS como visitante en últimas 10 jornadas",
    "Promedio de goles marcados/recibidos fuera",
    "Racha ofensiva o defensiva reciente"
  ],
  "contextoMotivacional": "Descripción del contexto: posición en tabla, importancia del partido, necesidad de resultado",
  "nivelConfianza": "alto" | "medio" | "bajo",
  "mensaje": "Solo si no tienes suficiente información sobre estos equipos"
}`;

  try {
    const ai = getAIClient();
    const respuesta = await conReintentos(() =>
      ai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2048,
      })
    );

    const texto = respuesta.choices[0]?.message?.content ?? "";
    if (!texto) throw new Error("El modelo no devolvió contenido.");

    const datos = extraerJSON<AnalisisProfundoResponse>(texto);
    return NextResponse.json(datos);
  } catch (error) {
    console.error("Error en /api/analizar-profundo:", error);
    const detalle = error instanceof Error ? error.message : "Error desconocido.";

    if (/429|rate.limit|too many/i.test(detalle)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Espera un momento e intenta de nuevo." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `No se pudo completar el análisis: ${detalle}` },
      { status: 500 }
    );
  }
}
