"use client";

import { useState } from "react";
import TarjetaPartido from "@/components/TarjetaPartido";
import TarjetaBttsNo from "@/components/TarjetaBttsNo";
import PanelAnalisisProfundo from "@/components/PanelAnalisisProfundo";
import { fechaColombiaHoy, formatearFechaLarga } from "@/lib/fecha";
import { descargarInformeHtml } from "@/lib/exportarHtml";
import { descargarInformeExcel } from "@/lib/exportarExcel";
import {
  nivelDesdeProbabilidad,
  type AnalisisDiaResponse,
  type Partido,
  type PartidoBttsNo,
} from "@/lib/types";

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

  const bttsNoElite = resultado?.partidosBttsNo?.filter((p) => nivelDesdeProbabilidad(p.probabilidadBttsNo) === "elite") ?? [];
  const bttsNoSolidos = resultado?.partidosBttsNo?.filter((p) => nivelDesdeProbabilidad(p.probabilidadBttsNo) === "solido") ?? [];
  const bttsNoVigilar = resultado?.partidosBttsNo?.filter((p) => nivelDesdeProbabilidad(p.probabilidadBttsNo) === "vigilar") ?? [];

  const hayBttsSi = elite.length + solidos.length + vigilar.length > 0;
  const hayBttsNo = bttsNoElite.length + bttsNoSolidos.length + bttsNoVigilar.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      {/* Hero */}
      <header className="overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 px-6 py-10 text-center shadow-xl shadow-black/30 sm:py-14">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-3xl ring-1 ring-emerald-400/30 sm:h-16 sm:w-16 sm:text-4xl">
          ⚽
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          BTTS Analyzer
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400 sm:text-base">
          Inteligencia deportiva basada en datos reales y búsqueda web: probabilidad de que
          ambos equipos anoten — o no anoten — en los partidos del día.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-400 ring-1 ring-emerald-400/20">
            ⚽ BTTS Sí — Ambos Marcan
          </span>
          <span className="rounded-full bg-violet-500/10 px-3 py-1 text-violet-400 ring-1 ring-violet-400/20">
            🛡️ BTTS No — Portería a cero
          </span>
        </div>
        <p className="mt-4 text-xs uppercase tracking-widest text-slate-500">
          Análisis estadístico · No es asesoría de apuestas
        </p>
      </header>

      {/* Selector de fecha */}
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

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          ⚠️ {error}
        </div>
      )}

      {/* Spinner */}
      {cargando && !error && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-slate-900/40 py-12 text-slate-400">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
          <p className="text-sm">Buscando partidos y calculando probabilidades BTTS...</p>
        </div>
      )}

      {/* Resultados */}
      {resultado && !cargando && (
        <section className="flex flex-col gap-8">
          {/* Encabezado con exportación */}
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
                ⬇️ HTML
              </button>
              <button
                type="button"
                onClick={() => descargarInformeExcel(resultado)}
                disabled={!hayBttsSi && !hayBttsNo}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                📊 Excel
              </button>
            </div>
          </div>

          {/* Mensaje informativo */}
          {resultado.mensaje && (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
              ℹ️ {resultado.mensaje}
            </div>
          )}

          {/* ─── BTTS SÍ ─── */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-emerald-500/20" />
              <h2 className="whitespace-nowrap rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-bold text-emerald-400 ring-1 ring-emerald-400/20">
                ⚽ BTTS SÍ — Ambos Marcan
              </h2>
              <div className="h-px flex-1 bg-emerald-500/20" />
            </div>

            {hayBttsSi ? (
              <>
                {elite.length > 0 && (
                  <GrupoTarjetas titulo="🔴 Élite (≥75%)" partidos={elite} onAnalisisProfundo={setPartidoProfundo} />
                )}
                {solidos.length > 0 && (
                  <GrupoTarjetas titulo="🟡 Sólidos (70-74%)" partidos={solidos} onAnalisisProfundo={setPartidoProfundo} />
                )}
                {vigilar.length > 0 && (
                  <GrupoTarjetas titulo="🔵 Vigilar (65-69%)" partidos={vigilar} onAnalisisProfundo={setPartidoProfundo} />
                )}
              </>
            ) : (
              <p className="rounded-2xl bg-slate-900/40 p-6 text-center text-sm text-slate-400">
                No se encontraron partidos con probabilidad BTTS Sí ≥65% para esta fecha.
              </p>
            )}
          </div>

          {/* ─── BTTS NO ─── */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-violet-500/20" />
              <h2 className="whitespace-nowrap rounded-full bg-violet-500/10 px-4 py-1.5 text-sm font-bold text-violet-400 ring-1 ring-violet-400/20">
                🛡️ BTTS NO — Al Menos Uno No Marca
              </h2>
              <div className="h-px flex-1 bg-violet-500/20" />
            </div>

            {hayBttsNo ? (
              <>
                {bttsNoElite.length > 0 && (
                  <GrupoTarjetasBttsNo titulo="🟣 Élite (≥75%)" partidos={bttsNoElite} />
                )}
                {bttsNoSolidos.length > 0 && (
                  <GrupoTarjetasBttsNo titulo="🔷 Sólidos (70-74%)" partidos={bttsNoSolidos} />
                )}
                {bttsNoVigilar.length > 0 && (
                  <GrupoTarjetasBttsNo titulo="🔘 Vigilar (65-69%)" partidos={bttsNoVigilar} />
                )}
              </>
            ) : (
              <p className="rounded-2xl bg-slate-900/40 p-6 text-center text-sm text-slate-400">
                No se encontraron partidos con probabilidad BTTS No ≥65% para esta fecha.
              </p>
            )}
          </div>
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

function GrupoTarjetasBttsNo({
  titulo,
  partidos,
}: {
  titulo: string;
  partidos: PartidoBttsNo[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{titulo}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {partidos.map((partido, i) => (
          <TarjetaBttsNo key={i} partido={partido} />
        ))}
      </div>
    </div>
  );
}
