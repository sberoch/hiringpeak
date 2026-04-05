"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { CandidateVacancy, ListedCandidateVacancy } from "@workspace/shared/types/vacancy";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@/lib/utils";
import { CandidateStars } from "../candidate-stars";
import { RemoveCandidateFromVacancyDialog } from "./remove-candidate-from-vacancy-dialog";

export const CandidateCard = ({
  candidate,
  columnId,
  vacancyId,
}: {
  candidate: CandidateVacancy | ListedCandidateVacancy;
  columnId?: number;
  vacancyId?: string;
}) => {
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: candidate.id,
    data: {
      type: "CandidateCard",
      candidate,
      columnId,
    },
  });

  return (
    <>
      <Card
        className={cn("overflow-hidden mb-2 touch-none group", {
          "border-red-500": candidate.candidate.blacklist,
          "border-green-500":
            candidate.candidate.isInCompanyViaPratt &&
            !candidate.candidate.blacklist,
          "opacity-50": isDragging,
          "pointer-events-none": isDragging,
        })}
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
        {...listeners}
        {...attributes}
      >
        <CardContent className="p-2">
          <div className="flex items-start gap-2">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src={candidate.candidate.image || "/images/placeholder.svg"}
                alt={candidate.candidate.name}
                width={60}
                height={60}
                className="w-full h-full object-cover rounded-full"
              />
              {candidate.candidate.blacklist && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 w-2 h-2 p-0"
                />
              )}
              {Boolean(
                candidate.candidate.isInCompanyViaPratt &&
                !candidate.candidate.blacklist
              ) && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-green-500"
                  />
                )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center flex-1 min-w-0">
                  {candidate.candidate.linkedin && (
                    <Link
                      href={candidate.candidate.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mr-1 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Image
                        src="/images/linkedin.svg"
                        alt="LinkedIn"
                        width={16}
                        height={16}
                        className="inline-block"
                      />
                    </Link>
                  )}
                  <Link
                    href={`/candidates/${candidate.candidate.id}`}
                    className="font-medium text-sm hover:underline truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {candidate.candidate.name}
                  </Link>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    >
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenuItem
                      className="text-red-600 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsRemoveDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Eliminar de la vacante
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CandidateStars stars={+candidate.candidate.stars} />
            </div>
          </div>
          {candidate.candidate.shortDescription && (
            <p className="text-xs text-gray-500 mt-2">
              {candidate.candidate.shortDescription}
            </p>
          )}
        </CardContent>
      </Card>
      <RemoveCandidateFromVacancyDialog
        isOpen={isRemoveDialogOpen}
        onClose={() => setIsRemoveDialogOpen(false)}
        candidateVacancy={candidate}
        vacancyId={vacancyId}
      />
    </>
  );
};
