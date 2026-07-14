import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Ajustes — Pitch Legends" },
      { name: "description", content: "Configuración de audio, video y controles del juego." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const [music, setMusic] = useState(70);
  const [sfx, setSfx] = useState(85);
  const [difficulty, setDifficulty] = useState("normal");
  const [quality, setQuality] = useState("high");

  return (
    <div className="min-h-screen pitch-bg">
      <header className="border-b border-border bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Menú
          </Link>
          <div className="ml-auto font-display text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Ajustes
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-4xl font-bold uppercase tracking-tight">Ajustes</h1>

        <section className="mt-8 border border-border panel">
          <PanelHeader>Audio</PanelHeader>
          <div className="space-y-5 p-6">
            <Slider label="Música" value={music} onChange={setMusic} />
            <Slider label="Efectos" value={sfx} onChange={setSfx} />
          </div>
        </section>

        <section className="mt-4 border border-border panel">
          <PanelHeader>Juego</PanelHeader>
          <div className="space-y-5 p-6">
            <Choice
              label="Dificultad"
              value={difficulty}
              onChange={setDifficulty}
              options={["fácil", "normal", "duro", "leyenda"]}
            />
            <Choice
              label="Calidad gráfica"
              value={quality}
              onChange={setQuality}
              options={["baja", "media", "high", "ultra"]}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function PanelHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-border px-5 py-3 font-display text-[11px] font-bold uppercase tracking-[0.25em]">
      {children}
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-baseline justify-between font-display">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="text-lg font-bold">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[oklch(0.55_0.24_27)]"
      />
    </label>
  );
}

function Choice({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <div className="mb-2 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o === value;
          return (
            <button
              key={o}
              onClick={() => onChange(o)}
              className={`border px-4 py-2 font-display text-xs font-bold uppercase tracking-widest transition ${
                active
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-secondary/40 hover:border-primary/60"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
