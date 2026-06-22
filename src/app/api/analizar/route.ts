import { NextRequest, NextResponse } from "next/server";
import { AI_MODEL, conReintentos, extraerJSON, getAIClient } from "@/lib/ai";
import { obtenerPartidos } from "@/lib/fixtures";
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

  // 1. Obtener partidos reales del día desde ESPN (sin API key)
  let partidos: Awaited<ReturnType<typeof obtenerPartidos>> = [];
  try {
    partidos = await obtenerPartidos(fecha);
  } catch {
    // Si ESPN falla, continuamos con lista vacía (Groq indicará el problema)
  }

  const hayPartidos = partidos.length > 0;

  const listaPartidos = hayPartidos
    ? partidos
        .slice(0, 40) // máximo 40 para no saturar el contexto
        .map((p) => `- ${p.equipoLocal} vs ${p.equipoVisitante} | ${p.liga} | ${p.horaColombia} hora Colombia`)
        .join("\n")
    : "No se encontraron partidos programados en las ligas monitoreadas para esta fecha.";

  const prompt = `Eres un analista deportivo experto en estadísticas de fútbol.

${hayPartidos
  ? `A continuación están los partidos REALES programados para ${fecha}, obtenidos de fuentes oficiales. Analiza SOLO estos partidos — no inventes ni agregues otros:`
  : `No se encontraron partidos en las ligas principales para ${fecha}.`}

${listaPartidos}

${hayPartidos ? `
Para cada partido que supere los umbrales, evalúa la probabilidad BTTS basándote en tu conocimiento estadístico:
- % de partidos con BTTS en el historial reciente de cada equipo
- Promedio de goles anotados y recibidos por partido (últimas temporadas)
- Rendimiento como local vs visitante
- Historial de enfrentamientos directos
- Forma reciente y contexto motivacional

Clasifica en DOS categorías:
• BTTS SÍ: probabilidad ≥ 65% de que AMBOS equipos anoten
• BTTS NO: probabilidad ≥ 65% de que AL MENOS UNO no anote (portería a cero)

Devuelve SOLO un JSON válido (sin texto adicional, sin bloques de código):
{
  "fecha": "${fecha}",
  "partidos": [
    {
      "equipoLocal": "nombre exacto del equipo de la lista",
      "equipoVisitante": "nombre exacto del equipo de la lista",
      "liga": "liga de la lista",
      "horaColombia": "HH:mm de la lista",
      "probabilidadBTTS": número entre 65 y 100,
      "justificacion": [
        "% BTTS histórico del equipo local con dato concreto",
        "Promedio de goles del equipo visitante con dato concreto",
        "Historial de enfrentamientos directos",
        "Contexto motivacional o forma reciente"
      ],
      "nivelConfianza": "alto" | "medio" | "bajo"
    }
  ],
  "partidosBttsNo": [
    {
      "equipoLocal": "nombre exacto del equipo de la lista",
      "equipoVisitante": "nombre exacto del equipo de la lista",
      "liga": "liga de la lista",
      "horaColombia": "HH:mm de la lista",
      "probabilidadBttsNo": número entre 65 y 100,
      "justificacion": [
        "Solidez defensiva del equipo local con dato concreto",
        "Poder ofensivo limitado del visitante",
        "Historial de porterías a cero",
        "Contexto del partido"
      ],
      "nivelConfianza": "alto" | "medio" | "bajo"
    }
  ],
  "mensaje": ""
}

Reglas:
- Usa EXACTAMENTE los nombres de equipos y horas de la lista proporcionada
- En "partidos": solo BTTS Sí ≥ 65%, ordenados de mayor a menor probabilidad
- En "partidosBttsNo": solo BTTS No ≥ 65%, ordenados de mayor a menor
- Si un partido no supera ningún umbral, no lo incluyas en ninguna sección
- Si no conoces suficiente sobre algún equipo, ponlo con nivelConfianza "bajo"
` : `
Devuelve este JSON exacto:
{
  "fecha": "${fecha}",
  "partidos": [],
  "partidosBttsNo": [],
  "mensaje": "No se encontraron partidos en las ligas monitoreadas para esta fecha. Intenta con otra fecha o verifica que haya partidos programados."
}
`}`;

  try {
    const ai = getAIClient();
    const respuesta = await conReintentos(() =>
      ai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 4096,
      })
    );

    const texto = respuesta.choices[0]?.message?.content ?? "";
    if (!texto) throw new Error("El modelo no devolvió contenido.");

    const datos = extraerJSON<AnalisisDiaResponse>(texto);
    if (!Array.isArray(datos.partidosBttsNo)) datos.partidosBttsNo = [];

    return NextResponse.json(datos);
  } catch (error) {
    console.error("Error en /api/analizar:", error);
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
