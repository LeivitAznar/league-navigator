import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { ClubCrest } from "@/components/career/club-crest";
import { CLUBS, type Position } from "@/lib/career-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/career/create")({
  head: () => ({
    meta: [
      { title: "Nueva Carrera — Pitch Legends" },
      { name: "description", content: "Creá tu jugador y elegí tu club inicial para comenzar la carrera." },
    ],
  }),
  component: CreatePlayer,
});

const POSITIONS: { value: Position; label: string; hint: string }[] = [
  { value: "GK", label: "Arquero", hint: "Reflejos y estirada" },
  { value: "DEF", label: "Defensor", hint: "Fuerza y anticipación" },
  { value: "MID", label: "Mediocampista", hint: "Visión y pase" },
  { value: "FWD", label: "Delantero", hint: "Definición y velocidad" },
];

const APPEARANCES = [
  { id: "a1", label: "Estilo 01", color: "#F5D0A9" },
  { id: "a2", label: "Estilo 02", color: "#D19E7A" },
  { id: "a3", label: "Estilo 03", color: "#8B5A3C" },
  { id: "a4", label: "Estilo 04", color: "#5A3821" },
];

function CreatePlayer() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [position, setPosition] = useState<Position>("FWD");
  const [appearance, setAppearance] = useState("a1");
  const [clubId, setClubId] = useState<string>("rio");

  return (
    <div className="min-h-screen pitch-bg">
      <header className="border-b border-border bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <button
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Menú
          </button>
          <div className="ml-auto font-display text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Paso 1 · Creación de Jugador
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display text-4xl font-bold uppercase tracking-tight sm:text-5xl">
          Creá tu <span className="text-accent">Leyenda</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Definí tu identidad y elegí el club donde arranca tu carrera.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* LEFT: identity */}
          <div className="space-y-6">
            <Panel title="Identidad">
              <label className="block">
                <span className="font-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Nombre del jugador
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: A. Martínez"
                  className="mt-2 w-full border border-border bg-input px-4 py-3 font-display text-lg uppercase tracking-wider text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none"
                />
              </label>
            </Panel>

            <Panel title="Posición">
              <div className="grid grid-cols-2 gap-2">
                {POSITIONS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPosition(p.value)}
                    className={cn(
                      "border p-4 text-left transition",
                      position === p.value
                        ? "border-accent bg-accent/10"
                        : "border-border bg-secondary/30 hover:border-primary/60",
                    )}
                  >
                    <div className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {p.value}
                    </div>
                    <div className="mt-1 font-display text-lg font-bold uppercase">{p.label}</div>
                    <div className="text-xs text-muted-foreground">{p.hint}</div>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Apariencia">
              <div className="flex gap-3">
                {APPEARANCES.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAppearance(a.id)}
                    className={cn(
                      "flex-1 border p-3 transition",
                      appearance === a.id ? "border-accent" : "border-border hover:border-primary/60",
                    )}
                  >
                    <div
                      className="mx-auto h-16 w-16 rounded-full border border-black/40"
                      style={{ background: a.color }}
                    />
                    <div className="mt-2 text-center font-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {a.label}
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          {/* RIGHT: club */}
          <div>
            <Panel title="Club inicial">
              <div className="grid max-h-[560px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {CLUBS.map((c) => {
                  const active = c.id === clubId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setClubId(c.id)}
                      className={cn(
                        "relative flex items-center gap-3 border p-3 text-left transition",
                        active
                          ? "border-accent bg-accent/10"
                          : "border-border bg-secondary/30 hover:border-primary/60",
                      )}
                    >
                      <ClubCrest club={c} size={44} />
                      <div className="min-w-0">
                        <div className="truncate font-display text-sm font-bold uppercase tracking-wider">
                          {c.name}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          {c.short}
                        </div>
                      </div>
                      {active && (
                        <div className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-accent text-accent-foreground">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </Panel>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            disabled={!name}
            onClick={() => navigate({ to: "/career" })}
            className="border border-accent/70 bg-accent px-8 py-3 font-display text-sm font-bold uppercase tracking-widest text-accent-foreground shadow-lg shadow-accent/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Comenzar Carrera ›
          </button>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-border panel">
      <div className="border-b border-border px-4 py-3 font-display text-[11px] font-bold uppercase tracking-[0.25em]">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
