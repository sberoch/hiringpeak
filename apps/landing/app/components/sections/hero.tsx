import Image from "next/image";
import Link from "next/link";
import { Button } from "@/app/components/button";
import { Badge } from "@/app/components/badge";
import { ArrowRightIcon, PlayIcon } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-20 gradient-mesh-hero">
      <Image
        src="/cool_vector.png"
        alt=""
        width={800}
        height={400}
        className="pointer-events-none absolute left-[-15%] top-10 w-[800px] opacity-50 lg:w-[800px]"
      />
      <div className="orb orb-blue -right-40 top-20 h-[500px] w-[500px] opacity-60" />
      <div className="orb orb-dark -left-20 bottom-20 h-[400px] w-[400px] opacity-40" />
      <div className="orb orb-soft top-1/2 left-1/3 h-[300px] w-[300px] opacity-50" />
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230066ff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-20 lg:px-8 lg:py-32">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <div className="order-2 lg:order-1">
            <Badge className="fade-up fade-up-1 mb-8 inline-flex items-center gap-3">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              <span className="bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-sm font-semibold text-transparent">
                Para Firmas de Executive Search
              </span>
            </Badge>
            <h1 className="fade-up fade-up-2 font-display mb-8 text-5xl font-extrabold leading-[0.95] tracking-tight text-ink md:text-6xl lg:text-7xl">
              El único ATS para
              <br />
              <span className="bg-gradient-to-r from-accent to-accent-deeper bg-clip-text text-transparent">
                colocar ejecutivos
              </span>
            </h1>
            <p className="fade-up fade-up-3 mb-10 max-w-lg text-lg leading-relaxed text-slate md:text-xl">
              Pipeline visual, perfiles ejecutivos detallados, integración con
              LinkedIn. Todo lo que necesitás para cerrar más colocaciones
              C-level.
            </p>
            <div className="fade-up fade-up-4 flex flex-col gap-4 sm:flex-row">
              <Button asChild variant="primary" size="lg" className="group gap-3">
                <Link href="#contacto">
                  Solicitar Demo
                  <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="gap-2">
                <Link href="#producto">
                  <PlayIcon className="size-5 text-accent" />
                  Ver en acción
                </Link>
              </Button>
            </div>
            <div className="fade-up fade-up-5 mt-14 border-t border-border/50 pt-8">
              <p className="mb-4 text-sm font-medium text-muted">
                Elegido por firmas en toda Latinoamérica
              </p>
            </div>
          </div>
          <div className="fade-up fade-up-3 order-1 lg:order-2 relative">
            <Image
              src="/images/rocket-nobg.png"
              alt=""
              width={128}
              height={128}
              className="absolute -right-2 -top-10 z-10 hidden w-20 opacity-90 sm:block lg:-right-8 lg:w-32"
            />
            <Image
              src="/images/ladder-nobg.png"
              alt=""
              width={128}
              height={128}
              className="absolute -bottom-4 -left-4 z-10 hidden w-16 opacity-80 md:block lg:-left-10 lg:w-32"
            />
            <div className="product-frame">
              <div className="flex items-center gap-2 border-b border-border/30 bg-gradient-to-r from-border-light/80 to-border-light/40 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-4 flex-1">
                  <div className="h-6 max-w-xs rounded-md bg-border/40" />
                </div>
              </div>
              <div className="aspect-[4/3] bg-gradient-to-br from-canvas to-white p-6">
                <div className="flex h-full flex-col gap-4 rounded-xl border border-border/30 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 rounded bg-border/60" />
                    <div className="flex gap-2">
                      <div className="h-8 w-20 rounded-lg bg-accent/10" />
                      <div className="h-8 w-8 rounded-lg bg-border/40" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="h-20 rounded-lg border border-accent/10 bg-gradient-to-br from-accent/15 to-accent/5" />
                    <div className="h-20 rounded-lg border border-border/30 bg-border-light" />
                    <div className="h-20 rounded-lg border border-border/30 bg-border-light" />
                    <div className="h-20 rounded-lg border border-accent-dark/10 bg-gradient-to-br from-accent-dark/10 to-accent-dark/5" />
                  </div>
                  <div className="grid flex-1 grid-cols-3 gap-3">
                    <div className="col-span-2 h-32 rounded-lg border border-border/30 bg-border-light" />
                    <div className="h-32 rounded-lg border border-border/30 bg-border-light" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
