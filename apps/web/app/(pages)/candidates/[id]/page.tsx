"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  CandidateDetailToolbar,
  CandidateProfileCard,
} from "@/components/candidates/candidate-detail/candidate-detail-header";
import { CandidateDetailTabs } from "@/components/candidates/candidate-detail/candidate-detail-tabs";
import { CANDIDATE_API_KEY, getCandidateById } from "@/lib/api/candidate";

export default function NextCandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: [CANDIDATE_API_KEY, id],
    queryFn: () => getCandidateById(parseInt(id)),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  if (!data && !isLoading) {
    toast.error("Candidate no encontrado");
    return router.push("/candidates");
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-brand-border-light animate-pulse rounded-xl" />
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-[320px] 2xl:w-[360px] shrink-0">
            <div className="h-[500px] bg-brand-border-light animate-pulse rounded-2xl" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="h-10 w-48 bg-brand-border-light animate-pulse rounded-xl mb-4" />
            <div className="h-64 bg-brand-border-light animate-pulse rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="mb-6">
        <CandidateDetailToolbar candidate={data} />
      </div>
      <div className="grid lg:grid-cols-[320px_1fr] 2xl:grid-cols-[360px_1fr] gap-6 h-full">
        {/* Left: profile card */}
        <div className="h-full">
          <div className="lg:sticky lg:top-6 h-full">
            <CandidateProfileCard candidate={data} />
          </div>
        </div>
        {/* Right: tabs — h-full chain ensures card stretches to match left */}
        <div className="h-full flex flex-col">
          <CandidateDetailTabs candidate={data} />
        </div>
      </div>
    </div>
  );
}
