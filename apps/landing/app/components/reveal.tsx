"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@workspace/ui/lib/utils";

export function Reveal({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { rootMargin: "-80px 0px 0px 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "reveal transition-all duration-[0.8s] ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible && "visible opacity-100 translate-y-0",
        !visible && "opacity-0 translate-y-10",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
