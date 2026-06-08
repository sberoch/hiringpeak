"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/button";
import { ArrowRightIcon, PlayIcon, XIcon } from "lucide-react";

const DEMO_VIDEO_SRC = "/hiringpeak-demo.mp4";
const DEMO_POSTER_SRC = "/demo-poster.jpg";

export function Hero() {
  const [isOpen, setIsOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close]);

  return (
    <section className="relative flex min-h-screen items-start overflow-hidden pt-20 gradient-mesh-hero">
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
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-col items-center text-center">
          <h1 className="fade-up fade-up-2 font-display mb-8 max-w-4xl text-5xl font-extrabold leading-[1.0] tracking-tight text-ink md:text-6xl lg:text-7xl">
            El único ATS pensado para{" "}
            <span className="bg-gradient-to-r from-accent to-accent-deeper bg-clip-text text-transparent">
              executive search
            </span>
          </h1>
          <p className="fade-up fade-up-3 mb-10 max-w-2xl text-lg leading-relaxed text-slate md:text-xl">
            Pipeline visual, perfiles ejecutivos detallados, integración con
            LinkedIn. Todo lo que necesitás para cerrar más colocaciones C-level.
          </p>
          <div className="fade-up fade-up-4 flex flex-col items-center gap-4 sm:flex-row">
            <Button asChild variant="primary" size="lg" className="group gap-3">
              <Link href="#contacto">
                Solicitar Demo
                <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="gap-2"
              onClick={open}
            >
              <PlayIcon className="size-5 text-accent" />
              Ver en acción
            </Button>
          </div>

          <div className="fade-up fade-up-5 relative mt-20 w-full">
            <Image
              src="/images/rocket-nobg.png"
              alt=""
              width={128}
              height={128}
              className="absolute -right-2 -top-12 z-10 hidden w-20 opacity-90 sm:block lg:-right-10 lg:w-32"
            />
            <Image
              src="/images/ladder-nobg.png"
              alt=""
              width={128}
              height={128}
              className="absolute -bottom-6 -left-4 z-10 hidden w-16 opacity-80 md:block lg:-left-12 lg:w-32"
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
              <button
                type="button"
                onClick={open}
                aria-label="Reproducir video demo"
                className="group relative block aspect-video w-full overflow-hidden bg-ink"
              >
                <Image
                  src={DEMO_POSTER_SRC}
                  alt="Demo de HiringPeak"
                  fill
                  sizes="(min-width: 1024px) 1100px, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <span className="absolute inset-0 bg-ink/20 transition-colors group-hover:bg-ink/10" />
                <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-xl ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-110">
                  <PlayIcon className="size-9 translate-x-0.5 fill-accent text-accent" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Video demo de HiringPeak"
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-3 backdrop-blur-sm sm:p-6"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative w-full"
            style={{ maxWidth: "min(96vw, calc((100vh - 5rem) * 16 / 9))" }}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar video"
              className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:-right-2"
            >
              <XIcon className="size-6" />
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
              <video
                ref={videoRef}
                src={DEMO_VIDEO_SRC}
                poster={DEMO_POSTER_SRC}
                preload="none"
                controls
                autoPlay
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
