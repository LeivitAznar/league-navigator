import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Pause, Trophy, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import { z } from "zod";
import { ClubCrest } from "@/components/career/club-crest";
import { MatchSimulation } from "@/components/match/match-simulation";
import { USER_CLUB_ID, clubById, nextFixture } from "@/lib/career-data";

const searchSchema = z.object({
  mode: z.enum(["play", "sim"]).optional().default("play"),
});

export const Route = createFileRoute("/match")({
  head: () => ({
    meta: [
      { title: "Partido en curso — Pitch Legends" },
      { name: "description", content: "Pantalla de partido con HUD deportivo y contenedor del motor de juego (Phaser)." },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: MatchView,
});

/**
 * Match screen: HUD + <MatchViewport /> (o <MatchSimulation /> en modo sim).
 *
 * El <MatchViewport /> es el único lugar donde se monta el motor de juego
 * real (Phaser). El viewport ocupa TODO el espacio disponible (ver
 * MatchViewport abajo) — el escalado del canvas lo maneja Phaser con
 * Phaser.Scale.FIT + autoCenter y width/height '100%'.
 */
function MatchView() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const fx = nextFixture()!;
  const home = clubById(fx.home);
  const away = clubById(fx.away);
  const isUserHome = fx.home === USER_CLUB_ID;

  const [result, setResult] = useState<{ h: number; a: number } | null>(null);

  if (result) {
    return (
      <ResultScreen
        home={home}
        away={away}
        hg={result.h}
        ag={result.a}
        isUserHome={isUserHome}
        onContinue={() => navigate({ to: "/career" })}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-black text-foreground">
      {/* Broadcast-style HUD (compact, only in play mode) */}
      {mode === "play" && (
        <header className="shrink-0 border-b border-border/60 bg-gradient-to-b from-black to-transparent">
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
      )}

      {/* MATCH VIEWPORT — Phaser mount point OR sim */}
      <div className="min-h-0 flex-1">
        {mode === "sim" ? (
          <MatchSimulation
            fixture={fx}
            home={home}
            away={away}
            onFinished={(h, a) => setResult({ h, a })}
          />
        ) : (
          <MatchViewport />
        )}
      </div>
    </div>
  );
}

/**
 * MatchViewport
 * ------------------------------------------------------------------
 * Contenedor del motor Phaser. Ocupa el 100% del espacio disponible
 * del padre (que ya es flex-1 en la vista `/match`).
 *
 * Integración recomendada (Phaser 4, misma API de Scale que v3):
 *
 *   scale: {
 *     mode: Phaser.Scale.FIT,           // mantiene aspect ratio 16:9
 *     autoCenter: Phaser.Scale.CENTER_BOTH,
 *     parent: 'match-canvas-root',
 *     width: '100%',
 *     height: '100%',
 *   }
 *
 * El div `#match-canvas-root` YA ocupa el 100% del área del viewport,
 * así que Phaser puede escalarse libremente sin recalcular HUDs.
 */
export function MatchViewport() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const container = document.getElementById("match-canvas-root");
    if (!container) return;

    let cancelled = false;

    // Dynamic import keeps Phaser (a browser-only lib — it touches `navigator`
    // at module init) out of the SSR module graph for this route. A static
    // top-level import would get evaluated during server rendering and crash.
    import("@/game/create-match-game").then(({ createMatchGame }) => {
      if (cancelled) return;
      gameRef.current = createMatchGame(container);
    });

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      id="match-viewport"
      className="relative h-full w-full overflow-hidden bg-[oklch(0.28_0.09_145)]"
      style={{
        backgroundImage: `repeating-linear-gradient(90deg, oklch(0.32 0.1 145) 0, oklch(0.32 0.1 145) 40px, oklch(0.28 0.09 145) 40px, oklch(0.28 0.09 145) 80px)`,
      }}
    >
      {/* Center line + circle overlay (placeholder mientras no hay engine) */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/30" />
        <div className="h-32 w-32 rounded-full border-2 border-white/30" />
      </div>

      <div
        id="match-canvas-root"
        className="absolute inset-0 h-full w-full"
        aria-label="Phaser game engine mount point"
      />

      <div className="pointer-events-none absolute bottom-4 right-4 border border-white/20 bg-black/60 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-white/80">
        Match Viewport · Phaser mount
      </div>
    </div>
  );
}

function ResultScreen({
  home,
  away,
  hg,
  ag,
  isUserHome,
  onContinue,
}: {
  home: ReturnType<typeof clubById>;
  away: ReturnType<typeof clubById>;
  hg: number;
  ag: number;
  isUserHome: boolean;
  onContinue: () => void;
}) {
  const userGoals = isUserHome ? hg : ag;
  const rivalGoals = isUserHome ? ag : hg;
  const outcome =
    userGoals > rivalGoals ? "Victoria" : userGoals === rivalGoals ? "Empate" : "Derrota";
  const outcomeColor =
    userGoals > rivalGoals
      ? "text-emerald-400"
      : userGoals === rivalGoals
        ? "text-muted-foreground"
        : "text-destructive";

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-2xl border border-border panel p-8 text-center sm:p-12">
        <Trophy className="mx-auto h-10 w-10 text-accent" />
        <div className="mt-3 font-display text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          Resultado final
        </div>
        <div className={`mt-1 font-display text-2xl font-bold uppercase ${outcomeColor}`}>
          {outcome}
        </div>

        <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <ClubCrest club={home} size={64} />
            <div className="font-display text-sm font-bold uppercase">{home.short}</div>
          </div>
          <div className="font-display text-6xl font-bold tabular-nums">
            {hg} <span className="text-muted-foreground">-</span> {ag}
          </div>
          <div className="flex flex-col items-center gap-2">
            <ClubCrest club={away} size={64} />
            <div className="font-display text-sm font-bold uppercase">{away.short}</div>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="mt-10 w-full border border-accent bg-accent px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-accent-foreground hover:brightness-110"
        >
          Continuar
        </button>
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
