import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Mail, Phone } from "lucide-react";

import { CandidateStars } from "@/components/candidates/candidate-stars";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
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
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">
          No se encontraron candidatos
        </div>
        <div className="text-gray-400 text-sm">
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            className={cn("overflow-hidden flex cursor-pointer relative", {
              "border-red-500": candidate.blacklist,
              "border-green-500":
                candidate.isInCompanyViaPratt && !candidate.blacklist,
              "border-2 border-black": isSelected,
            })}
            onClick={() => toggleCandidateSelection(candidate.id)}
          >
            {isSelected && (
              <div className="absolute top-2 right-2 bg-black rounded-full p-1 z-10">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
            <div className="relative w-1/4 lg:w-1/5">
              <Image
                src={candidate.image ?? "/images/placeholder.svg"}
                alt={candidate.name}
                width={300}
                height={300}
                className="w-full h-full object-cover"
              />
              {badgeToShow === "blacklisted" && (
                <Badge variant="destructive" className="absolute top-2 right-2">
                  Blacklist
                </Badge>
              )}
              {badgeToShow === "via-pratt" && (
                <Badge
                  variant="secondary"
                  className="absolute text-white top-2 right-2 bg-green-500/90 hover:bg-green-500 truncate whitespace-nowrap overflow-hidden max-w-[80px]"
                >
                  Via Pratt
                </Badge>
              )}
            </div>
            <CardContent className="p-4 w-3/4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {candidate.linkedin && (
                    <Link
                      href={candidate.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image
                        src="/images/linkedin.svg"
                        alt="LinkedIn"
                        width={20}
                        height={20}
                        className="inline-block mr-2"
                      />
                    </Link>
                  )}
                  <Link
                    href={`/candidates/${candidate.id}`}
                    target="_blank"
                    className="font-bold text-lg hover:underline"
                  >
                    {candidate.name}
                  </Link>
                </div>
              </div>
              <div className="mb-2">
                <CandidateStars stars={+candidate.stars} />
              </div>
              <div className="text-sm text-gray-500 mb-3">
                {candidate.shortDescription && (
                  <div className="text-sm mb-2">
                    {candidate.shortDescription}
                  </div>
                )}
                {candidate.email && (
                  <div className="flex items-center mb-1">
                    <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{candidate.email}</span>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center">
                    <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{candidate.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
