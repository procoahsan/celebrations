"use client";
import { Suspense, type ReactNode } from "react";
import { Canvas, type CanvasProps } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";

export interface CanvasInnerProps extends Omit<CanvasProps, "children"> { children: ReactNode; onDecline: () => void; onLost: () => void }

/** The actual R3F canvas, split into its own chunk so three.js loads after first paint. */
export default function CanvasInner({ children, onDecline, onLost, ...props }: CanvasInnerProps) {
  return (
    <Canvas
      {...props}
      onCreated={(state) => {
        state.gl.domElement.addEventListener("webglcontextlost", (event) => { event.preventDefault(); onLost(); }, { once: true });
        props.onCreated?.(state);
      }}
    >
      <PerformanceMonitor onDecline={onDecline} flipflops={3} />
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
