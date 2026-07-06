import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { CareerLayout } from "@/components/career/career-layout";
import { ClubCrest } from "@/components/career/club-crest";
import { OFFERS, clubById } from "@/lib/career-data";
import { PageHeader } from "./career.calendar";

export const Route = createFileRoute("/career/transfers")({
  head: () => ({
    meta: [
      { title: "Transferencias — Pitch Legends" },
      { name: "description", content: "Ofertas de otros clubes por tu jugador: aceptá o rechazá contratos." },
    ],
  }),
  component: Transfers,
});

function Transfers() {
  return (
    <CareerLayout>
      <PageHeader title="Transferencias" subtitle={`${OFFERS.length} ofertas recibidas`} />

      {OFFERS.length === 0 ? (
        <div className="mt-8 border border-border panel p-10 text-center text-sm text-muted-foreground">
          No hay ofertas activas por el momento.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {OFFERS.map((o) => {
            const club = clubById(o.fromClub);
            return (
              <div
                key={o.id}
                className="grid gap-4 border border-border panel p-4 sm:grid-cols-[1fr_auto]"
              >
                <div className="flex items-center gap-4">
                  <ClubCrest club={club} size={56} />
                  <div className="min-w-0">
                    <div className="font-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Oferta de
                    </div>
                    <div className="font-display text-xl font-bold uppercase tracking-wider">
                      {club.name}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      <Detail label="Ficha" value={`€${o.fee}M`} />
                      <Detail label="Salario / sem" value={`€${o.wage}k`} accent />
                      <Detail label="Contrato" value={`${o.contractYears} años`} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-2 border border-destructive/60 bg-destructive/20 px-4 py-2 font-display text-xs font-bold uppercase tracking-widest text-foreground transition hover:bg-destructive/40">
                    <X className="h-4 w-4" /> Rechazar
                  </button>
                  <button className="inline-flex items-center gap-2 border border-accent bg-accent px-4 py-2 font-display text-xs font-bold uppercase tracking-widest text-accent-foreground transition hover:brightness-110">
                    <Check className="h-4 w-4" /> Aceptar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CareerLayout>
  );
}

function Detail({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={`font-display text-lg font-bold ${accent ? "text-accent" : ""}`}>
        {value}
      </div>
    </div>
  );
}
