import { createFileRoute } from "@tanstack/react-router";
import { CareerLayout } from "@/components/career/career-layout";
import { ClubCrest } from "@/components/career/club-crest";
import { USER_CLUB_ID, clubById, tableSorted } from "@/lib/career-data";
import { cn } from "@/lib/utils";
import { PageHeader } from "./career.calendar";

export const Route = createFileRoute("/career/table")({
  head: () => ({
    meta: [
      { title: "Tabla de Posiciones — Pitch Legends" },
      { name: "description", content: "Tabla de posiciones de la liga con puntos, diferencia de gol y zona de ascenso/descenso." },
    ],
  }),
  component: TableView,
});

function TableView() {
  const rows = tableSorted();
  const zone = (i: number) =>
    i < 2 ? "champ" : i < 4 ? "cup" : i >= rows.length - 2 ? "releg" : null;

  return (
    <CareerLayout>
      <PageHeader title="Tabla de Posiciones" subtitle="Liga Nacional · Fecha 5" />

      <div className="mt-6 overflow-x-auto border border-border panel">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-black/40 font-display text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-3 py-3 text-left">Pos</th>
              <th className="px-3 py-3 text-left">Equipo</th>
              <th className="px-3 py-3 text-center">PJ</th>
              <th className="px-3 py-3 text-center">PG</th>
              <th className="px-3 py-3 text-center">PE</th>
              <th className="px-3 py-3 text-center">PP</th>
              <th className="px-3 py-3 text-center">GF</th>
              <th className="px-3 py-3 text-center">GC</th>
              <th className="px-3 py-3 text-center">DG</th>
              <th className="px-3 py-3 text-center">PTS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const club = clubById(r.clubId);
              const isUser = r.clubId === USER_CLUB_ID;
              const z = zone(i);
              return (
                <tr
                  key={r.clubId}
                  className={cn(
                    "border-b border-border/60 font-display transition hover:bg-secondary/30",
                    isUser && "bg-accent/10 hover:bg-accent/15",
                  )}
                >
                  <td className="relative px-3 py-3">
                    <span
                      className={cn(
                        "absolute inset-y-0 left-0 w-1",
                        z === "champ" && "bg-emerald-500",
                        z === "cup" && "bg-primary",
                        z === "releg" && "bg-destructive",
                      )}
                    />
                    <span className={cn("font-bold", isUser && "text-accent")}>{i + 1}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <ClubCrest club={club} size={28} />
                      <div>
                        <div
                          className={cn(
                            "font-bold uppercase tracking-wider",
                            isUser && "text-accent",
                          )}
                        >
                          {club.name}
                        </div>
                      </div>
                      {isUser && (
                        <span className="ml-1 border border-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-accent">
                          Tú
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{r.played}</td>
                  <td className="px-3 py-3 text-center">{r.won}</td>
                  <td className="px-3 py-3 text-center">{r.drawn}</td>
                  <td className="px-3 py-3 text-center">{r.lost}</td>
                  <td className="px-3 py-3 text-center">{r.gf}</td>
                  <td className="px-3 py-3 text-center">{r.ga}</td>
                  <td className="px-3 py-3 text-center">
                    {r.gd > 0 ? `+${r.gd}` : r.gd}
                  </td>
                  <td className="px-3 py-3 text-center text-lg font-bold">{r.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <Legend color="bg-emerald-500" label="Zona campeón / Continental" />
        <Legend color="bg-primary" label="Clasificación Copa" />
        <Legend color="bg-destructive" label="Zona descenso" />
      </div>
    </CareerLayout>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-1 ${color}`} />
      <span className="font-display uppercase tracking-widest">{label}</span>
    </div>
  );
}
