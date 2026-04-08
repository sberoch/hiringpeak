"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  closestCenter,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMutation, useQuery } from "@tanstack/react-query";

import { EditCandidateVacancySchema } from "@/components/candidate-vacancies/edit-candidate-vacancy.schema";
import { CandidateVacancyStatusSkeleton } from "@/components/candidate-vacancy-status/skeleton";
import { updateCandidateVacancy } from "@/lib/api/candidate-vacancy";
import {
  CANDIDATE_VACANCY_STATUS_API_KEY,
  getCandidateVacancyStatus,
} from "@/lib/api/candidate-vacancy-status";
import type {
  CandidateVacancy,
  ListedCandidateVacancy,
} from "@workspace/shared/types/vacancy";
import type { CandidateVacancyStatus } from "@workspace/shared/types/candidate-vacancy-status";

import { CandidateCard } from "./card";
import { CandidateColumn } from "./column";

interface Column {
  id: string;
  name: string;
  candidates: ListedCandidateVacancy[];
}

interface Props {
  candidates: (ListedCandidateVacancy | CandidateVacancy)[];
  vacancyId?: string;
}

export const KanbanBoard = ({
  candidates: initialCandidates,
  vacancyId,
}: Props) => {
  const { mutateAsync } = useMutation({
    mutationFn: (edits: (EditCandidateVacancySchema & { id: number })[]) => {
      return Promise.all(
        edits.map((e) => {
          const { id, ...rest } = e;
          return updateCandidateVacancy(id.toString(), rest);
        })
      );
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      CANDIDATE_VACANCY_STATUS_API_KEY,
      { order: "sort:asc", limit: 1e9, page: 1 },
    ],
    queryFn: () =>
      getCandidateVacancyStatus({ order: "sort:asc", limit: 1e9, page: 1 }),
  });

  const [activeCandidate, setActiveCandidate] =
    useState<CandidateVacancy | null>(null);

  const [columns, setColumns] = useState<Column[]>([]);

  useEffect(() => {
    if (data) {
      setColumns(
        data.items.map((status: CandidateVacancyStatus) => ({
          id: status.id.toString(),
          name: status.name,
          candidates: initialCandidates.filter(
            (candidate) =>
              "status" in candidate && candidate.status?.id === status.id
          ) as ListedCandidateVacancy[],
        }))
      );
    }
  }, [data, initialCandidates]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 50,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "CandidateCard") {
      setActiveCandidate(event.active.data.current.candidate);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;
    if (!active.data.current?.type) return;
    if (active.data.current.type !== "CandidateCard") return;

    const activeColumnId = active.data.current.columnId;
    const overColumnId = over.data.current?.columnId || over.id;

    if (activeColumnId === overColumnId) return;

    setColumns((columns) => {
      const activeIndex = columns.findIndex((col) => col.id === activeColumnId);
      const overIndex = columns.findIndex((col) => col.id === overColumnId);

      if (activeIndex === -1 || overIndex === -1) return columns;

      const activeCandidate = columns[activeIndex]!.candidates.find(
        (candidate) => candidate.id === active.data.current?.candidate.id
      );

      if (!activeCandidate) return columns;

      return columns.map((column, index) => {
        if (index === activeIndex) {
          return {
            ...column,
            candidates: column.candidates.filter(
              (candidate) => candidate.id !== activeCandidate.id
            ),
          };
        }

        if (index === overIndex) {
          return {
            ...column,
            candidates: [...column.candidates, activeCandidate],
          };
        }

        return column;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveCandidate(null);

    if (!over) return;
    if (!active.data.current?.type) return;
    if (active.data.current.type !== "CandidateCard") return;

    const column = over?.data.current?.column as Column;
    mutateAsync(
      column.candidates.map((c) => ({
        id: c.id,
        candidateId: c.candidate.id,
        notes: c.notes ?? "",
        vacancyId: c.vacancyId,
        candidateVacancyStatusId: parseInt(column.id),
      }))
    );
  };

  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const columnCollisions = pointerWithin(args);

    if (columnCollisions.length > 0) {
      const columnCollision = columnCollisions.find(
        (collision) =>
          collision.data?.droppableContainer?.data?.current?.type ===
          "CandidateColumn"
      );

      if (columnCollision) {
        return [columnCollision];
      }
    }

    return closestCenter(args);
  };

  if (isLoading) return <CandidateVacancyStatusSkeleton />;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex py-3 px-3 gap-2 overflow-x-auto bg-canvas items-start min-h-[500px] rounded-2xl border border-brand-border">
        {columns.map((column, index) => (
          <CandidateColumn
            key={column.id}
            column={column}
            vacancyId={vacancyId}
            columnIndex={index}
            totalColumns={columns.length}
          />
        ))}
      </div>
      {createPortal(
        <DragOverlay>
          {activeCandidate ? (
            <CandidateCard
              candidate={activeCandidate}
              columnId={
                columns.find((col) =>
                  col.candidates.some((c) => c.id === activeCandidate.id)
                )?.id
              }
              vacancyId={vacancyId}
            />
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
};
