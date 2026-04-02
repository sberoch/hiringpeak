"use client";

import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, UserPlus, Users } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import type { PaginatedResponse } from "@workspace/shared/types/api";
import type { Candidate } from "@workspace/shared/types/candidate";
import { CANDIDATE_API_KEY, getAllCandidates } from "@/lib/api/candidate";
import { getInitials } from "@/lib/utils";

dayjs.extend(relativeTime);
dayjs.locale("es");

export function LatestCandidates() {
  const { data, isLoading } = useQuery<PaginatedResponse<Candidate>>({
    queryKey: [CANDIDATE_API_KEY, { page: 1, limit: 5, order: "createdAt:desc" }],
    queryFn: () =>
      getAllCandidates({ page: 1, limit: 5, order: "createdAt:desc" }),
  });

  const candidates = data?.items ?? [];

  return (
    <div className="rounded-2xl border border-brand-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric/10 text-electric">
            <UserPlus className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold tracking-tight text-ink">
            Últimos candidatos
          </h3>
        </div>
        <Link
          href="/candidates"
          className="flex items-center gap-1 text-xs font-semibold text-electric hover:text-electric-light transition-colors group"
        >
          Ver todos
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="divide-y divide-brand-border-light">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <div className="h-9 w-9 rounded-full bg-brand-border-light animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-28 rounded bg-brand-border-light animate-pulse" />
                <div className="h-3 w-20 rounded bg-brand-border-light animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-brand">
          <Users className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">Sin candidatos recientes</p>
        </div>
      ) : (
        <div className="divide-y divide-brand-border-light">
          {candidates.map((candidate) => (
            <Link
              key={candidate.id}
              href={`/candidates/${candidate.id}`}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-electric/[0.03] group"
            >
              <Avatar className="h-9 w-9 border border-brand-border">
                {candidate.image && (
                  <AvatarImage src={candidate.image} alt={candidate.name} />
                )}
                <AvatarFallback className="bg-electric/5 text-electric text-xs font-semibold">
                  {getInitials(candidate.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate group-hover:text-electric transition-colors">
                  {candidate.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {candidate.areas.length > 0 ? (
                    <span className="text-xs text-slate-brand truncate">
                      {candidate.areas.map((a) => a.name).join(", ")}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-brand italic">
                      Sin área
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 text-muted-brand shrink-0">
                <Clock className="h-3 w-3" />
                <span className="text-[11px]">
                  {dayjs(candidate.createdAt).fromNow()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
