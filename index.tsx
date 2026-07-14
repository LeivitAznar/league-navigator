import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Rewind, Settings, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pitch Legends — Menú Principal" },
      { name: "description", content: "Comenzá tu carrera en el fútbol arcade 2D. Nueva carrera, continuar o ajustes." },
    ],
  }),
  component: MainMenu,
});

function MainMenu() {
  return (
    <div className="relative min-h-screen overflow-hidden pitch-bg">
      {/* Stadium light glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[oklch(0.45_0.22_265/0.35)] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[oklch(0.55_0.24_27/0.25)] blur-3xl" />
      </div>

      {/* Scoreboard-style header strip */}
      <div className="relative border-b border-border/60 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
            Temporada 2026 / 27 · En vivo
          </div>
          <div className="hidden gap-6 font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:flex">
            <span>v1.0</span>
            <span className="text-foreground">Arcade Football</span>
          </div>
        </div>
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-16 pt-20 sm:pt-28">
        {/* Big logo */}
        <div className="flex items-center gap-3 rounded-sm border border-accent/40 bg-black/40 px-4 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.4em] text-accent">
          <Trophy className="h-3.5 w-3.5" />
          Modo Carrera
        </div>
        <h1 className="mt-6 text-center font-display text-6xl font-bold uppercase leading-none tracking-tight text-foreground sm:text-8xl">
          <span className="block text-stroke">Pitch</span>
          <span className="mt-1 block bg-gradient-to-r from-[oklch(0.55_0.22_265)] via-foreground to-[oklch(0.65_0.24_27)] bg-clip-text text-transparent">
            Legends
          </span>
        </h1>
        <p className="mt-6 max-w-md text-center text-sm text-muted-foreground">
          Construí una leyenda desde las divisiones bajas hasta el título de liga.
          Cada partido, cada transferencia, cada temporada — tu carrera.
        </p>

        {/* Team tape strip */}
        <div className="mt-10 flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest">
          <div className="h-2 w-24 bg-[oklch(0.45_0.22_265)]" />
          <span className="text-muted-foreground">vs</span>
          <div className="h-2 w-24 bg-[oklch(0.55_0.24_27)]" />
        </div>

        {/* Menu */}
        <div className="mt-12 grid w-full max-w-md gap-3">
          <MenuButton
            to="/career/create"
            icon={<Play className="h-5 w-5 fill-current" />}
            label="Nueva Carrera"
            hint="Creá tu jugador y elegí tu club"
            variant="primary"
          />
          <MenuButton
            to="/career"
            icon={<Rewind className="h-5 w-5" />}
            label="Continuar Carrera"
            hint="Río Plate FC · Temporada 2026/27 · Fecha 6"
            variant="ghost"
          />
          <MenuButton
            to="/settings"
            icon={<Settings className="h-5 w-5" />}
            label="Ajustes"
            hint="Audio, controles y video"
            variant="ghost"
          />
        </div>

        <div className="mt-16 font-display text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          © Pitch Legends Studio
        </div>
      </div>
    </div>
  );
}

function MenuButton({
  to,
  icon,
  label,
  hint,
  variant,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
  variant: "primary" | "ghost";
}) {
  const base =
    "group relative flex items-center gap-4 border px-5 py-4 text-left transition-all";
  const styles =
    variant === "primary"
      ? "border-accent/70 bg-gradient-to-r from-accent/95 to-[oklch(0.5_0.22_27)] text-accent-foreground shadow-lg shadow-accent/30 hover:brightness-110"
      : "border-border bg-panel text-foreground hover:border-primary/60 hover:bg-secondary/60";
  return (
    <Link to={to} className={`${base} ${styles}`}>
      <div
        className={
          variant === "primary"
            ? "grid h-11 w-11 place-items-center rounded-sm bg-black/25"
            : "grid h-11 w-11 place-items-center rounded-sm bg-secondary/60"
        }
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-lg font-bold uppercase tracking-wider">{label}</div>
        <div
          className={
            variant === "primary"
              ? "text-xs text-accent-foreground/80"
              : "text-xs text-muted-foreground"
          }
        >
          {hint}
        </div>
      </div>
      <div className="font-display text-lg opacity-60 transition-transform group-hover:translate-x-1">
        ›
      </div>
    </Link>
  );
}
