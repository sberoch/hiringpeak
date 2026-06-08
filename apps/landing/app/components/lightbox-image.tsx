"use client";

import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ZoomIn } from "lucide-react";

type LightboxImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Classes applied to the inline (non-zoomed) image. */
  className?: string;
};

export function LightboxImage({
  src,
  alt,
  width,
  height,
  className,
}: LightboxImageProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={`Ampliar imagen: ${alt}`}
          className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={className}
          />
          <span className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
            <ZoomIn className="h-4 w-4" />
          </span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="lightbox-overlay fixed inset-0 z-[100] bg-ink/85 backdrop-blur-sm" />
        <Dialog.Content className="lightbox-content fixed inset-0 z-[100] flex items-center justify-center p-4 focus:outline-none">
          <Dialog.Title className="sr-only">{alt}</Dialog.Title>
          <Dialog.Close
            aria-label="Cerrar"
            className="absolute inset-0 cursor-zoom-out focus:outline-none"
          />
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="relative h-auto w-auto max-h-[90vh] max-w-[95vw] rounded-xl shadow-2xl"
          />
          <Dialog.Close
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X className="h-5 w-5" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
