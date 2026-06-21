import { nivelDesdeProbabilidad, type PartidoBttsNo } from "@/lib/types";

const ESTILOS_NIVEL = {
  elite: {
    emoji: "🟣",
    nombre: "Élite",
    borde: "border-l-violet-500",
    badge: "bg-violet-500/15 text-violet-400",
  },
  solido: {
    emoji: "🔷",
    nombre: "Sólido",
    borde: "border-l-indigo-400",
    badge: "bg-indigo-400/15 text-indigo-300",
  },
  vigilar: {
    emoji: "🔘",
    nombre: "Vigilar",
    borde: "border-l-slate-400",
    badge: "bg-slate-400/15 text-slate-300",
  },
} as const;

const ESTILO_DEFECTO = {
  emoji: "⚪",
  nombre: "Sin nivel",
  borde: "border-l-slate-600",
  badge: "bg-slate-600/15 text-slate-400",
};

export default function TarjetaBttsNo({ partido }: { partido: PartidoBttsNo }) {
  const nivel = nivelDesdeProbabilidad(partido.probabilidadBttsNo);
  const estilo = nivel ? ESTILOS_NIVEL[nivel] : ESTILO_DEFECTO;

  return (
    <article
      className={`rounded-xl border-l-4 ${estilo.borde} bg-slate-900/60 p-5 shadow-lg shadow-black/20 ring-1 ring-white/5 backdrop-blur transition hover:ring-white/10`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${estilo.badge}`}>
          {estilo.emoji} {estilo.nombre}
        </span>
        <span className="text-lg font-bold text-slate-100">{partido.probabilidadBttsNo}% BTTS No</span>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-white">
        {partido.equipoLocal} <span className="text-slate-500">vs</span> {partido.equipoVisitante}
      </h3>
      <p className="mt-1 text-sm text-slate-400">
        {partido.liga} · {partido.horaColombia} (Colombia)
      </p>

      <ul className="mt-3 space-y-1 text-sm text-slate-300">
        {partido.justificacion.map((dato, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-slate-500">•</span>
            <span>{dato}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs capitalize text-slate-500">Confianza: {partido.nivelConfianza}</span>
        <span className="rounded-md bg-slate-800/60 px-2 py-1 text-xs text-slate-400 ring-1 ring-white/5">
          🛡️ Portería a cero / un lado
        </span>
      </div>
    </article>
  );
}
