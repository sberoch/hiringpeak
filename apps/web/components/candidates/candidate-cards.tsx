import { Mail, MessageSquare, MoreHorizontal, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { cn } from "@/lib/utils";
import { PermissionCode } from "@workspace/shared/enums";
import type { Candidate } from "@workspace/shared/types/candidate";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

import { CandidateStars } from "./candidate-stars";
import { DeleteCandidateDialog } from "./delete-candidate-dialog";

interface CandidateCardsProps {
  candidates: Candidate[];
}

export const CandidateCards = ({ candidates }: CandidateCardsProps) => {
  console.log("candidates", candidates);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map((candidate) => (
          <Card
            key={candidate.id}
            className={cn(`overflow-hidden flex`, {
              "border-red-500": candidate.blacklist,
              "border-green-500":
                candidate.isInCompanyViaPratt && !candidate.blacklist,
            })}
          >
            <div className="relative w-1/4 lg:w-1/3">
              <Image
                src={candidate.image || "/images/placeholder.svg"}
                alt={candidate.name}
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
              {candidate.blacklist && (
                <Badge variant="destructive" className="absolute top-2 right-2">
                  Blacklist
                </Badge>
              )}
              {Boolean(
                candidate.isInCompanyViaPratt && !candidate.blacklist
              ) && (
                  <Badge
                    variant="secondary"
                    className="absolute text-white top-2 right-2 bg-green-500/90 hover:bg-green-500"
                  >
                    via Pratt
                  </Badge>
                )}
            </div>
            <CardContent className="p-4 md:w-3/4">
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
                    className="font-bold text-lg hover:underline"
                  >
                    {candidate.name}
                  </Link>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 cursor-pointer"
                    >
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem className="cursor-pointer">
                      <Link href={`/candidates/${candidate.id}/edit`}>
                        Editar candidato
                      </Link>
                    </DropdownMenuItem>
                    <PermissionGuard permissions={[PermissionCode.CANDIDATE_MANAGE]}>
                      <DropdownMenuItem
                        className="text-red-600 cursor-pointer"
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        Eliminar candidato
                      </DropdownMenuItem>
                    </PermissionGuard>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mb-2">
                <CandidateStars stars={+candidate.stars} />
              </div>
              <div className="text-sm text-gray-500 mb-3">
                {candidate.shortDescription && (
                  <div className="truncate">{candidate.shortDescription}</div>
                )}
                {candidate.email && (
                  <div className="truncate flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    {candidate.email}
                  </div>
                )}
                {candidate.phone && (
                  <div className="truncate flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {candidate.phone}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <Badge
                  variant={!candidate?.vacancies?.length ? "outline" : "secondary"}
                >
                  {!candidate?.vacancies?.length
                    ? "Base general"
                    : candidate.vacancies.length === 1
                      ? candidate.vacancies[0]!.title
                      : `${candidate.vacancies.length} vacantes`}
                </Badge>
                {candidate.comments.length > 0 && (
                  <Badge variant="outline">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    <span>{candidate.comments.length}</span>
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <DeleteCandidateDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        candidate={selectedCandidate}
      />
    </>
  );
};
