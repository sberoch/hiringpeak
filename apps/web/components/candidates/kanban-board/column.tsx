import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import { cn, getColumnGradientColor } from "@/lib/utils";
import type { CandidateVacancy, ListedCandidateVacancy } from "@workspace/shared/types/vacancy";

import { CandidateCard } from "./card";

const COLUMN_COLORS = [
  { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
  { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
];

function getColumnColor(index: number) {
  return COLUMN_COLORS[index % COLUMN_COLORS.length]!;
}

interface ColumnProps {
  column: {
    id: string;
    name: string;
    candidates: (ListedCandidateVacancy | CandidateVacancy)[];
  };
  vacancyId?: string;
  columnIndex: number;
  totalColumns: number;
}

export const CandidateColumn = ({
  column,
  vacancyId,
  columnIndex,
  totalColumns,
}: ColumnProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "CandidateColumn",
      column,
    },
  });
  const { active } = useDndContext();
  const isDragging = Boolean(active);

  const color = getColumnColor(columnIndex);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-full p-2 rounded-xl flex flex-col transition-all duration-200",
        {
          "bg-electric/[0.04] border border-electric/20": isOver,
          "w-64 min-w-64": isVisible,
          "w-24 min-w-24": !isVisible,
        }
      )}
    >
      <div className="flex justify-between items-center">
        <Badge
          className={cn(
            "text-sm font-semibold px-3 py-0.5 rounded-lg border-0",
            color.bg,
            color.text,
            {
              truncate: !isVisible,
              "max-w-16": !isVisible,
            }
          )}
        >
          {column.name}
        </Badge>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="p-1 rounded-md hover:bg-electric/5 hover:text-electric transition-colors"
        >
          {isVisible ? (
            <EyeOff size={16} className="text-muted-brand" />
          ) : (
            <Eye size={16} className="text-muted-brand" />
          )}
        </button>
      </div>
      <Separator className="my-2 bg-brand-border-light" />
      {isVisible ? (
        <div className={cn("flex-grow", { "pointer-events-none": isDragging })}>
          <SortableContext
            id={column.id}
            items={column.candidates.map((candidate) => candidate.id)}
            strategy={verticalListSortingStrategy}
          >
            {column.candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                columnId={column.id}
                vacancyId={vacancyId}
              />
            ))}
          </SortableContext>
          {column.candidates.length === 0 && (
            <div className="h-20 flex items-center justify-center text-muted-brand text-sm">
              Sin candidatos
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
