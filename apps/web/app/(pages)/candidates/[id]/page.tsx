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
      <div className="container mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <CandidateDetailHeader candidate={data} />
      <CandidateDetailTabs candidate={data} />
    </div>
  );
}
