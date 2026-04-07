import { Suspense } from "react";
import { Metadata } from "next";

import NewCandidateForm from "@/components/candidates/new-candidate-form";

export const metadata: Metadata = {
  title: "Nuevo postulante",
};

export default function NewCandidate() {
  return (
    <div className="flex flex-col">
      <Suspense fallback={null}>
        <NewCandidateForm />
      </Suspense>
    </div>
  );
}
