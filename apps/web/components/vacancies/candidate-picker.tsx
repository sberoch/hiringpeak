"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Mail, Phone, Users } from "lucide-react";

import { CandidateStars } from "@/components/candidates/candidate-stars";
import { CatalogBadge } from "@/components/ui/catalog-badge";
import { Badge } from "@workspace/ui/components/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { cn, getInitials, type CatalogTag } from "@/lib/utils";
import type { Candidate } from "@workspace/shared/types/candidate";

interface CandidatePickerProps {
  candidates: Candidate[];
  selectedCandidates: number[];
  toggleCandidateSelection: (candidateId: number) => void;
}

export function CandidatePickerSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl border border-brand-border bg-surface p-3"
        >
          <div className="h-16 w-16 rounded-full bg-brand-border-light animate-pulse shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-3.5 w-32 bg-brand-border-light animate-pulse rounded" />
            <div className="h-3 w-24 bg-brand-border-light animate-pulse rounded" />
            <div className="h-3 w-full bg-brand-border-light animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const CandidatePicker = ({
  candidates,
  selectedCandidates,
  toggleCandidateSelection,
}: CandidatePickerProps) => {
  if (candidates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-border bg-surface px-6 py-12 flex flex-col items-center text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric/10 text-electric mb-3">
          <Users className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-ink">
          No se encontraron postulantes
        </p>
        <p className="text-xs text-muted-brand mt-1 max-w-xs">
          Ajustá los filtros del perfil buscado para ampliar los resultados.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {candidates.map((candidate) => {
        const isSelected = selectedCandidates.includes(candidate.id);
        const tags: CatalogTag[] = [
          ...(candidate.seniorities ?? []).map((s) => ({
            label: s.name,
            type: "seniority" as const,
          })),
          ...(candidate.areas ?? []).map((a) => ({
            label: a.name,
            type: "area" as const,
          })),
          ...(candidate.industries ?? []).map((i) => ({
            label: i.name,
            type: "industry" as const,
          })),
        ];

        return (
          <button
            key={candidate.id}
            type="button"
            onClick={() => toggleCandidateSelection(candidate.id)}
            className={cn(
              "group relative flex items-start gap-3 rounded-xl border bg-surface p-3 text-left shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200",
              "hover:border-electric/30 hover:shadow-[0_2px_8px_rgba(0,102,255,0.06)]",
              isSelected
                ? "border-electric ring-2 ring-electric/15"
                : "border-brand-border",
              candidate.blacklist && !isSelected && "border-red-400/60",
              candidate.isInCompanyViaPratt &&
                !candidate.blacklist &&
                !isSelected &&
                "border-emerald-400/60",
            )}
          >
            <Avatar className="h-20 w-20 shrink-0 border border-brand-border">
              {candidate.image && (
                <AvatarImage src={candidate.image} alt={candidate.name} />
              )}
              <AvatarFallback className="bg-electric/5 text-electric text-sm font-semibold">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 pr-7">
                {candidate.linkedin && (
                  <Link
                    href={candidate.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  >
                    <Image
                      src="/images/linkedin.svg"
                      alt="LinkedIn"
                      width={14}
                      height={14}
                    />
                  </Link>
                )}
                <Link
                  href={`/candidates/${candidate.id}`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-semibold text-ink truncate hover:text-electric transition-colors"
                >
                  {candidate.name}
                </Link>
                {candidate.blacklist && (
                  <Badge
                    variant="destructive"
                    className="ml-auto shrink-0 rounded-md px-1.5 py-0 text-[10px] font-semibold"
                  >
                    Blacklist
                  </Badge>
                )}
                {candidate.isInCompanyViaPratt && !candidate.blacklist && (
                  <Badge className="ml-auto shrink-0 rounded-md px-1.5 py-0 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-0 hover:bg-emerald-50">
                    via Pratt
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <CandidateStars stars={+candidate.stars} size="sm" />
                {tags.slice(0, 2).map((tag) => (
                  <CatalogBadge
                    key={`${tag.type}-${tag.label}`}
                    label={tag.label}
                    type={tag.type}
                  />
                ))}
              </div>

              {candidate.shortDescription && (
                <p className="text-xs text-slate-brand truncate mt-1.5">
                  {candidate.shortDescription}
                </p>
              )}

              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-brand">
                {candidate.email && (
                  <span className="flex items-center gap-1 min-w-0">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{candidate.email}</span>
                  </span>
                )}
                {candidate.phone && (
                  <span className="flex items-center gap-1 shrink-0">
                    <Phone className="h-3 w-3" />
                    <span>{candidate.phone}</span>
                  </span>
                )}
              </div>
            </div>

            <div
              className={cn(
                "absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
                isSelected
                  ? "bg-electric border-electric text-white"
                  : "border-brand-border bg-surface text-transparent group-hover:border-electric/40",
              )}
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </div>
          </button>
        );
      })}
    </div>
  );
};
