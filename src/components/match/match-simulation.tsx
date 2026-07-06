import { useEffect, useMemo, useRef, useState } from "react";
import { FastForward, SkipForward } from "lucide-react";
import type { Club, Fixture } from "@/lib/career-data";

/**
 * MatchSimulation
 * ------------------------------------------------------------------
 * Placeholder animated simulation used before the real Phaser engine is
 * wired in. The visual layer here mimics an accelerated 2D pitch view
 * (fast-forward) with player dots + a live scoreboard, and exposes a
 * "Skip to result" control.
 *
 * When integrated on the target environment, replace the SVG viewport
 * below with a Phaser scene running with `this.time.timeScale = SIM_SPEED`
 * (or an unrendered fast update loop). The result callback contract
 * (`onFinished(homeGoals, awayGoals)`) stays the same.
 */

const MATCH_MINUTES = 4; // in-game minutes per match
const SIM_SPEED = 8; // fast-forward factor
const PLAYERS_PER_SIDE = 5;

interface Props {
  fixture: Fixture;
  home: Club;
  away: Club;
  onFinished: (homeGoals: number, awayGoals: number) => void;
}

interface Dot {
  x: number;
  y: number;
  tx: number;
  ty: number;
}

export function MatchSimulation({ fixture, home, away, onFinished }: Props) {
  const [elapsed, setElapsed] = useState(0); // in-game seconds
  const [homeGoals, setHomeGoals] = useState(fixture.homeGoals ?? 0);
  const [awayGoals, setAwayGoals] = useState(fixture.awayGoals ?? 0);

  // Pre-seed scripted goal timeline (mock — the real engine will emit events).
  const goalTimeline = useMemo(() => scriptGoals(fixture), [fixture.id]);
  const consumed = useRef(new Set<number>());

  const homeDots = useRef<Dot[]>(spawnDots(PLAYERS_PER_SIDE, "left"));
  const awayDots = useRef<Dot[]>(spawnDots(PLAYERS_PER_SIDE, "right"));
  const ballRef = useRef<Dot>({ x: 50, y: 50, tx: 50, ty: 50 });
  const [, force] = useState(0);

  const startedAt = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const total = MATCH_MINUTES * 60;

  useEffect(() => {
    let raf = 0;
    const step = (t: number) => {
      if (startedAt.current === null) startedAt.current = t;
      const realDelta = (t - startedAt.current) / 1000;
      const gameSec = Math.min(total, realDelta * SIM_SPEED * 60);
      setElapsed(gameSec);

      // move dots toward wandering targets
      const jitter = () => Math.max(4, Math.min(96, 50 + (Math.random() - 0.5) * 90));
      const advance = (d: Dot, speed: number) => {
        const dx = d.tx - d.x;
        const dy = d.ty - d.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1.5) {
          d.tx = jitter();
          d.ty = jitter();
        } else {
          d.x += (dx / dist) * speed;
          d.y += (dy / dist) * speed;
        }
      };
      homeDots.current.forEach((d) => advance(d, 0.9));
      awayDots.current.forEach((d) => advance(d, 0.9));
      advance(ballRef.current, 1.6);

      // Trigger scripted goals as game clock passes them
      for (const g of goalTimeline) {
        if (!consumed.current.has(g.at) && gameSec >= g.at) {
          consumed.current.add(g.at);
          if (g.side === "home") setHomeGoals((v) => v + 1);
          else setAwayGoals((v) => v + 1);
        }
      }

      force((n) => (n + 1) % 1_000_000);

      if (gameSec >= total) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          // Snapshot goals now — state updates above may be queued.
          const finalHome = goalTimeline.filter((g) => g.side === "home").length;
          const finalAway = goalTimeline.filter((g) => g.side === "away").length;
          setHomeGoals(finalHome);
          setAwayGoals(finalAway);
          onFinished(finalHome, finalAway);
        }
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const finalHome = goalTimeline.filter((g) => g.side === "home").length;
    const finalAway = goalTimeline.filter((g) => g.side === "away").length;
    setHomeGoals(finalHome);
    setAwayGoals(finalAway);
    setElapsed(total);
    onFinished(finalHome, finalAway);
  };

  const mm = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(elapsed % 60)
    .toString()
    .padStart(2, "0");

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Sim HUD (simplified) */}
      <div className="flex items-center justify-between gap-4 border-b border-border/40 bg-black/60 px-4 py-2 sm:px-6">
        <div className="flex items-center gap-3 font-display">
          <span className="border border-accent/60 bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.3em] text-accent">
            <FastForward className="mr-1 inline h-3 w-3" /> Simulando · {SIM_SPEED}×
          </span>
          <span className="hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
            {home.short} vs {away.short}
          </span>
        </div>

        <div className="flex items-center gap-4 font-display">
          <ScoreChip club={home} score={homeGoals} />
          <div className="text-2xl font-bold tabular-nums">
            {mm}:{ss}
          </div>
          <ScoreChip club={away} score={awayGoals} />
        </div>

        <button
          onClick={skip}
          className="inline-flex items-center gap-1.5 border border-accent bg-accent px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-accent-foreground hover:brightness-110"
        >
          <SkipForward className="h-3 w-3" /> Saltar al resultado
        </button>
      </div>

      {/* Animated pitch */}
      <div className="relative flex-1">
        <svg
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          {/* pitch stripes */}
          {Array.from({ length: 10 }).map((_, i) => (
            <rect
              key={i}
              x={i * 10}
              y={0}
              width={10}
              height={60}
              fill={i % 2 === 0 ? "oklch(0.32 0.1 145)" : "oklch(0.28 0.09 145)"}
            />
          ))}
          {/* lines */}
          <g stroke="rgba(255,255,255,0.35)" strokeWidth={0.25} fill="none">
            <rect x={1} y={1} width={98} height={58} />
            <line x1={50} y1={1} x2={50} y2={59} />
            <circle cx={50} cy={30} r={7} />
            <rect x={1} y={18} width={12} height={24} />
            <rect x={87} y={18} width={12} height={24} />
          </g>
          {/* home dots */}
          {homeDots.current.map((d, i) => (
            <circle key={`h${i}`} cx={d.x} cy={d.y} r={1.4} fill={home.color} stroke="#fff" strokeWidth={0.2} />
          ))}
          {/* away dots */}
          {awayDots.current.map((d, i) => (
            <circle key={`a${i}`} cx={d.x} cy={d.y} r={1.4} fill={away.color} stroke="#fff" strokeWidth={0.2} />
          ))}
          {/* ball */}
          <circle
            cx={ballRef.current.x}
            cy={ballRef.current.y}
            r={0.9}
            fill="#fff"
            stroke="#000"
            strokeWidth={0.15}
          />
        </svg>

        {/* progress bar */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
          <div
            className="h-full bg-accent transition-[width] duration-100"
            style={{ width: `${(elapsed / total) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ScoreChip({ club, score }: { club: Club; score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="grid h-8 w-8 place-items-center border-2 font-bold tabular-nums"
        style={{ borderColor: club.color, background: `${club.color}33` }}
      >
        {score}
      </span>
      <span className="hidden font-display text-xs font-bold uppercase tracking-wider sm:inline">
        {club.short}
      </span>
    </div>
  );
}

function spawnDots(n: number, side: "left" | "right"): Dot[] {
  return Array.from({ length: n }, () => {
    const x = side === "left" ? 20 + Math.random() * 25 : 55 + Math.random() * 25;
    const y = 8 + Math.random() * 44;
    return { x, y, tx: x, ty: y };
  });
}

function scriptGoals(fixture: Fixture): { at: number; side: "home" | "away" }[] {
  // Deterministic mock: derive 0-4 goals per side from the fixture id hash,
  // spread across the match duration. Replace with engine events later.
  const seed = [...fixture.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (i: number) => (Math.sin(seed * 9301 + i * 49297) + 1) / 2;
  const homeCount = Math.floor(rand(1) * 4); // 0..3
  const awayCount = Math.floor(rand(2) * 3); // 0..2
  const total = MATCH_MINUTES * 60;
  const events: { at: number; side: "home" | "away" }[] = [];
  for (let i = 0; i < homeCount; i++) events.push({ at: Math.floor(rand(10 + i) * (total - 20)) + 10, side: "home" });
  for (let i = 0; i < awayCount; i++) events.push({ at: Math.floor(rand(50 + i) * (total - 20)) + 10, side: "away" });
  return events.sort((a, b) => a.at - b.at);
}
