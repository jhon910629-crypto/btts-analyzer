// Utilidades de fecha para la zona horaria de Colombia (UTC-5, sin horario de verano)

export function fechaColombiaHoy(): string {
  // "en-CA" produce el formato YYYY-MM-DD
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

export function formatearFechaLarga(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia, 12));
  return fecha.toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
