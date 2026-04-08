"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type {
  CandidateVacancy,
  ListedCandidateVacancy,
} from "@workspace/shared/types/vacancy";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn, CATALOG_TYPE_COLORS, type CatalogTagType } from "@/lib/utils";
import { CandidateStars } from "../candidate-stars";
import { RemoveCandidateFromVacancyDialog } from "./remove-candidate-from-vacancy-dialog";

export const CandidateCard = ({
  candidate,
  columnId,
  vacancyId,
}: {
  candidate: CandidateVacancy | ListedCandidateVacancy;
  columnId?: string;
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
        className={cn(
          "overflow-hidden py-0 mb-2 cursor-pointer group rounded-xl border-brand-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-electric/20 transition-all duration-200",
          {
            "border-red-400/60": candidate.candidate.blacklist,
            "border-emerald-500/60":
              candidate.candidate.isInCompanyViaPratt &&
              !candidate.candidate.blacklist,
            "opacity-50": isDragging,
            "pointer-events-none": isDragging,
          },
        )}
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
        {...listeners}
        {...attributes}
      >
        <CardContent className="px-2.5 py-2">
          <div className="flex items-center gap-2">
            <div className="relative w-11 h-11 flex-shrink-0">
              <Image
                src={candidate.candidate.image || "/images/placeholder.svg"}
                alt={candidate.candidate.name}
                width={44}
                height={44}
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
                !candidate.candidate.blacklist,
              ) && (
                <Badge
                  variant="secondary"
                  className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-emerald-500/80"
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center flex-1 min-w-0 gap-1">
                  {candidate.candidate.linkedin && (
                    <Link
                      href={candidate.candidate.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Image
                        src="/images/linkedin.svg"
                        alt="LinkedIn"
                        width={14}
                        height={14}
                        className="inline-block"
                      />
                    </Link>
                  )}
                  <Link
                    href={`/candidates/${candidate.candidate.id}`}
                    className="text-sm font-semibold text-ink hover:text-electric truncate transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {candidate.candidate.name}
                  </Link>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
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
              <div className="flex items-center gap-1.5 mt-0.5">
                <CandidateStars stars={+candidate.candidate.stars} size="sm" />
                {(() => {
                  const tags = [
                    ...(candidate.candidate.seniorities ?? []).map((s) => ({ label: s.name, type: "seniority" as CatalogTagType })),
                    ...(candidate.candidate.areas ?? []).map((a) => ({ label: a.name, type: "area" as CatalogTagType })),
                    ...(candidate.candidate.industries ?? []).map((i) => ({ label: i.name, type: "industry" as CatalogTagType })),
                  ];
                  if (!tags.length) return null;
                  return (
                    <>
                      <span className="text-brand-border text-[10px]">·</span>
                      <div className="flex items-center gap-1 overflow-hidden">
                        {tags.slice(0, 2).map((tag) => (
                          <span
                            key={`${tag.type}-${tag.label}`}
                            className={`inline-flex shrink-0 rounded-md px-1.5 py-0 text-[10px] font-medium ${CATALOG_TYPE_COLORS[tag.type]}`}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
              {candidate.candidate.shortDescription && (
                <p className="text-[11px] text-slate-brand truncate mt-0.5">
                  {candidate.candidate.shortDescription}
                </p>
              )}
            </div>
          </div>
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
