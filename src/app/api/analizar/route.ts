import { NextRequest, NextResponse } from "next/server";
import { GEMINI_MODEL, conReintentos, extraerJSON, getGeminiClient } from "@/lib/gemini";
import type { AnalisisDiaResponse } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let fecha: unknown;
  try {
    ({ fecha } = await request.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  if (typeof fecha !== "string" || !fecha.trim()) {
    return NextResponse.json({ error: "Debes indicar una fecha." }, { status: 400 });
  }

  const prompt = `Eres un analista deportivo experto en estadísticas de fútbol. Busca en internet los partidos de fútbol reales programados para ${fecha} usando sitios como Flashscore, SofaScore, WhoScored, FootyStats, Transfermarkt y ESPN.

Para cada partido analiza con precisión:
- % de partidos BTTS (ambos equipos anotan) en los últimos 10 encuentros de cada equipo
- Promedio de goles a favor y en contra por partido (últimas 10 jornadas)
- Rendimiento como local / visitante por separado
- Rachas actuales (goles marcados / recibidos consecutivos)
- Lesiones y suspensiones que afecten la línea ofensiva o defensiva
- Contexto motivacional (¿necesitan ganar?, ¿posición en tabla?, ¿rival directo?)
- Cuotas y estadísticas de casas de apuestas como referencia (sin recomendar apuestas)

Clasifica los partidos en DOS categorías:

1. **BTTS SÍ** (ambos anotan): partidos donde la probabilidad de que AMBOS equipos marquen es ≥65%
2. **BTTS NO** (al menos uno no anota): partidos donde la probabilidad de que AL MENOS UN equipo NO marque es ≥65% (portería a cero probable, partido defensivo o goleo de un solo lado)

Devuelve SOLO un JSON válido (sin texto adicional, sin bloques de código markdown) con esta estructura exacta:
{
  "fecha": "${fecha}",
  "partidos": [
    {
      "equipoLocal": "string",
      "equipoVisitante": "string",
      "liga": "string",
      "horaColombia": "HH:mm",
      "probabilidadBTTS": número entre 65 y 100,
      "justificacion": ["dato estadístico 1", "dato estadístico 2", "dato estadístico 3", "dato estadístico 4"],
      "nivelConfianza": "alto" | "medio" | "bajo"
    }
  ],
  "partidosBttsNo": [
    {
      "equipoLocal": "string",
      "equipoVisitante": "string",
      "liga": "string",
      "horaColombia": "HH:mm",
      "probabilidadBttsNo": número entre 65 y 100,
      "justificacion": ["dato estadístico 1", "dato estadístico 2", "dato estadístico 3", "dato estadístico 4"],
      "nivelConfianza": "alto" | "medio" | "bajo"
    }
  ],
  "mensaje": "solo si el calendario está flaco o no hay suficientes datos"
}

Reglas importantes:
- En "partidos" incluye SOLO los de BTTS Sí ≥65%, ordenados de mayor a menor probabilidad
- En "partidosBttsNo" incluye SOLO los de BTTS No ≥65%, ordenados de mayor a menor probabilidadBttsNo
- Las horas van en hora Colombia (UTC-5)
- Cada justificacion debe tener datos duros: porcentajes reales, promedios de goles, rachas concretas
- Si no hay suficientes partidos sobre el umbral en alguna categoría, deja ese arreglo vacío
- Nunca inventes fixtures ni datos estadísticos`;

  try {
    const ai = getGeminiClient();
    const respuesta = await conReintentos(() =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      })
    );

    const texto = respuesta.text;
    if (!texto) {
      throw new Error("Gemini no devolvió contenido de texto.");
    }

    const datos = extraerJSON<AnalisisDiaResponse>(texto);

    // Garantiza que partidosBttsNo siempre exista aunque Gemini lo omita
    if (!Array.isArray(datos.partidosBttsNo)) {
      datos.partidosBttsNo = [];
    }

    return NextResponse.json(datos);
  } catch (error) {
    console.error("Error en /api/analizar:", error);
    const detalle = error instanceof Error ? error.message : "Error desconocido.";
    return NextResponse.json(
      { error: `No se pudo completar el análisis: ${detalle}` },
      { status: 500 }
    );
  }
}
