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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EditCandidateVacancySchema } from "@/components/candidate-vacancies/edit-candidate-vacancy.schema";
import { CandidateVacancyStatusSkeleton } from "@/components/candidate-vacancy-status/skeleton";
import {
  CANDIDATE_VACANCY_API_KEY,
  updateCandidateVacancy,
} from "@/lib/api/candidate-vacancy";
import {
  CANDIDATE_VACANCY_STATUS_API_KEY,
  getCandidateVacancyStatus,
} from "@/lib/api/candidate-vacancy-status";
import { VACANCY_API_KEY } from "@/lib/api/vacancy";
import { CandidateVacancyState } from "@workspace/shared/enums";
import type {
  CandidateVacancy,
  ListedCandidateVacancy,
} from "@workspace/shared/types/vacancy";
import type { CandidateVacancyStatus } from "@workspace/shared/types/candidate-vacancy-status";

import { CandidateCard } from "./card";
import { CandidateColumn } from "./column";
import { RejectionReasonDialog } from "./rejection-reason-dialog";

const REJECTION_REASON_TRIGGER_STATUS_CODE = CandidateVacancyState.RECHAZADO;

type BoardCandidate = CandidateVacancy | ListedCandidateVacancy;

interface Column {
  code: CandidateVacancyState | null;
  id: number;
  name: string;
  candidates: BoardCandidate[];
}

interface CandidateVacancyUpdatePayload extends EditCandidateVacancySchema {
  id: number;
}

interface PendingMove {
  candidateName: string;
  previousColumns: Column[];
  statusName: string;
  update: CandidateVacancyUpdatePayload;
}

interface UpdateCandidateVacancyRequest {
  previousColumns: Column[];
  update: CandidateVacancyUpdatePayload;
}

interface Props {
  candidates: BoardCandidate[];
  vacancyId?: string;
}

export const KanbanBoard = ({
  candidates: initialCandidates,
  vacancyId,
}: Props) => {
  const queryClient = useQueryClient();
  const [activeCandidate, setActiveCandidate] = useState<BoardCandidate | null>(
    null,
  );
  const [columns, setColumns] = useState<Column[]>([]);
  const [dragSnapshot, setDragSnapshot] = useState<Column[] | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  const { mutate: updateCandidateVacancyStatus, isPending } = useMutation({
    mutationFn: (request: UpdateCandidateVacancyRequest) => {
      const { id, ...candidateVacancy } = request.update;
      return updateCandidateVacancy(id.toString(), candidateVacancy);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [CANDIDATE_VACANCY_API_KEY],
      });

      if (vacancyId) {
        await queryClient.invalidateQueries({
          queryKey: [VACANCY_API_KEY, vacancyId],
        });
      }

      setPendingMove(null);
    },
    onError: (_error, request) => {
      setColumns(cloneColumns(request.previousColumns));
      setPendingMove(null);
      toast.error("Error al actualizar el estado del candidato");
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

  useEffect(() => {
    if (data) {
      setColumns(buildColumns(data.items, initialCandidates));
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
      setDragSnapshot(cloneColumns(columns));
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;
    if (!active.data.current?.type) return;
    if (active.data.current.type !== "CandidateCard") return;

    const activeCandidateId = active.data.current.candidate.id;
    const overColumnId = Number(over.data.current?.columnId ?? over.id);

    setColumns((currentColumns) => {
      const activeIndex = currentColumns.findIndex((column) =>
        column.candidates.some((candidate) => candidate.id === activeCandidateId),
      );
      const overIndex = currentColumns.findIndex(
        (column) => column.id === overColumnId,
      );

      if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
        return currentColumns;
      }

      const draggedCandidate = currentColumns[activeIndex]!.candidates.find(
        (candidate) => candidate.id === activeCandidateId,
      );

      if (!draggedCandidate) {
        return currentColumns;
      }

      return currentColumns.map((column, index) => {
        if (index === activeIndex) {
          return {
            ...column,
            candidates: column.candidates.filter(
              (candidate) => candidate.id !== draggedCandidate.id,
            ),
          };
        }

        if (index === overIndex) {
          return {
            ...column,
            candidates: [...column.candidates, draggedCandidate],
          };
        }

        return column;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    const previousColumns = dragSnapshot ? cloneColumns(dragSnapshot) : null;

    setActiveCandidate(null);
    setDragSnapshot(null);

    if (!previousColumns) {
      return;
    }

    if (!over || !active.data.current?.type) {
      setColumns(previousColumns);
      return;
    }

    if (active.data.current.type !== "CandidateCard") {
      setColumns(previousColumns);
      return;
    }

    const candidate = active.data.current.candidate as BoardCandidate;

    const targetColumnId = Number(over.data.current?.column?.id ?? over.id);
    const targetColumn = columns.find((column) => column.id === targetColumnId);

    if (!targetColumn) {
      setColumns(previousColumns);
      return;
    }

    if (candidate.status?.id === targetColumn.id) {
      setColumns(previousColumns);
      return;
    }

    const update = buildCandidateVacancyUpdatePayload(candidate, targetColumn.id);


    if (targetColumn.name === REJECTION_REASON_TRIGGER_STATUS_CODE) {
      setPendingMove({
        candidateName: candidate.candidate.name,
        previousColumns,
        statusName: targetColumn.name,
        update: {
          ...update,
          rejectionReason: candidate.rejectionReason ?? null,
        },
      });
      return;
    }

    updateCandidateVacancyStatus({
      previousColumns,
      update: {
        ...update,
        rejectionReason: null,
      },
    });
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
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex py-2 px-4 gap-2 overflow-x-auto bg-gray-50 items-start min-h-[500px] rounded-md">
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
                  columns.find((column) =>
                    column.candidates.some((candidate) => candidate.id === activeCandidate.id),
                  )?.id
                }
                vacancyId={vacancyId}
              />
            ) : null}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
      {pendingMove ? (
        <RejectionReasonDialog
          candidateName={pendingMove.candidateName}
          initialValue={pendingMove.update.rejectionReason}
          isOpen={Boolean(pendingMove)}
          isPending={isPending}
          statusName={pendingMove.statusName}
          onCancel={() => {
            setColumns(cloneColumns(pendingMove.previousColumns));
            setPendingMove(null);
          }}
          onConfirm={(rejectionReason) => {
            updateCandidateVacancyStatus({
              previousColumns: pendingMove.previousColumns,
              update: {
                ...pendingMove.update,
                rejectionReason: normalizeRejectionReason(rejectionReason),
              },
            });
          }}
        />
      ) : null}
    </>
  );
};

function buildColumns(
  statuses: CandidateVacancyStatus[],
  candidates: BoardCandidate[],
): Column[] {
  return statuses.map((status) => ({
    code: status.code,
    id: status.id,
    name: status.name,
    candidates: candidates.filter((candidate) => candidate.status?.id === status.id),
  }));
}

function buildCandidateVacancyUpdatePayload(
  candidate: BoardCandidate,
  candidateVacancyStatusId: number,
): CandidateVacancyUpdatePayload {
  return {
    id: candidate.id,
    candidateId: candidate.candidate.id,
    candidateVacancyStatusId,
    notes: candidate.notes ?? "",
    rejectionReason: candidate.rejectionReason ?? null,
    vacancyId: "vacancyId" in candidate ? candidate.vacancyId : candidate.vacancy.id,
  };
}

function cloneColumns(columns: Column[]): Column[] {
  return columns.map((column) => ({
    ...column,
    candidates: [...column.candidates],
  }));
}

function normalizeRejectionReason(rejectionReason: string) {
  const normalizedRejectionReason = rejectionReason.trim();
  return normalizedRejectionReason ? normalizedRejectionReason : null;
}
