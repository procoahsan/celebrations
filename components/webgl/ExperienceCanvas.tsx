"use client";
import { Component, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import dynamic from "next/dynamic";
import type { CanvasProps } from "@react-three/fiber";
import { dprFor } from "@/lib/device";
import { useExperience } from "@/lib/store";

const CanvasInner = dynamic(() => import("./CanvasInner"), { ssr: false });

class WebGLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.warn("[webgl] falling back:", error); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

interface Props extends Omit<CanvasProps, "children" | "fallback"> {
  children: ReactNode;
  /** DOM rendering used when WebGL is unavailable or crashes. */
  fallback: ReactNode;
  /** Element that receives pointer events (so DOM overlays above the canvas still drive the scene). */
  eventSourceRef?: RefObject<HTMLElement | null>;
  className?: string;
  /** Keep rendering even when off-screen (rarely needed). */
  alwaysRender?: boolean;
}

/**
 * Shared canvas shell: adaptive DPR by device tier with a runtime PerformanceMonitor step-down,
 * render loop paused while off-screen, an error boundary to a DOM fallback, and context-loss handling.
 */
export default function ExperienceCanvas({ children, fallback, eventSourceRef, className, alwaysRender = false, ...props }: Props) {
  const webgl = useExperience((s) => s.webgl);
  const tier = useExperience((s) => s.tier);
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [dpr, setDpr] = useState<[number, number]>(dprFor(tier));
  const [lost, setLost] = useState(false);

  useEffect(() => setDpr(dprFor(tier)), [tier]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "20% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (webgl === false || lost) return <div className={className}>{fallback}</div>;

  return (
    <div ref={host} className={className}>
      {webgl && (
        <WebGLBoundary fallback={fallback}>
          <CanvasInner
            dpr={dpr}
            frameloop={visible || alwaysRender ? "always" : "never"}
            gl={{ antialias: tier === "high", alpha: true, powerPreference: "high-performance", stencil: false }}
            eventSource={eventSourceRef?.current ?? undefined}
            eventPrefix={eventSourceRef ? "client" : undefined}
            onLost={() => setLost(true)}
            onDecline={() => setDpr(([min, max]) => [Math.max(0.75, min * 0.85), Math.max(1, max * 0.8)])}
            {...props}
          >
            {children}
          </CanvasInner>
        </WebGLBoundary>
      )}
    </div>
  );
}
