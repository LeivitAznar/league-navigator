import { createFileRoute } from "@tanstack/react-router";
import { CareerLayout } from "@/components/career/career-layout";
import { USER_HISTORY, USER_PLAYER, USER_STATS } from "@/lib/career-data";
import { PageHeader } from "./career.calendar";

export const Route = createFileRoute("/career/stats")({
  head: () => ({
    meta: [
      { title: "Estadísticas — Pitch Legends" },
      { name: "description", content: "Estadísticas individuales, historial y progresión de tu jugador." },
    ],
  }),
  component: StatsView,
});

function StatsView() {
  const max = Math.max(...USER_HISTORY.overallProgression.map((p) => p.overall));
  const min = Math.min(...USER_HISTORY.overallProgression.map((p) => p.overall));
  const w = 480;
  const h = 160;
  const pad = 24;
  const pts = USER_HISTORY.overallProgression.map((p, i, arr) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(arr.length - 1, 1);
    const y = h - pad - ((p.overall - min + 2) * (h - pad * 2)) / (max - min + 4);
    return { x, y, ...p };
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${path} L${pts[pts.length - 1].x},${h - pad} L${pts[0].x},${h - pad} Z`;

  return (
    <CareerLayout>
      <PageHeader title="Estadísticas" subtitle={`${USER_PLAYER.name} · ${USER_PLAYER.position} · Overall ${USER_PLAYER.overall}`} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* attributes */}
        <section className="border border-border panel">
          <div className="border-b border-border px-4 py-3 font-display text-[11px] font-bold uppercase tracking-[0.25em]">
            Atributos
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {USER_STATS.map((s) => (
              <div key={s.key}>
                <div className="mb-2 flex items-baseline justify-between font-display">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {s.label}
                  </span>
                  <span className="text-2xl font-bold">{s.value}</span>
                </div>
                <div className="h-2 overflow-hidden bg-secondary">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-primary to-accent"
                    style={{ width: `${s.value}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[9px] uppercase tracking-widest text-muted-foreground">
                  <span>0</span>
                  <span>99</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* history */}
        <section className="space-y-6">
          <div className="border border-border panel">
            <div className="border-b border-border px-4 py-3 font-display text-[11px] font-bold uppercase tracking-[0.25em]">
              Historial
            </div>
            <div className="grid grid-cols-2 divide-x divide-border">
              <HistoryStat label="Partidos" value={USER_HISTORY.matches} />
              <HistoryStat label="Goles" value={USER_HISTORY.goals} accent />
              <HistoryStat label="Asistencias" value={USER_HISTORY.assists} />
              <HistoryStat label="Temporadas" value={USER_HISTORY.seasons} />
            </div>
          </div>

          <div className="border border-border panel">
            <div className="border-b border-border px-4 py-3 font-display text-[11px] font-bold uppercase tracking-[0.25em]">
              Progresión Overall
            </div>
            <div className="p-4">
              <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full">
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.24 27)" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="oklch(0.55 0.24 27)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={area} fill="url(#grad)" />
                <path d={path} stroke="oklch(0.7 0.22 27)" strokeWidth="2.5" fill="none" />
                {pts.map((p) => (
                  <g key={p.season}>
                    <circle cx={p.x} cy={p.y} r="4" fill="oklch(0.7 0.22 27)" />
                    <text
                      x={p.x}
                      y={p.y - 10}
                      textAnchor="middle"
                      fontFamily="Oswald, sans-serif"
                      fontWeight="700"
                      fontSize="11"
                      fill="currentColor"
                    >
                      {p.overall}
                    </text>
                    <text
                      x={p.x}
                      y={h - 6}
                      textAnchor="middle"
                      fontFamily="Oswald, sans-serif"
                      fontSize="10"
                      fill="oklch(0.72 0.02 260)"
                    >
                      {p.season}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </section>
      </div>
    </CareerLayout>
  );
}

function HistoryStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="p-6">
      <div className={`font-display text-4xl font-bold ${accent ? "text-accent" : ""}`}>
        {value}
      </div>
      <div className="mt-1 font-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
