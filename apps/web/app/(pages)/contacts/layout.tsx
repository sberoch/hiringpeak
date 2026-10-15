import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Contactos",
    template: "%s | HiringPeak",
  },
};

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
