import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { href: "#producto", label: "Producto" },
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#contacto", label: "Contacto" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-ink-light py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
          <Link href="#" className="flex items-center gap-1">
            <Image
              src="/logo_black.png"
              alt="HiringPeak"
              width={56}
              height={56}
              className="h-14 w-auto"
            />
            <span className="font-display text-lg font-bold text-white">
              HiringPeak
            </span>
          </Link>
          <nav className="flex flex-wrap justify-center gap-8 text-sm">
            {footerLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-white/60 transition-colors hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
          <p className="text-sm text-white/40">
            &copy; 2024 HiringPeak. Hecho para Executive Search.
          </p>
        </div>
      </div>
    </footer>
  );
}
