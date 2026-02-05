"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { Button } from "@/app/components/button";
import { MenuIcon, ArrowRightIcon, XIcon } from "lucide-react";

const navLinks = [
  { href: "#producto", label: "Producto" },
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#contacto", label: "Contacto" },
] as const;

function Logo() {
  return (
    <Link href="#" className="flex items-center gap-1">
      <Image
        src="/logo.png"
        alt="HiringPeak"
        width={56}
        height={56}
        className="h-14 w-auto"
      />
      <span className="font-display text-xl font-bold text-ink tracking-tight">
        HiringPeak
      </span>
    </Link>
  );
}

export function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border/30 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Logo />
            <div className="hidden items-center gap-12 lg:flex">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="nav-link text-sm font-medium"
                >
                  {label}
                </Link>
              ))}
            </div>
            <Button
              asChild
              variant="primary"
              size="default"
              className="hidden lg:inline-flex"
            >
              <Link href="#contacto" className="gap-2">
                Solicitar Demo
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                className="rounded-lg p-2 text-ink transition-colors hover:bg-border-light lg:hidden"
                aria-label="Abrir menú"
              >
                <MenuIcon className="size-6" />
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex h-full w-full flex-col border-0 bg-white p-8 [&>button]:hidden sm:max-w-sm"
              >
                <div className="mb-16 flex items-center justify-between">
                  <Logo />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-2 text-ink transition-colors hover:bg-border-light"
                    aria-label="Cerrar menú"
                  >
                    <XIcon className="size-6" />
                  </button>
                </div>
                <nav className="flex flex-col gap-6">
                  {navLinks.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className="font-display text-3xl font-bold text-ink transition-colors hover:text-accent"
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto">
                  <Button
                    asChild
                    variant="primary"
                    size="full"
                    className="block text-center"
                  >
                    <Link href="#contacto" onClick={() => setOpen(false)}>
                      Solicitar Demo
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </>
  );
}
