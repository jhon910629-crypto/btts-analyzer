import { nivelDesdeProbabilidad, type AnalisisDiaResponse, type Partido, type PartidoBttsNo } from "./types";
import { formatearFechaLarga } from "./fecha";

const ETIQUETAS_NIVEL_SI: Record<string, { emoji: string; nombre: string; color: string }> = {
  elite: { emoji: "🔴", nombre: "Élite", color: "#f87171" },
  solido: { emoji: "🟡", nombre: "Sólido", color: "#fbbf24" },
  vigilar: { emoji: "🔵", nombre: "Vigilar", color: "#60a5fa" },
};

const ETIQUETAS_NIVEL_NO: Record<string, { emoji: string; nombre: string; color: string }> = {
  elite: { emoji: "🟣", nombre: "Élite", color: "#a78bfa" },
  solido: { emoji: "🔷", nombre: "Sólido", color: "#818cf8" },
  vigilar: { emoji: "🔘", nombre: "Vigilar", color: "#94a3b8" },
};

function tarjetaSiHtml(partido: Partido): string {
  const nivel = nivelDesdeProbabilidad(partido.probabilidadBTTS);
  const etiqueta = nivel ? ETIQUETAS_NIVEL_SI[nivel] : { emoji: "⚪", nombre: "Sin nivel", color: "#94a3b8" };
  return `
    <article class="tarjeta" style="border-left-color: ${etiqueta.color};">
      <header>
        <span class="nivel" style="color: ${etiqueta.color};">${etiqueta.emoji} ${etiqueta.nombre}</span>
        <span class="probabilidad">${partido.probabilidadBTTS}% BTTS</span>
      </header>
      <h3>${partido.equipoLocal} vs ${partido.equipoVisitante}</h3>
      <p class="meta">${partido.liga} · ${partido.horaColombia} (Colombia)</p>
      <ul>${partido.justificacion.map((d) => `<li>${d}</li>`).join("")}</ul>
      <p class="confianza">Confianza: ${partido.nivelConfianza}</p>
    </article>`;
}

function tarjetaNoHtml(partido: PartidoBttsNo): string {
  const nivel = nivelDesdeProbabilidad(partido.probabilidadBttsNo);
  const etiqueta = nivel ? ETIQUETAS_NIVEL_NO[nivel] : { emoji: "⚪", nombre: "Sin nivel", color: "#94a3b8" };
  return `
    <article class="tarjeta tarjeta-no" style="border-left-color: ${etiqueta.color};">
      <header>
        <span class="nivel" style="color: ${etiqueta.color};">${etiqueta.emoji} ${etiqueta.nombre}</span>
        <span class="probabilidad">${partido.probabilidadBttsNo}% BTTS No</span>
      </header>
      <h3>${partido.equipoLocal} vs ${partido.equipoVisitante}</h3>
      <p class="meta">${partido.liga} · ${partido.horaColombia} (Colombia)</p>
      <ul>${partido.justificacion.map((d) => `<li>${d}</li>`).join("")}</ul>
      <p class="confianza">Confianza: ${partido.nivelConfianza} · 🛡️ Portería a cero / un lado</p>
    </article>`;
}

export function generarInformeHtml(datos: AnalisisDiaResponse): string {
  const fechaLarga = formatearFechaLarga(datos.fecha);
  const tarjetasSi = datos.partidos.map(tarjetaSiHtml).join("\n");
  const tarjetasNo = (datos.partidosBttsNo ?? []).map(tarjetaNoHtml).join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Informe BTTS - ${fechaLarga}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    background: linear-gradient(180deg, #0b1120 0%, #111827 100%);
    color: #e2e8f0;
  }
  .contenedor { max-width: 800px; margin: 0 auto; }
  h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
  .subtitulo { color: #94a3b8; margin-top: 0; margin-bottom: 2rem; text-transform: capitalize; }
  .seccion-titulo {
    display: flex; align-items: center; gap: 1rem; margin: 2rem 0 1rem;
  }
  .seccion-titulo hr { flex: 1; border: none; border-top: 1px solid; opacity: 0.2; }
  .badge-si { color: #34d399; border-color: #34d399; }
  .badge-no { color: #a78bfa; border-color: #a78bfa; }
  .badge {
    white-space: nowrap; border: 1px solid; border-radius: 9999px;
    padding: 0.25rem 1rem; font-size: 0.8rem; font-weight: 700;
  }
  .mensaje {
    background: #1e293b; border: 1px solid #334155;
    border-radius: 0.75rem; padding: 1rem 1.25rem;
    margin-bottom: 1.5rem; color: #cbd5e1;
  }
  .tarjeta {
    background: #1e293b; border-radius: 0.75rem;
    border-left: 4px solid #475569; padding: 1.25rem 1.5rem;
    margin-bottom: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  }
  .tarjeta-no { background: #1a1b2e; }
  .tarjeta header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600;
  }
  .tarjeta h3 { margin: 0.25rem 0; font-size: 1.125rem; }
  .tarjeta .meta { color: #94a3b8; margin: 0 0 0.75rem 0; font-size: 0.875rem; }
  .tarjeta ul { margin: 0 0 0.5rem 0; padding-left: 1.25rem; color: #cbd5e1; }
  .tarjeta li { margin-bottom: 0.25rem; }
  .tarjeta .confianza { margin: 0; font-size: 0.8rem; color: #94a3b8; text-transform: capitalize; }
  .probabilidad { color: #e2e8f0; }
  footer { margin-top: 2rem; text-align: center; color: #64748b; font-size: 0.8rem; }
</style>
</head>
<body>
  <div class="contenedor">
    <h1>⚽ Informe BTTS del día</h1>
    <p class="subtitulo">${fechaLarga}</p>
    ${datos.mensaje ? `<div class="mensaje">${datos.mensaje}</div>` : ""}

    <div class="seccion-titulo">
      <hr class="badge-si" />
      <span class="badge badge-si">⚽ BTTS SÍ — Ambos Marcan</span>
      <hr class="badge-si" />
    </div>
    ${tarjetasSi || "<p>No se encontraron partidos BTTS Sí ≥65% para esta fecha.</p>"}

    <div class="seccion-titulo">
      <hr class="badge-no" />
      <span class="badge badge-no">🛡️ BTTS NO — Al Menos Uno No Marca</span>
      <hr class="badge-no" />
    </div>
    ${tarjetasNo || "<p>No se encontraron partidos BTTS No ≥65% para esta fecha.</p>"}

    <footer>Generado por BTTS Analyzer · Solo con fines informativos</footer>
  </div>
</body>
</html>`;
}

export function descargarInformeHtml(datos: AnalisisDiaResponse): void {
  const html = generarInformeHtml(datos);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `informe-btts-${datos.fecha}.html`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
