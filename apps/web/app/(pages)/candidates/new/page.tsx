import { Suspense } from "react";
import { Metadata } from "next";

import NewCandidateForm from "@/components/candidates/new-candidate-form";

export const metadata: Metadata = {
  title: "Nuevo postulante | PRATT FIT",
};

export default function NewCandidate() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={null}>
        <NewCandidateForm />
      </Suspense>
    </div>
  );
}
