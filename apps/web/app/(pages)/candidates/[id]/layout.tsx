import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Detalle de postulante",
    template: "%s | PRATT FIT",
  },
};

export default function CandidateDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
