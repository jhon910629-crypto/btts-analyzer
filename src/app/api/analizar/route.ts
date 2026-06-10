import { NextRequest, NextResponse } from "next/server";
import { GEMINI_MODEL, extraerJSON, getGeminiClient } from "@/lib/gemini";
import type { AnalisisDiaResponse } from "@/lib/types";

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

  const prompt = `Busca los partidos de fútbol reales programados para ${fecha}. Para cada uno evalúa: % BTTS últimos 5-10 partidos de cada equipo, promedio de goles a favor y en contra, rendimiento local/visitante, racha de porterías a cero y contexto motivacional.

Devuelve SOLO un JSON válido (sin texto adicional, sin bloques de código markdown) con esta forma exacta:
{
  "fecha": "${fecha}",
  "partidos": [
    {
      "equipoLocal": "string",
      "equipoVisitante": "string",
      "liga": "string",
      "horaColombia": "HH:mm",
      "probabilidadBTTS": número entre 65 y 100,
      "justificacion": ["dato duro 1", "dato duro 2", "dato duro 3"],
      "nivelConfianza": "alto" | "medio" | "bajo"
    }
  ],
  "mensaje": "opcional, solo si el calendario está flaco o no hay suficientes partidos sobre el umbral"
}

Incluye SOLO partidos que superen 65% de probabilidad BTTS, ordenados de mayor a menor probabilidad. Las horas deben estar convertidas a hora de Colombia (UTC-5). Si no hay suficientes partidos sobre el umbral, indícalo honestamente en "mensaje" y deja "partidos" como un arreglo vacío o más corto. Nunca inventes fixtures.`;

  try {
    const ai = getGeminiClient();
    const respuesta = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const texto = respuesta.text;
    if (!texto) {
      throw new Error("Gemini no devolvió contenido de texto.");
    }

    const datos = extraerJSON<AnalisisDiaResponse>(texto);

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
