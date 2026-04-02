import { CandidatesPage } from "@/components/candidates/candidates-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Postulantes | PRATT FIT",
};

export default function CandidatesNextPage() {
  return (
    <div className="flex flex-col">
      <CandidatesPage />
    </div>
  );
}
