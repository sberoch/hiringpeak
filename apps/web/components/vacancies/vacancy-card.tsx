"use client";

import dayjs from "dayjs";
import { Building2, Users } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { cn, getVacancyFilterTags, CATALOG_TYPE_COLORS, stringToColor } from "@/lib/utils";
import { CandidateAvatarStack } from "@/components/ui/candidate-avatar-stack";
import type { Vacancy } from "@workspace/shared/types/vacancy";

interface VacancyCardProps {
  vacancy: Vacancy;
  isSelected: boolean;
  onClick: () => void;
}

export function VacancyCard({ vacancy, isSelected, onClick }: VacancyCardProps) {
  const statusColor = stringToColor(vacancy.status.name);
  const candidateCount = vacancy.candidates.length;
  const daysDiff = dayjs().diff(dayjs(vacancy.createdAt), "day");
  const allTags = getVacancyFilterTags(vacancy.filters);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border p-4 2xl:py-3.5 transition-all ease-[cubic-bezier(0.16,1,0.3,1)] duration-200 cursor-pointer",
        isSelected
          ? "border-electric bg-electric/[0.04] shadow-[0_0_0_1px_rgba(0,102,255,0.15)]"
          : "border-brand-border bg-surface hover:border-electric/30 hover:bg-canvas/50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ink truncate leading-tight">
            {vacancy.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Building2 className="h-3 w-3 text-muted-brand shrink-0" />
            <span className="text-xs text-slate-brand truncate">
              {vacancy.company.name}
            </span>
          </div>
        </div>
        {candidateCount > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden 2xl:block">
              <CandidateAvatarStack candidates={vacancy.candidates} />
            </div>
            <span className="flex h-6 items-center gap-1 rounded-full bg-electric/10 text-[11px] font-bold text-electric px-2">
              <Users className="h-3 w-3" />
              {candidateCount}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        <Badge
          variant="secondary"
          className="text-[10px] font-semibold rounded-md border-0 px-1.5 py-0"
          style={{ backgroundColor: statusColor }}
        >
          {vacancy.status.name}
        </Badge>
        <span className="text-[10px] text-muted-brand">
          {daysDiff}d
        </span>
        {allTags.length > 0 && (
          <>
            <span className="text-brand-border text-[10px]">|</span>
            {allTags.map((tag) => (
              <span
                key={`${tag.type}-${tag.label}`}
                className={`inline-flex items-center rounded-md px-1.5 py-0 text-[10px] font-medium ${CATALOG_TYPE_COLORS[tag.type]}`}
              >
                {tag.label}
              </span>
            ))}
          </>
        )}
      </div>

      {candidateCount > 0 && (
        <div className="flex items-center gap-1.5 mt-2.5 2xl:hidden">
          <CandidateAvatarStack candidates={vacancy.candidates} />
        </div>
      )}
    </button>
  );
}
