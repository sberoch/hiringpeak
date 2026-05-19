import { Suspense } from "react";
import { Metadata } from "next";

import NewCandidatePageWrapper from "@/components/candidates/new-candidate-page-wrapper";

export const metadata: Metadata = {
  title: "Nuevo postulante",
};

export default function NewCandidate() {
  return (
    <div className="flex flex-col">
      <Suspense fallback={null}>
        <NewCandidatePageWrapper />
      </Suspense>
    </div>
  );
}
