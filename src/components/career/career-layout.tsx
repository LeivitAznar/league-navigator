import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CalendarDays, Trophy, Users, BarChart3, ArrowLeftRight, Home, Play } from "lucide-react";
import { ClubCrest } from "./club-crest";
import { CURRENT_SEASON, USER_CLUB_ID, clubById } from "@/lib/career-data";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/career", label: "Hub", icon: Home, exact: true },
  { to: "/career/calendar", label: "Calendario", icon: CalendarDays },
  { to: "/career/table", label: "Tabla", icon: Trophy },
  { to: "/career/squad", label: "Plantilla", icon: Users },
  { to: "/career/stats", label: "Stats", icon: BarChart3 },
  { to: "/career/transfers", label: "Transfers", icon: ArrowLeftRight },
] as const;

export function CareerLayout({ children }: { children: ReactNode }) {
  const club = clubById(USER_CLUB_ID);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen pitch-bg text-foreground">
      <header className="border-b border-border bg-sidebar/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <ClubCrest club={club} size={44} />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Temporada {CURRENT_SEASON}
            </div>
            <div className="truncate font-display text-lg font-bold uppercase tracking-wider">
              {club.name}
            </div>
          </div>
          <Link
            to="/match"
            className="hidden items-center gap-2 rounded-sm bg-accent px-4 py-2 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground shadow-lg shadow-accent/20 transition hover:brightness-110 sm:inline-flex"
          >
            <Play className="h-4 w-4 fill-current" />
            Jugar próximo
          </Link>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 sm:px-4">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 px-4 py-3 font-display text-xs font-bold uppercase tracking-widest transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {active && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
