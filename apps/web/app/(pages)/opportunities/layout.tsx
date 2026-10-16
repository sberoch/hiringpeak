import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Oportunidades",
    template: "%s | HiringPeak",
  },
};

export default function OpportunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
