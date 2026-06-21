import Groq from "groq-sdk";

export const AI_MODEL = process.env.AI_MODEL || "llama-3.3-70b-versatile";

export function getAIClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta la variable de entorno GROQ_API_KEY. Configúrala en .env.local."
    );
  }
  return new Groq({ apiKey });
}

export async function conReintentos<T>(
  fn: () => Promise<T>,
  intentos = 5,
  esperaMs = 2000
): Promise<T> {
  for (let intento = 1; intento <= intentos; intento++) {
    try {
      return await fn();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      const transitorio = /503|UNAVAILABLE|429|rate.limit|too many/i.test(mensaje);
      if (!transitorio || intento === intentos) throw error;
      await new Promise((resolve) => setTimeout(resolve, esperaMs * intento));
    }
  }
  throw new Error("No se pudo completar la solicitud tras varios intentos.");
}

export function extraerJSON<T>(texto: string): T {
  const limpio = texto.trim();
  try { return JSON.parse(limpio) as T; } catch { /* continúa */ }

  const bloque = limpio.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (bloque) {
    try { return JSON.parse(bloque[1].trim()) as T; } catch { /* continúa */ }
  }

  const inicio = limpio.search(/[[{]/);
  if (inicio !== -1) {
    const fragmento = limpio.slice(inicio);
    for (let fin = fragmento.length; fin > 0; fin--) {
      try { return JSON.parse(fragmento.slice(0, fin)) as T; } catch { continue; }
    }
  }

  throw new Error("No se pudo extraer JSON válido de la respuesta.");
}
