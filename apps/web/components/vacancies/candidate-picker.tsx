import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Mail, Phone } from "lucide-react";

import { CandidateStars } from "@/components/candidates/candidate-stars";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { cn } from "@/lib/utils";
import type { Candidate } from "@workspace/shared/types/candidate";
import type { Vacancy } from "@workspace/shared/types/vacancy";

interface CandidatePickerProps {
  candidates: Candidate[];
  selectedCandidates: number[];
  toggleCandidateSelection: (candidateId: number) => void;
  vacancy?: Vacancy;
}

export const CandidatePicker = ({
  candidates,
  selectedCandidates,
  toggleCandidateSelection,
  vacancy,
}: CandidatePickerProps) => {
  const router = useRouter();
  if (candidates.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-2 text-lg text-slate-brand">No se encontraron candidatos</div>
        <div className="text-sm text-muted-brand">
          Intenta ajustar los filtros para encontrar más candidatos
        </div>
        {vacancy && (
          <div className="mt-4 text-sm">
            <Button variant="outline" onClick={() => router.back()}>
              Volver
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {candidates.map((candidate) => {
        const isSelected = selectedCandidates.includes(candidate.id);
        const badgeToShow = candidate.blacklist
          ? "blacklisted"
          : candidate.isInCompanyViaPratt
            ? "via-pratt"
            : null;
        return (
          <Card
            key={candidate.id}
            className={cn(
              "relative flex cursor-pointer overflow-hidden rounded-2xl border border-brand-border bg-surface transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-electric/20",
              {
                "border-red-400": candidate.blacklist,
                "border-emerald-400":
                  candidate.isInCompanyViaPratt && !candidate.blacklist,
                "border-electric bg-electric/4 shadow-[0_0_0_1px_rgba(0,102,255,0.15)]":
                  isSelected,
              },
            )}
            onClick={() => toggleCandidateSelection(candidate.id)}
          >
            {isSelected && (
              <div className="absolute right-2 top-2 z-10 rounded-full bg-electric p-1 shadow-sm">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
            <div className="relative w-1/4 shrink-0 lg:w-1/3">
              <Image
                src={candidate.image ?? "/images/placeholder.svg"}
                alt={candidate.name}
                width={200}
                height={200}
                className="h-full w-full object-cover"
              />
              {badgeToShow === "blacklisted" && (
                <Badge
                  variant="destructive"
                  className="absolute right-2 top-2 rounded-lg text-xs font-semibold"
                >
                  Blacklist
                </Badge>
              )}
              {badgeToShow === "via-pratt" && (
                <Badge
                  variant="secondary"
                  className="absolute right-2 top-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                >
                  via Pratt
                </Badge>
              )}
            </div>
            <CardContent className="min-w-0 flex-1 p-4">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/candidates/${candidate.id}`}
                  target="_blank"
                  className="min-w-0 flex-1 truncate text-base font-semibold text-ink transition-colors hover:text-electric"
                  onClick={(event) => event.stopPropagation()}
                >
                  {candidate.name}
                </Link>
                {candidate.linkedin ? (
                  <Link
                    href={candidate.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-md p-1 text-electric/80 transition-colors hover:bg-electric/8 hover:text-electric"
                    aria-label="LinkedIn"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Image
                      src="/images/linkedin.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="block"
                    />
                  </Link>
                ) : null}
              </div>
              <div className="mb-2 mt-1">
                <CandidateStars stars={+candidate.stars} />
              </div>
              <div className="mb-3 text-sm text-slate-brand">
                {candidate.shortDescription ? (
                  <p className="mb-2 line-clamp-3">{candidate.shortDescription}</p>
                ) : null}
                {candidate.email ? (
                  <div className="mb-1 flex min-w-0 items-center gap-1">
                    <Mail className="h-3 w-3 shrink-0 text-muted-brand" />
                    <span className="min-w-0 truncate">{candidate.email}</span>
                  </div>
                ) : null}
                {candidate.phone ? (
                  <div className="flex min-w-0 items-center gap-1">
                    <Phone className="h-3 w-3 shrink-0 text-muted-brand" />
                    <span className="min-w-0 truncate">{candidate.phone}</span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
