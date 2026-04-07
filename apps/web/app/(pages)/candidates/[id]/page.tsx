"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { CandidateDetailHeader } from "@/components/candidates/candidate-detail/candidate-detail-header";
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
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-brand-border-light rounded-xl w-1/4"></div>
          <div className="h-4 bg-brand-border-light rounded-lg w-1/2"></div>
          <div className="h-4 bg-brand-border-light rounded-lg w-1/3"></div>
          <div className="h-64 bg-brand-border-light rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CandidateDetailHeader candidate={data} />
      <CandidateDetailTabs candidate={data} />
    </div>
  );
}
