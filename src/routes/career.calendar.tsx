import { createFileRoute, Link } from "@tanstack/react-router";
import { FastForward, PlayCircle } from "lucide-react";
import { CareerLayout } from "@/components/career/career-layout";
import { ClubCrest } from "@/components/career/club-crest";
import { FIXTURES, USER_CLUB_ID, clubById, nextFixture } from "@/lib/career-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/career/calendar")({
  head: () => ({
    meta: [
      { title: "Calendario — Pitch Legends" },
      { name: "description", content: "Fixture completo de la temporada, resultados y próximos partidos." },
    ],
  }),
  component: Calendar,
});

function Calendar() {
  const next = nextFixture();
  return (
    <CareerLayout>
      <PageHeader title="Calendario" subtitle="Temporada 2026/27 · 10 fechas" />

      <div className="mt-6 grid gap-2">
        {FIXTURES.map((f) => {
          const home = clubById(f.home);
          const away = clubById(f.away);
          const isUserHome = f.home === USER_CLUB_ID;
          const isUserAway = f.away === USER_CLUB_ID;
          const isNext = next?.id === f.id;

          let result: "W" | "D" | "L" | null = null;
          if (f.played && (isUserHome || isUserAway)) {
            const gf = isUserHome ? f.homeGoals! : f.awayGoals!;
            const ga = isUserHome ? f.awayGoals! : f.homeGoals!;
            result = gf > ga ? "W" : gf === ga ? "D" : "L";
          }

          return (
            <div
              key={f.id}
              className={cn(
                "grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-3 border px-4 py-3 sm:grid-cols-[80px_1fr_auto_1fr_120px]",
                isNext
                  ? "border-accent bg-accent/10"
                  : "border-border bg-panel",
              )}
            >
              <div className="font-display">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Fecha
                </div>
                <div className="text-lg font-bold">{f.round}</div>
              </div>

              <TeamCell club={home} highlight={isUserHome} align="right" />

              <div className="grid min-w-[80px] place-items-center border border-border bg-black/30 px-2 py-1">
                {f.played ? (
                  <div className="font-display text-xl font-bold">
                    {f.homeGoals} <span className="text-muted-foreground">-</span> {f.awayGoals}
                  </div>
                ) : (
                  <div className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                    {new Date(f.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                  </div>
                )}
              </div>

              <TeamCell club={away} highlight={isUserAway} align="left" />

              <div className="flex flex-col items-end gap-1 text-right">
                {isNext ? (
                  <div className="flex flex-col gap-1 sm:flex-row">
                    <Link
                      to="/match"
                      search={{ mode: "play" }}
                      className="inline-flex items-center gap-1 border border-accent bg-accent px-3 py-2 font-display text-[10px] font-bold uppercase tracking-widest text-accent-foreground hover:brightness-110"
                    >
                      <PlayCircle className="h-3 w-3" /> Jugar
                    </Link>
                    <Link
                      to="/match"
                      search={{ mode: "sim" }}
                      className="inline-flex items-center gap-1 border border-border bg-secondary/60 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-secondary"
                    >
                      <FastForward className="h-3 w-3" /> Simular
                    </Link>
                  </div>
                ) : result ? (
                  <ResultBadge result={result} />
                ) : (
                  <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                    Pendiente
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </CareerLayout>
  );
}

function TeamCell({
  club,
  highlight,
  align,
}: {
  club: ReturnType<typeof clubById>;
  highlight?: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3",
        align === "right" && "sm:flex-row-reverse sm:text-right",
      )}
    >
      <ClubCrest club={club} size={32} />
      <div className="min-w-0">
        <div
          className={cn(
            "truncate font-display text-sm font-bold uppercase tracking-wider",
            highlight && "text-accent",
          )}
        >
          {club.short}
        </div>
        <div className="hidden truncate text-[10px] text-muted-foreground sm:block">
          {club.name}
        </div>
      </div>
    </div>
  );
}

function ResultBadge({ result }: { result: "W" | "D" | "L" }) {
  const cls =
    result === "W" ? "bg-emerald-600/80" : result === "D" ? "bg-muted" : "bg-destructive/80";
  const label = result === "W" ? "G" : result === "D" ? "E" : "P";
  return (
    <span
      className={`inline-grid h-8 w-8 place-items-center font-display text-sm font-bold ${cls}`}
    >
      {label}
    </span>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-border pb-4">
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
