import { NextRequest, NextResponse } from "next/server";
import { GEMINI_MODEL, conReintentos, extraerJSON, getGeminiClient } from "@/lib/gemini";

export const maxDuration = 60;
import type { AnalisisProfundoResponse } from "@/lib/types";

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

  const prompt = `Busca en internet y haz un análisis profundo de probabilidad BTTS (ambos equipos anotan) para el partido ${equipoLocal} vs ${equipoVisitante} programado para ${fecha}. Apóyate en resultados de búsqueda de sitios de estadísticas y análisis deportivo como Flashscore, SofaScore, WhoScored, FootyStats, Transfermarkt, ESPN y similares. Investiga: % BTTS de los últimos 5-10 partidos de cada equipo, promedio de goles a favor y en contra, rendimiento como local/visitante, racha de porterías a cero, lesiones/sanciones relevantes y contexto motivacional (posición en tabla, importancia del partido).

Devuelve SOLO un JSON válido (sin texto adicional, sin bloques de código markdown) con esta forma exacta:
{
  "partido": {
    "equipoLocal": "${equipoLocal}",
    "equipoVisitante": "${equipoVisitante}",
    "liga": "string",
    "horaColombia": "HH:mm"
  },
  "probabilidadBTTS": número entre 0 y 100,
  "resumen": "resumen ejecutivo de 2-3 frases",
  "estadisticasLocal": ["dato 1", "dato 2", "dato 3"],
  "estadisticasVisitante": ["dato 1", "dato 2", "dato 3"],
  "contextoMotivacional": "texto",
  "nivelConfianza": "alto" | "medio" | "bajo",
  "mensaje": "opcional, solo si no se encontró información suficiente"
}

La hora debe estar convertida a hora de Colombia (UTC-5). Si no encuentras el partido o información suficiente, dilo honestamente en "mensaje" y usa los valores que sí puedas confirmar. Nunca inventes datos.`;

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

    const datos = extraerJSON<AnalisisProfundoResponse>(texto);

    return NextResponse.json(datos);
  } catch (error) {
    console.error("Error en /api/analizar-profundo:", error);
    const detalle = error instanceof Error ? error.message : "Error desconocido.";

    if (/429|RESOURCE_EXHAUSTED|quota/i.test(detalle)) {
      return NextResponse.json(
        {
          error:
            "Cuota de la API de Gemini agotada (límite gratuito del día). " +
            "Espera hasta mañana o activa facturación en aistudio.google.com.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `No se pudo completar el análisis: ${detalle}` },
      { status: 500 }
    );
  }
}
