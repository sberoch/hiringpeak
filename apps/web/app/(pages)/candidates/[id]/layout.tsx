import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Detalle de postulante",
    template: "%s | HiringPeak",
  },
};

export default function CandidateDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
