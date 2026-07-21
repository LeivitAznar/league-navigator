import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, FastForward, PlayCircle } from "lucide-react";
import { CareerLayout } from "@/components/career/career-layout";
import { ClubCrest } from "@/components/career/club-crest";
import {
  FIXTURES,
  USER_CLUB_ID,
  USER_PLAYER,
  USER_STATS,
  clubById,
  nextFixture,
  tableSorted,
} from "@/lib/career-data";

export const Route = createFileRoute("/career/")({
  head: () => ({
    meta: [
      { title: "Hub de Carrera — Pitch Legends" },
      { name: "description", content: "Panel de control de tu carrera: próximo partido, tabla, plantilla y estadísticas." },
    ],
  }),
  component: CareerHub,
});

function CareerHub() {
  const next = nextFixture();
  const nextHome = next ? clubById(next.home) : null;
  const nextAway = next ? clubById(next.away) : null;
  const table = tableSorted();
  const userPos = table.findIndex((r) => r.clubId === USER_CLUB_ID) + 1;
  const userRow = table.find((r) => r.clubId === USER_CLUB_ID)!;
  const club = clubById(USER_CLUB_ID);

  const lastFive = FIXTURES.filter((f) => f.played).slice(-5);

  return (
    <CareerLayout>
      <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Menú principal
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* NEXT MATCH — hero card */}
        <section className="relative overflow-hidden border border-border panel">
          {next && nextHome && nextAway ? (
            <>
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  background: `linear-gradient(115deg, ${nextHome.color}55 0%, transparent 45%, ${nextAway.color}55 100%)`,
                }}
              />
              <div className="relative p-6 sm:p-8">
                <div className="flex items-center justify-between font-display text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                  <span>Próximo Partido · Fecha {next.round}</span>
                  <span>{new Date(next.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</span>
                </div>

                <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <TeamBlock club={nextHome} home />
                  <div className="text-center font-display">
                    <div className="text-4xl font-bold uppercase text-muted-foreground/80 sm:text-5xl">
                      VS
                    </div>
                    <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                      Estadio Monumental
                    </div>
                  </div>
                  <TeamBlock club={nextAway} />
                </div>

                <div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr]">
                  <Link
                    to="/match"
                    search={{ mode: "play" }}
                    className="flex items-center justify-center gap-2 border border-accent/60 bg-accent px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-accent-foreground transition hover:brightness-110"
                  >
                    <PlayCircle className="h-5 w-5" />
                    Jugar Partido
                  </Link>
                  <Link
                    to="/match"
                    search={{ mode: "sim" }}
                    className="flex items-center justify-center gap-2 border border-border bg-secondary/60 px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-foreground transition hover:bg-secondary"
                  >
                    <FastForward className="h-4 w-4" />
                    Simular
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 sm:p-8">
              <div className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                Temporada completada
              </div>
              <div className="mt-3 font-display text-2xl font-bold uppercase text-foreground">
                No hay próximos partidos.
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Revisá calendario o iniciá una nueva carrera para volver a jugar.
              </p>
              <div className="mt-6">
                <Link
                  to="/career/calendar"
                  className="flex items-center justify-center gap-2 border border-border bg-secondary/60 px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-foreground transition hover:bg-secondary"
                >
                  Ver calendario
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* PLAYER CARD */}
        <section className="border border-border panel p-6">
          <div className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Tu Jugador
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center border-2 border-accent/70 bg-gradient-to-br from-[oklch(0.55_0.24_27)] to-[oklch(0.35_0.18_27)] font-display">
              <div className="text-3xl font-bold leading-none">{USER_PLAYER.overall}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest opacity-80">{USER_PLAYER.position}</div>
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-xl font-bold uppercase">{USER_PLAYER.name}</div>
              <div className="text-xs text-muted-foreground">
                #{USER_PLAYER.number} · {club.name}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            {USER_STATS.slice(0, 4).map((s) => (
              <StatBar key={s.key} label={s.label} value={s.value} />
            ))}
          </div>

          <Link
            to="/career/stats"
            className="mt-5 flex items-center justify-between border-t border-border pt-3 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Ver estadísticas completas
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      </div>

      {/* SECOND ROW */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Table snippet */}
        <section className="border border-border panel">
          <SectionHeader title="Posición" to="/career/table" />
          <div className="px-4 pb-4">
            <div className="mb-3 flex items-baseline gap-2 font-display">
              <div className="text-5xl font-bold text-accent">{userPos}º</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                de {table.length}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 border-t border-border pt-3 text-center font-display">
              <MiniStat label="PJ" v={userRow.played} />
              <MiniStat label="PTS" v={userRow.points} highlight />
              <MiniStat label="DG" v={userRow.gd > 0 ? `+${userRow.gd}` : userRow.gd} />
              <MiniStat label="GF" v={userRow.gf} />
            </div>
          </div>
        </section>

        {/* Form / last 5 */}
        <section className="border border-border panel">
          <SectionHeader title="Últimos 5" to="/career/calendar" />
          <div className="px-4 pb-4">
            <div className="flex gap-2">
              {lastFive.map((f) => {
                const isHome = f.home === USER_CLUB_ID;
                const gf = isHome ? f.homeGoals! : f.awayGoals!;
                const ga = isHome ? f.awayGoals! : f.homeGoals!;
                const res = gf > ga ? "G" : gf === ga ? "E" : "P";
                const color =
                  res === "G"
                    ? "bg-emerald-600/80"
                    : res === "E"
                      ? "bg-muted"
                      : "bg-destructive/80";
                return (
                  <div key={f.id} className="flex-1">
                    <div
                      className={`grid h-10 place-items-center font-display text-lg font-bold ${color}`}
                    >
                      {res}
                    </div>
                    <div className="mt-1 text-center text-[10px] text-muted-foreground">
                      {gf}-{ga}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-3 border-t border-border pt-3 text-center font-display">
              <MiniStat label="G" v={lastFive.filter((f) => (f.home === USER_CLUB_ID ? f.homeGoals! > f.awayGoals! : f.awayGoals! > f.homeGoals!)).length} />
              <MiniStat label="E" v={lastFive.filter((f) => f.homeGoals === f.awayGoals).length} />
              <MiniStat label="P" v={lastFive.filter((f) => (f.home === USER_CLUB_ID ? f.homeGoals! < f.awayGoals! : f.awayGoals! < f.homeGoals!)).length} />
            </div>
          </div>
        </section>

        {/* Quick nav */}
        <section className="border border-border panel">
          <SectionHeader title="Gestión" />
          <div className="flex flex-col divide-y divide-border">
            <NavRow to="/career/squad" label="Plantilla" hint="13 jugadores" />
            <NavRow to="/career/transfers" label="Transferencias" hint="3 ofertas nuevas" badge="3" />
            <NavRow to="/career/table" label="Tabla completa" hint="Ver posiciones" />
            <NavRow to="/career/calendar" label="Calendario" hint="10 fechas restantes" />
          </div>
        </section>
      </div>
    </CareerLayout>
  );
}

function SectionHeader({ title, to }: { title: string; to?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="font-display text-[11px] font-bold uppercase tracking-[0.25em]">{title}</div>
      {to && (
        <Link to={to} className="text-xs text-muted-foreground hover:text-foreground">
          Ver todo ›
        </Link>
      )}
    </div>
  );
}

function MiniStat({ label, v, highlight }: { label: string; v: number | string; highlight?: boolean }) {
  return (
    <div>
      <div className={`text-xl font-bold ${highlight ? "text-accent" : "text-foreground"}`}>{v}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function NavRow({ to, label, hint, badge }: { to: "/career/squad" | "/career/transfers" | "/career/table" | "/career/calendar"; label: string; hint: string; badge?: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3 transition hover:bg-secondary/40">
      <div className="min-w-0 flex-1">
        <div className="font-display text-sm font-bold uppercase tracking-wider">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      {badge && (
        <span className="grid h-6 min-w-6 place-items-center rounded-sm bg-accent px-1.5 font-display text-xs font-bold text-accent-foreground">
          {badge}
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function TeamBlock({ club, home }: { club: ReturnType<typeof clubById>; home?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-3 ${home ? "sm:items-start" : "sm:items-end"}`}>
      <ClubCrest club={club} size={72} />
      <div className="text-center sm:text-inherit">
        <div className="font-display text-lg font-bold uppercase leading-tight">{club.short}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{club.name}</div>
      </div>
    </div>
  );
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between font-display text-[10px] font-bold uppercase tracking-widest">
        <span className="text-muted-foreground">{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden bg-secondary">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
