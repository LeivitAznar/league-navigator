import { createFileRoute } from "@tanstack/react-router";
import { CareerLayout } from "@/components/career/career-layout";
import { SQUAD, type Player, type Position } from "@/lib/career-data";
import { cn } from "@/lib/utils";
import { PageHeader } from "./career.calendar";

export const Route = createFileRoute("/career/squad")({
  head: () => ({
    meta: [
      { title: "Plantilla — Pitch Legends" },
      { name: "description", content: "Plantel completo del club agrupado por posición con niveles individuales." },
    ],
  }),
  component: Squad,
});

const GROUPS: { pos: Position; label: string }[] = [
  { pos: "GK", label: "Arqueros" },
  { pos: "DEF", label: "Defensa" },
  { pos: "MID", label: "Mediocampo" },
  { pos: "FWD", label: "Delantera" },
];

function Squad() {
  return (
    <CareerLayout>
      <PageHeader title="Plantilla" subtitle={`${SQUAD.length} jugadores registrados`} />

      <div className="mt-6 space-y-8">
        {GROUPS.map((g) => {
          const players = SQUAD.filter((p) => p.position === g.pos);
          return (
            <section key={g.pos}>
              <div className="mb-3 flex items-baseline gap-3">
                <h2 className="font-display text-xl font-bold uppercase tracking-widest">
                  {g.label}
                </h2>
                <div className="h-px flex-1 bg-border" />
                <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">
                  {players.length}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {players.map((p) => (
                  <PlayerCard key={p.id} p={p} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </CareerLayout>
  );
}

function PlayerCard({ p }: { p: Player }) {
  const rating =
    p.overall >= 82 ? "from-emerald-500 to-emerald-700"
    : p.overall >= 76 ? "from-primary to-[oklch(0.35_0.2_265)]"
    : "from-muted to-secondary";

  return (
    <button
      className={cn(
        "group grid grid-cols-[auto_1fr_auto] items-center gap-3 border p-3 text-left transition",
        p.isUser
          ? "border-accent bg-accent/10 hover:bg-accent/15"
          : "border-border bg-panel hover:border-primary/60",
      )}
    >
      <div
        className={cn(
          "grid h-14 w-14 place-items-center bg-gradient-to-br font-display text-white",
          rating,
        )}
      >
        <div className="text-xl font-bold leading-none">{p.overall}</div>
        <div className="text-[9px] font-bold uppercase tracking-widest opacity-80">{p.position}</div>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-xs text-muted-foreground">#{p.number}</span>
          <span className="truncate font-display text-sm font-bold uppercase tracking-wider">
            {p.name}
          </span>
        </div>
        {p.isUser && (
          <span className="mt-1 inline-block border border-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-accent">
            Tu jugador
          </span>
        )}
      </div>
      <div className="font-display text-lg text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground">
        ›
      </div>
    </button>
  );
}
