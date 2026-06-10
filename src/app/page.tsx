"use client";

import { useState } from "react";
import TarjetaPartido from "@/components/TarjetaPartido";
import PanelAnalisisProfundo from "@/components/PanelAnalisisProfundo";
import { fechaColombiaHoy, formatearFechaLarga } from "@/lib/fecha";
import { descargarInformeHtml } from "@/lib/exportarHtml";
import { descargarInformeExcel } from "@/lib/exportarExcel";
import { nivelDesdeProbabilidad, type AnalisisDiaResponse, type Partido } from "@/lib/types";

export default function Home() {
  const [fecha, setFecha] = useState(fechaColombiaHoy());
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<AnalisisDiaResponse | null>(null);
  const [partidoProfundo, setPartidoProfundo] = useState<Partido | null>(null);

  async function analizar() {
    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      const res = await fetch("/api/analizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Error desconocido al analizar la jornada.");
      }
      setResultado(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  }

  const elite = resultado?.partidos.filter((p) => nivelDesdeProbabilidad(p.probabilidadBTTS) === "elite") ?? [];
  const solidos = resultado?.partidos.filter((p) => nivelDesdeProbabilidad(p.probabilidadBTTS) === "solido") ?? [];
  const vigilar = resultado?.partidos.filter((p) => nivelDesdeProbabilidad(p.probabilidadBTTS) === "vigilar") ?? [];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 px-6 py-10 text-center shadow-xl shadow-black/30 sm:py-14">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-3xl ring-1 ring-emerald-400/30 sm:h-16 sm:w-16 sm:text-4xl">
          ⚽
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          BTTS Analyzer
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400 sm:text-base">
          Inteligencia deportiva basada en datos reales y búsqueda web: probabilidad de que
          ambos equipos anoten en los partidos del día.
        </p>
        <p className="mt-4 text-xs uppercase tracking-widest text-emerald-400/70">
          Análisis estadístico · No es asesoría de apuestas
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl bg-slate-900/60 p-5 ring-1 ring-white/5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fecha" className="text-sm font-medium text-slate-300">
            Fecha (hora Colombia, UTC-5)
          </label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
          />
        </div>

        <button
          type="button"
          onClick={analizar}
          disabled={cargando}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cargando ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-950/40 border-t-emerald-950" />
              Analizando...
            </>
          ) : (
            "Analizar jornada"
          )}
        </button>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          ⚠️ {error}
        </div>
      )}

      {cargando && !error && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-slate-900/40 py-12 text-slate-400">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
          <p className="text-sm">Buscando partidos y calculando probabilidades BTTS...</p>
        </div>
      )}

      {resultado && !cargando && (
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold capitalize text-slate-100">
              {formatearFechaLarga(resultado.fecha)}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => descargarInformeHtml(resultado)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700"
              >
                ⬇️ Exportar HTML
              </button>
              <button
                type="button"
                onClick={() => descargarInformeExcel(resultado)}
                disabled={resultado.partidos.length === 0}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                📊 Exportar Excel
              </button>
            </div>
          </div>

          {resultado.mensaje && (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
              ℹ️ {resultado.mensaje}
            </div>
          )}

          {resultado.partidos.length === 0 && !resultado.mensaje && (
            <p className="rounded-2xl bg-slate-900/40 p-6 text-center text-sm text-slate-400">
              No se encontraron partidos que superen el 65% de probabilidad BTTS para esta fecha.
            </p>
          )}

          {elite.length > 0 && (
            <GrupoTarjetas titulo="🔴 Élite (≥75%)" partidos={elite} onAnalisisProfundo={setPartidoProfundo} />
          )}
          {solidos.length > 0 && (
            <GrupoTarjetas titulo="🟡 Sólidos (70-74%)" partidos={solidos} onAnalisisProfundo={setPartidoProfundo} />
          )}
          {vigilar.length > 0 && (
            <GrupoTarjetas titulo="🔵 Vigilar (65-69%)" partidos={vigilar} onAnalisisProfundo={setPartidoProfundo} />
          )}
        </section>
      )}

      <PanelAnalisisProfundo
        partido={partidoProfundo}
        fecha={fecha}
        onCerrar={() => setPartidoProfundo(null)}
      />

      <footer className="mt-auto pt-10 text-center text-xs text-slate-600">
        Generado con IA · Solo con fines informativos. No constituye asesoría de apuestas.
      </footer>
    </main>
  );
}

function GrupoTarjetas({
  titulo,
  partidos,
  onAnalisisProfundo,
}: {
  titulo: string;
  partidos: Partido[];
  onAnalisisProfundo: (partido: Partido) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{titulo}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {partidos.map((partido, i) => (
          <TarjetaPartido key={i} partido={partido} onAnalisisProfundo={onAnalisisProfundo} />
        ))}
      </div>
    </div>
  );
}
