import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Instrument_Sans } from "next/font/google";
import "./globals.css";

const fontDisplay = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fontSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HiringPeak - El ATS Diseñado para Executive Search",
  description:
    "El único ATS construido específicamente para Executive Search. Gestioná búsquedas, candidatos y colocaciones con la precisión que tus clientes esperan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${fontDisplay.variable} ${fontSans.variable} font-sans text-slate bg-canvas antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
