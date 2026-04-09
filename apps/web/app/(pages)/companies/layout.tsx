import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Empresas",
    template: "%s | HiringPeak",
  },
};

export default function CompaniesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
