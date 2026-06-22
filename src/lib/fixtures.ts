export interface Fixture {
  equipoLocal: string;
  equipoVisitante: string;
  liga: string;
  horaColombia: string;
}

// Ligas y torneos cubiertos en ESPN (sin API key, 100% gratis)
// Incluye torneos de verano, ligas de todo el año y competiciones internacionales
const LIGAS_ESPN = [
  // Torneos internacionales activos todo el año
  { slug: "fifa.cwc",               nombre: "FIFA Club World Cup" },
  { slug: "fifa.worldq.conmebol",   nombre: "Eliminatorias CONMEBOL" },
  { slug: "fifa.worldq.concacaf",   nombre: "Eliminatorias CONCACAF" },
  { slug: "fifa.worldq.europe",     nombre: "Eliminatorias UEFA" },
  { slug: "fifa.worldq.afc",        nombre: "Eliminatorias AFC" },
  { slug: "fifa.worldq.caf",        nombre: "Eliminatorias CAF" },
  { slug: "fifa.friendly",          nombre: "Amistoso Internacional" },
  // Ligas europeas (temporada ago-mayo)
  { slug: "eng.1",                  nombre: "Premier League" },
  { slug: "esp.1",                  nombre: "LaLiga" },
  { slug: "ita.1",                  nombre: "Serie A" },
  { slug: "ger.1",                  nombre: "Bundesliga" },
  { slug: "fra.1",                  nombre: "Ligue 1" },
  { slug: "ned.1",                  nombre: "Eredivisie" },
  { slug: "por.1",                  nombre: "Primeira Liga" },
  { slug: "sco.1",                  nombre: "Scottish Premiership" },
  { slug: "tur.1",                  nombre: "Süper Lig" },
  { slug: "gre.1",                  nombre: "Super League Grecia" },
  { slug: "bel.1",                  nombre: "Pro League Bélgica" },
  { slug: "aut.1",                  nombre: "Bundesliga Austria" },
  { slug: "cze.1",                  nombre: "Czech Liga" },
  { slug: "pol.1",                  nombre: "Ekstraklasa" },
  { slug: "rus.1",                  nombre: "Premier Liga Rusia" },
  // Copas europeas (ago-mayo)
  { slug: "uefa.champions",         nombre: "Champions League" },
  { slug: "uefa.europa",            nombre: "Europa League" },
  { slug: "uefa.europaconf",        nombre: "Conference League" },
  { slug: "uefa.nations",           nombre: "Nations League" },
  // América (ligas activas todo el año)
  { slug: "col.1",                  nombre: "Liga BetPlay (Colombia)" },
  { slug: "bra.1",                  nombre: "Brasileirão Serie A" },
  { slug: "bra.2",                  nombre: "Brasileirão Serie B" },
  { slug: "arg.1",                  nombre: "Liga Profesional Argentina" },
  { slug: "mex.1",                  nombre: "Liga MX" },
  { slug: "usa.1",                  nombre: "MLS" },
  { slug: "usa.open",               nombre: "US Open Cup" },
  { slug: "chi.1",                  nombre: "Primera División Chile" },
  { slug: "per.1",                  nombre: "Liga 1 Perú" },
  { slug: "ecu.1",                  nombre: "LigaPro Ecuador" },
  { slug: "uru.1",                  nombre: "Uruguayan Primera División" },
  { slug: "bol.1",                  nombre: "División Profesional Bolivia" },
  { slug: "par.1",                  nombre: "División Intermedia Paraguay" },
  { slug: "ven.1",                  nombre: "Primera División Venezuela" },
  // Copas sudamericanas
  { slug: "conmebol.libertadores",  nombre: "Copa Libertadores" },
  { slug: "conmebol.sudamericana",  nombre: "Copa Sudamericana" },
  { slug: "concacaf.champions",     nombre: "CONCACAF Champions Cup" },
  { slug: "concacaf.nations.league",nombre: "Nations League CONCACAF" },
  // Asia / resto del mundo
  { slug: "jpn.1",                  nombre: "J1 League (Japón)" },
  { slug: "kor.1",                  nombre: "K League 1 (Corea)" },
  { slug: "chn.super",              nombre: "Chinese Super League" },
  { slug: "sau.1",                  nombre: "Saudi Pro League" },
  { slug: "aus.1",                  nombre: "A-League (Australia)" },
];

function utcToColombia(fechaISO: string): string {
  try {
    const d = new Date(fechaISO);
    const h = ((d.getUTCHours() - 5) + 24) % 24;
    const m = d.getUTCMinutes();
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  } catch {
    return "TBD";
  }
}

export async function obtenerPartidos(fecha: string): Promise<Fixture[]> {
  const fechaSinGuiones = fecha.replace(/-/g, "");

  const resultados = await Promise.allSettled(
    LIGAS_ESPN.map(async ({ slug, nombre }) => {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${fechaSinGuiones}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [] as Fixture[];

      const json = await res.json();
      const eventos: any[] = json.events ?? [];

      return eventos
        .map((ev): Fixture | null => {
          const comp = ev.competitions?.[0];
          const local = comp?.competitors?.find((c: any) => c.homeAway === "home");
          const visitante = comp?.competitors?.find((c: any) => c.homeAway === "away");
          if (!local?.team?.displayName || !visitante?.team?.displayName) return null;
          return {
            equipoLocal: local.team.displayName,
            equipoVisitante: visitante.team.displayName,
            liga: nombre,
            horaColombia: ev.date ? utcToColombia(ev.date) : "TBD",
          };
        })
        .filter((p): p is Fixture => p !== null);
    })
  );

  const todos: Fixture[] = [];
  for (const r of resultados) {
    if (r.status === "fulfilled") todos.push(...r.value);
  }
  return todos;
}
