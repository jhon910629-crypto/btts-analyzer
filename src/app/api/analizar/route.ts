import { NextRequest, NextResponse } from "next/server";
import { AI_MODEL, conReintentos, extraerJSON, getAIClient } from "@/lib/ai";
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

  const prompt = `Eres un analista deportivo experto en estadísticas de fútbol con conocimiento profundo de ligas europeas, sudamericanas y mundiales.

Analiza los partidos de fútbol para la fecha ${fecha}. Basándote en tu conocimiento estadístico de los equipos, identifica partidos con alta o baja probabilidad BTTS (ambos equipos anotan).

Para cada partido utiliza estos criterios estadísticos:
- % BTTS histórico de cada equipo en las últimas temporadas (promedio de partidos donde ambos anotaron)
- Promedio de goles anotados y recibidos por partido
- Rendimiento ofensivo/defensivo como local y como visitante
- Historial de encuentros directos entre ambos equipos
- Racha reciente de resultados y forma del equipo
- Contexto motivacional (posición en tabla, importancia del partido, fase de la competición)
- Presencia de delanteros o defensas clave (según conocimiento histórico del equipo)

Considera partidos de ligas activas durante el período de ${fecha} incluyendo: Premier League, LaLiga, Serie A, Bundesliga, Ligue 1, Liga Colombiana, Copa Libertadores, Copa Sudamericana, Champions League, Europa League, partidos internacionales y otras ligas relevantes activas en esa fecha.

Devuelve SOLO un JSON válido (sin texto adicional, sin bloques de código markdown):
{
  "fecha": "${fecha}",
  "partidos": [
    {
      "equipoLocal": "Nombre real del equipo",
      "equipoVisitante": "Nombre real del equipo",
      "liga": "Nombre de la liga / competición",
      "horaColombia": "HH:mm",
      "probabilidadBTTS": número entre 65 y 100,
      "justificacion": [
        "% BTTS histórico del equipo local (ejemplo: 70% en últimas 10 jornadas)",
        "Promedio de goles del equipo visitante (ejemplo: 1.8 goles/partido)",
        "Historial de enfrentamientos directos (ejemplo: 4 de 5 últimos con BTTS)",
        "Contexto motivacional o situación de forma reciente"
      ],
      "nivelConfianza": "alto" | "medio" | "bajo"
    }
  ],
  "partidosBttsNo": [
    {
      "equipoLocal": "Nombre real del equipo",
      "equipoVisitante": "Nombre real del equipo",
      "liga": "Nombre de la liga / competición",
      "horaColombia": "HH:mm",
      "probabilidadBttsNo": número entre 65 y 100,
      "justificacion": [
        "Sólida defensa del equipo local (ejemplo: solo 0.7 goles recibidos/partido)",
        "Equipo visitante con bajo poder ofensivo (ejemplo: 1.1 goles/partido)",
        "Historial defensivo (ejemplo: 6 de 10 partidos con portería a cero)",
        "Contexto del partido (eliminatoria, partido de ida, etc.)"
      ],
      "nivelConfianza": "alto" | "medio" | "bajo"
    }
  ],
  "mensaje": "Solo si no hay suficientes partidos para la fecha indicada"
}

Reglas:
- "partidos": SOLO partidos con probabilidadBTTS ≥ 65%, ordenados mayor a menor
- "partidosBttsNo": SOLO partidos con probabilidadBttsNo ≥ 65%, ordenados mayor a menor
- Horas en Colombia (UTC-5); si no conoces la hora exacta usa "TBD"
- Incluye entre 5 y 15 partidos en total entre ambas categorías
- Usa solo equipos y ligas reales que efectivamente jueguen en esa fecha o período
- Si la fecha ya pasó, analiza partidos conocidos de ese día según tu conocimiento`;

  try {
    const ai = getAIClient();
    const respuesta = await conReintentos(() =>
      ai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
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
