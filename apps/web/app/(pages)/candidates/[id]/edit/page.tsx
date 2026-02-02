"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Heading } from "@workspace/ui/components/heading";
import { Button } from "@workspace/ui/components/button";
import { CANDIDATE_API_KEY, getCandidateById } from "@/lib/api/candidate";
import EditCandidateForm from "@/components/candidates/edit-candidate-form";

export default function EditCandidatePage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = Number(params.id);

  const {
    data: candidate,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [CANDIDATE_API_KEY, candidateId],
    queryFn: () => getCandidateById(candidateId),
  });

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (isError || !candidate) {
    return <div>No se encontró el candidato</div>;
  }

  return (
    <div className="container mx-auto p-4 mb-12">
      <div className="flex items-center mb-6 gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          ← Volver
        </Button>
        <Heading>Editar Postulante</Heading>
      </div>
      <EditCandidateForm candidate={candidate} />
    </div>
  );
}
