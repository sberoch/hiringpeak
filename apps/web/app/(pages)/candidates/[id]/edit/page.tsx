"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { UserPen } from "lucide-react";
import { PageHeading } from "@workspace/ui/components/page-heading";

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
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="brand-ghost"
          className="h-10 px-4 text-sm font-medium"
          onClick={() => router.back()}
        >
          ← Volver
        </Button>
        <PageHeading
          icon={UserPen}
          title="Editar Postulante"
          description="Modifique los datos del postulante. Los campos con * son obligatorios."
        />
      </div>
      <EditCandidateForm candidate={candidate} />
    </div>
  );
}
