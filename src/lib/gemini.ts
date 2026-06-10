import { GoogleGenAI } from "@google/genai";

// Modelo Gemini usado para los análisis. Se puede sobreescribir con la
// variable de entorno GEMINI_MODEL si se requiere otra versión.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta la variable de entorno GEMINI_API_KEY. Configúrala en .env.local."
    );
  }
  return new GoogleGenAI({ apiKey });
}

// Reintenta una llamada a Gemini cuando el modelo responde con errores
// transitorios de disponibilidad (503 UNAVAILABLE) o de cuota (429).
export async function conReintentos<T>(
  fn: () => Promise<T>,
  intentos = 3,
  esperaMs = 1500
): Promise<T> {
  for (let intento = 1; intento <= intentos; intento++) {
    try {
      return await fn();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      const transitorio = /503|UNAVAILABLE|429|RESOURCE_EXHAUSTED/i.test(mensaje);
      if (!transitorio || intento === intentos) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, esperaMs * intento));
    }
  }
  throw new Error("No se pudo completar la solicitud tras varios intentos.");
}

// Extrae el primer bloque JSON válido de un texto de respuesta de Gemini,
// que puede venir envuelto en bloques de código ```json ... ``` o con texto
// adicional alrededor.
export function extraerJSON<T>(texto: string): T {
  const limpio = texto.trim();

  // Intento directo
  try {
    return JSON.parse(limpio) as T;
  } catch {
    // continúa
  }

  // Bloque de código ```json ... ``` o ``` ... ```
  const bloque = limpio.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (bloque) {
    try {
      return JSON.parse(bloque[1].trim()) as T;
    } catch {
      // continúa
    }
  }

  // Primer { ... } o [ ... ] balanceado dentro del texto
  const inicio = limpio.search(/[[{]/);
  if (inicio !== -1) {
    const fragmento = limpio.slice(inicio);
    for (let fin = fragmento.length; fin > 0; fin--) {
      const candidato = fragmento.slice(0, fin);
      try {
        return JSON.parse(candidato) as T;
      } catch {
        continue;
      }
    }
  }

  throw new Error("No se pudo extraer JSON válido de la respuesta de Gemini.");
}
