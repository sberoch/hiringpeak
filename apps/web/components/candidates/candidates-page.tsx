"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Image as ImageIcon, Plus, Table } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@workspace/ui/components/button";
import { DataTable } from "@workspace/ui/components/data-table";
import { Heading } from "@workspace/ui/components/heading";
import { Switch } from "@workspace/ui/components/switch";
import { CandidateFilters } from "@/components/candidates/candidate-filters";
import { columns } from "@/components/candidates/candidate-table-columns";
import { useCandidatesFilters } from "@/hooks/use-candidate-filters";
import { CANDIDATE_API_KEY, getAllCandidates } from "@/lib/api/candidate";
import {
  CANDIDATE_VACANCY_API_KEY,
  getCandidateVacancies,
} from "@/lib/api/candidate-vacancy";
import { mergeCandidatesWithVacancies } from "@/lib/utils";

import { CandidateCards } from "./candidate-cards";

export const CandidatesPage = () => {
  const [view, setView] = useState<"table" | "images">("table");

  const {
    filters,
    params,
    resetFilters,
    setFilters,
    onPaginationChange,
    onSortingChange,
  } = useCandidatesFilters({
    initialValues: { limit: 50, order: "createdAt:desc" },
  });
  const { data, isLoading } = useQuery({
    queryKey: [CANDIDATE_API_KEY, params],
    queryFn: () => getAllCandidates(params),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const candidateIds = useMemo(() => {
    return data?.items.map((candidate) => candidate.id) || [];
  }, [data?.items]);

  const { data: candidateVacancies } = useQuery({
    queryKey: [CANDIDATE_VACANCY_API_KEY, candidateIds],
    queryFn: () => getCandidateVacancies({ candidateIds }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const candidatesWithVacancies = useMemo(() => {
    if (!data?.items || !candidateVacancies?.items) {
      return data?.items || [];
    }
    return mergeCandidatesWithVacancies(data.items, candidateVacancies.items);
  }, [data?.items, candidateVacancies?.items]);

  useEffect(() => {
    const savedView = localStorage.getItem("preferred-candidate-view");
    if (savedView === "table" || savedView === "images") {
      setView(savedView);
    }
  }, []);

  const handleViewChange = () => {
    const newView = view === "table" ? "images" : "table";
    setView(newView);
    localStorage.setItem("preferred-candidate-view", newView);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center justify-between gap-8">
          <Heading>Postulantes</Heading>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            <Switch checked={view === "table"} onCheckedChange={handleViewChange} />
            <Table className="h-5 w-5" />
          </div>
        </div>
        <Link href="/candidates/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo Postulante
          </Button>
        </Link>
      </div>
      <CandidateFilters
        resetFilters={resetFilters}
        filters={filters}
        onFiltersChange={setFilters}
      />
      <div className="mt-6 mb-12">
        {view === "table" ? (
          <DataTable
            columns={columns}
            data={candidatesWithVacancies}
            pagination={{
              totalItems: data?.meta.totalItems || 1,
              pageCount: data?.meta.totalPages || 1,
              pageIndex: (filters.page || 1) - 1,
              pageSize: filters.limit || 10,
              onPaginationChange,
            }}
            sorting={{
              order: filters.order,
              onSortingChange,
            }}
            loading={isLoading && !data}
          />
        ) : (
          <CandidateCards candidates={candidatesWithVacancies} />
        )}
      </div>
    </>
  );
};
