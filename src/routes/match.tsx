import { createFileRoute, Link } from "@tanstack/react-router";
import { Pause, Volume2 } from "lucide-react";
import { ClubCrest } from "@/components/career/club-crest";
import { USER_CLUB_ID, clubById, nextFixture } from "@/lib/career-data";

export const Route = createFileRoute("/match")({
  head: () => ({
    meta: [
      { title: "Partido en curso — Pitch Legends" },
      { name: "description", content: "Pantalla de partido con HUD deportivo y contenedor del motor de juego (Phaser)." },
    ],
  }),
  component: MatchView,
});

/**
 * Match screen: HUD + <MatchViewport />.
 *
 * The <MatchViewport /> is the ONLY place where the actual game engine (Phaser)
 * will be mounted. Do NOT add match logic in this file — the viewport is a
 * pure placeholder container ready for the engine bootstrap.
 */
function MatchView() {
  const fx = nextFixture()!;
  const home = clubById(fx.home);
  const away = clubById(fx.away);
  const isUserHome = fx.home === USER_CLUB_ID;

  return (
    <div className="flex min-h-screen flex-col bg-black text-foreground">
      {/* Broadcast-style HUD */}
      <header className="border-b border-border/60 bg-gradient-to-b from-black to-transparent">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 sm:px-6">
          <TeamHud club={home} score={0} highlight={isUserHome} align="right" />

          <div className="flex flex-col items-center gap-1">
            <div className="border border-accent/60 bg-black/60 px-3 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.3em] text-accent">
              En vivo · 1T
            </div>
            <div className="font-display text-3xl font-bold tabular-nums">00:00</div>
          </div>

          <TeamHud club={away} score={0} highlight={!isUserHome} align="left" />
        </div>

        {/* Controls strip */}
        <div className="border-t border-border/40 bg-black/40">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
            <Link
              to="/career"
              className="font-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              ‹ Salir del partido
            </Link>
            <div className="flex items-center gap-2">
              <IconBtn label="Volumen">
                <Volume2 className="h-4 w-4" />
              </IconBtn>
              <IconBtn label="Pausa" primary>
                <Pause className="h-4 w-4 fill-current" />
              </IconBtn>
            </div>
          </div>
        </div>
      </header>

      {/* MATCH VIEWPORT — Phaser mount point */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <MatchViewport />
      </div>
    </div>
  );
}

/**
 * MatchViewport
 * ------------------------------------------------------------------
 * Placeholder container for the Phaser game engine.
 *
 * When integrating on the target environment (Replit), mount the
 * Phaser canvas into the element with id="match-canvas-root".
 * Keep this component's dimensions and aspect ratio stable — the
 * engine will handle scaling internally.
 */
export function MatchViewport() {
  return (
    <div
      id="match-viewport"
      className="relative aspect-video w-full max-w-6xl overflow-hidden border-2 border-accent/40 bg-[oklch(0.28_0.09_145)] shadow-[0_0_60px_-10px_oklch(0.55_0.24_27/0.4)]"
      style={{
        backgroundImage: `repeating-linear-gradient(90deg, oklch(0.32 0.1 145) 0, oklch(0.32 0.1 145) 40px, oklch(0.28 0.09 145) 40px, oklch(0.28 0.09 145) 80px)`,
      }}
    >
      {/* Center line + circle overlay */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/30" />
        <div className="h-32 w-32 rounded-full border-2 border-white/30" />
      </div>

      <div
        id="match-canvas-root"
        className="absolute inset-0"
        aria-label="Phaser game engine mount point"
      />

      <div className="pointer-events-none absolute bottom-4 right-4 border border-white/20 bg-black/60 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-white/80">
        Match Viewport · Phaser mount
      </div>
    </div>
  );
}

function TeamHud({
  club,
  score,
  highlight,
  align,
}: {
  club: ReturnType<typeof clubById>;
  score: number;
  highlight?: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex items-center gap-3 ${align === "right" ? "justify-end" : "justify-start"}`}
    >
      {align === "left" && <ClubCrest club={club} size={48} />}
      <div className={align === "right" ? "text-right" : ""}>
        <div
          className={`font-display text-lg font-bold uppercase tracking-wider ${highlight ? "text-accent" : ""}`}
        >
          {club.short}
        </div>
        <div className="hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:block">
          {club.name}
        </div>
      </div>
      <div
        className="grid h-14 w-14 place-items-center border-2 font-display text-3xl font-bold tabular-nums"
        style={{ borderColor: club.color, background: `${club.color}22` }}
      >
        {score}
      </div>
      {align === "right" && <ClubCrest club={club} size={48} />}
    </div>
  );
}

function IconBtn({
  children,
  label,
  primary,
}: {
  children: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      aria-label={label}
      className={
        primary
          ? "grid h-9 w-9 place-items-center border border-accent bg-accent text-accent-foreground hover:brightness-110"
          : "grid h-9 w-9 place-items-center border border-border bg-secondary/60 text-foreground hover:bg-secondary"
      }
    >
      {children}
    </button>
  );
}
