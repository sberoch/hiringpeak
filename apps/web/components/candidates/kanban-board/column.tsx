import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import { cn, getColumnGradientColor } from "@/lib/utils";
import type { CandidateVacancy, ListedCandidateVacancy } from "@workspace/shared/types/vacancy";

import { CandidateCard } from "./card";

interface ColumnProps {
  column: {
    id: number;
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

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-full p-2 rounded-md flex flex-col transition-all duration-200",
        {
          "bg-gray-100 border border-gray-300": isOver,
          "w-64 min-w-64": isVisible,
          "w-24 min-w-24": !isVisible,
        }
      )}
    >
      <div className="flex justify-between items-center">
        <Badge
          className={cn("text-base font-medium text-black px-6", {
            truncate: !isVisible,
            "max-w-16": !isVisible,
          })}
          style={{
            backgroundColor: getColumnGradientColor(columnIndex, totalColumns),
          }}
        >
          {column.name}
        </Badge>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="p-1 hover:text-primary"
        >
          {isVisible ? (
            <EyeOff size={16} className="text-gray-600" />
          ) : (
            <Eye size={16} className="text-gray-600" />
          )}
        </button>
      </div>
      <Separator className="my-2" />
      {isVisible ? (
        <div className={cn("flex-grow", { "pointer-events-none": isDragging })}>
          <SortableContext
            id={column.id.toString()}
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
            <div className="h-20 flex items-center justify-center text-gray-400 text-sm">
              Sin candidatos
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
