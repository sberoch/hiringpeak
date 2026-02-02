import { CandidatesPage } from "@/components/candidates/candidates-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Postulantes | PRATT FIT",
};

export default function CandidatesNextPage() {
  return (
    <div className="container mx-auto">
      <CandidatesPage />
    </div>
  );
}
