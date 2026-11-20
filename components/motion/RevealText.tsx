"use client";
import { createElement, useRef, type ReactNode } from "react";
import { useTextReveal, type TextRevealOptions } from "@/hooks/useTextReveal";

type Tag = "h1" | "h2" | "h3" | "p" | "span" | "div" | "blockquote";

/** Server-component-friendly wrapper around the masked SplitText reveal. */
export default function RevealText({ as = "div", className, children, id, ...options }: TextRevealOptions & { as?: Tag; className?: string; id?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useTextReveal(ref, options);
  return createElement(as, { ref, className, id, "data-reveal": "" }, children);
}
