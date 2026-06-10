@AGENTS.md

# BTTS Analyzer

Aplicación Next.js (App Router, TypeScript, Tailwind CSS) que analiza partidos
de fútbol del día y estima la probabilidad de que ambos equipos anoten (BTTS),
usando la API de Gemini con la herramienta de Google Search (grounding).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- `@google/genai` para llamadas al modelo (ver `src/lib/gemini.ts`)
- Sin base de datos: todo se calcula bajo demanda en las API routes

## Estructura clave

- `src/app/page.tsx` – interfaz principal (selector de fecha, tarjetas, exportar HTML)
- `src/app/api/analizar/route.ts` – análisis de la jornada completa
- `src/app/api/analizar-profundo/route.ts` – análisis profundo de un partido
- `src/lib/gemini.ts` – cliente Gemini, modelo usado y parsing de JSON
- `src/lib/types.ts` – tipos compartidos
- `src/lib/exportarHtml.ts` – generación del informe HTML descargable

## Comandos

```
npm run dev    # desarrollo en http://localhost:3000
npm run build  # build de producción
npm run start  # servir build de producción
npm run lint   # eslint
```

## Variables de entorno

- `GEMINI_API_KEY` (obligatoria) – clave de la API de Gemini (Google AI Studio), ver `.env.example`
- `GEMINI_MODEL` (opcional) – sobreescribe el modelo por defecto (`gemini-2.5-flash`)

## Reglas

- Nunca commitear `.env.local` ni exponer `GEMINI_API_KEY`.
- La interfaz y los textos visibles deben estar en español.
- Las API routes nunca deben inventar partidos: si Gemini no encuentra datos
  suficientes, debe devolver un `mensaje` honesto y un arreglo vacío/corto.
- Las horas mostradas siempre deben estar en hora de Colombia (UTC-5).
