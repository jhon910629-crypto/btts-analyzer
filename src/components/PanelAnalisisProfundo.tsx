"use client";

import { useEffect, useState } from "react";
import type { AnalisisProfundoResponse, Partido } from "@/lib/types";
import { fechaColombiaHoy } from "@/lib/fecha";

interface Props {
  partido: Partido | null;
  fecha: string;
  onCerrar: () => void;
}

export default function PanelAnalisisProfundo({ partido, fecha, onCerrar }: Props) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<AnalisisProfundoResponse | null>(null);

  useEffect(() => {
    if (!partido) {
      setDatos(null);
      setError(null);
      return;
    }

    const controlador = new AbortController();

    async function cargar() {
      setCargando(true);
      setError(null);
      setDatos(null);
      try {
        const res = await fetch("/api/analizar-profundo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            equipoLocal: partido!.equipoLocal,
            equipoVisitante: partido!.equipoVisitante,
            fecha: fecha || fechaColombiaHoy(),
          }),
          signal: controlador.signal,
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Error desconocido al analizar el partido.");
        }
        setDatos(json);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
      } finally {
        setCargando(false);
      }
    }

    cargar();
    return () => controlador.abort();
  }, [partido, fecha]);

  if (!partido) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">
            Análisis profundo: {partido.equipoLocal} vs {partido.equipoVisitante}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {cargando && (
          <div className="mt-6 flex flex-col items-center gap-3 py-8 text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
            <p className="text-sm">Analizando partido en profundidad...</p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            ⚠️ {error}
          </div>
        )}

        {datos && !cargando && !error && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-4">
              <div>
                <p className="text-sm text-slate-400">
                  {datos.partido.liga} · {datos.partido.horaColombia} (Colombia)
                </p>
              </div>
              <span className="text-2xl font-bold text-emerald-400">{datos.probabilidadBTTS}% BTTS</span>
            </div>

            {datos.mensaje && (
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
                ℹ️ {datos.mensaje}
              </div>
            )}

            <p className="text-sm text-slate-200">{datos.resumen}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{datos.partido.equipoLocal}</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {datos.estadisticasLocal.map((dato, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-slate-500">•</span>
                      <span>{dato}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{datos.partido.equipoVisitante}</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {datos.estadisticasVisitante.map((dato, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-slate-500">•</span>
                      <span>{dato}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-100">Contexto motivacional</h3>
              <p className="mt-2 text-sm text-slate-300">{datos.contextoMotivacional}</p>
            </div>

            <p className="text-xs capitalize text-slate-500">Confianza: {datos.nivelConfianza}</p>
          </div>
        )}
      </div>
    </div>
  );
}
