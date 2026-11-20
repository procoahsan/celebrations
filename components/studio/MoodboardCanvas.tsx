"use client";
import { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type Konva from "konva";
import { Circle, Ellipse, Group, Image as KImage, Layer, Line, Rect, Stage, Text, Transformer, Path } from "react-konva";
import { BOARD_H, BOARD_W, useStudio, type StudioItem } from "@/lib/studio/store";

export interface MoodboardHandle { exportImage: (pixelRatio?: number) => string | null }

function useHtmlImage(src?: string) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) return;
    const el = new window.Image();
    el.crossOrigin = "anonymous";
    el.onload = () => setImg(el);
    el.src = src;
  }, [src]);
  return img;
}

/** Vector decor drawn in Konva, coloured from the live palette. Each is centred on (0,0). */
function DecorShape({ item }: { item: StudioItem }) {
  const { color, accent } = item;
  const image = useHtmlImage(item.type === "image" ? item.src : undefined);
  const blooms = (n: number, r: number, spread: number, seed = 1) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i * 137.5 + seed * 31) * (Math.PI / 180);
      const d = Math.sqrt((i + 0.5) / n) * spread;
      return <Circle key={i} x={Math.cos(a) * d} y={Math.sin(a) * d * 0.75} radius={r * (0.7 + ((i * 7) % 5) / 10)} fill={i % 3 === 0 ? accent : color} stroke="rgba(0,0,0,0.12)" strokeWidth={1} />;
    });

  switch (item.type) {
    case "arch": {
      const pts = Array.from({ length: 34 }, (_, i) => { const a = Math.PI + (i / 33) * Math.PI; return [Math.cos(a) * 150, Math.sin(a) * 150 + 20]; });
      return (
        <Group>
          <Path data="M -150 170 L -150 20 A 150 150 0 0 1 150 20 L 150 170" stroke="#8a7a5a" strokeWidth={6} />
          {pts.map(([x, y], i) => <Group key={i} x={x} y={y}>{blooms(4, 11, 14, i)}</Group>)}
          {[-150, 150].map((x) => <Group key={x} x={x} y={120}>{blooms(6, 12, 22, x)}</Group>)}
        </Group>
      );
    }
    case "floral":
      return (
        <Group>
          <Ellipse x={-38} y={18} radiusX={34} radiusY={12} rotation={-20} fill="#7d8b6f" />
          <Ellipse x={40} y={14} radiusX={34} radiusY={12} rotation={18} fill="#6c7b5f" />
          {blooms(14, 15, 46)}
        </Group>
      );
    case "candles":
      return (
        <Group>
          {[-30, 0, 30].map((x, i) => {
            const h = [90, 130, 70][i];
            return (
              <Group key={x} x={x}>
                <Rect x={-2} y={-h} width={4} height={h + 40} fill="#c8a46a" />
                <Rect x={-9} y={-h - 26} width={18} height={26} fill="#f6efe2" cornerRadius={2} />
                <Ellipse y={-h - 36} radiusX={5} radiusY={10} fill="#ffcf7a" shadowColor="#ffb347" shadowBlur={18} shadowOpacity={0.9} />
              </Group>
            );
          })}
          <Rect x={-44} y={40} width={88} height={6} fill="#c8a46a" />
        </Group>
      );
    case "table":
      return (
        <Group>
          {Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return <Rect key={i} x={Math.cos(a) * 82 - 12} y={Math.sin(a) * 82 - 12} width={24} height={24} cornerRadius={6} fill={accent} rotation={(a * 180) / Math.PI} />; })}
          <Circle radius={60} fill="#f7f1e6" stroke={color} strokeWidth={6} />
          <Group scale={{ x: 0.6, y: 0.6 }}>{blooms(8, 12, 24)}</Group>
        </Group>
      );
    case "sofa":
      return (
        <Group>
          <Rect x={-130} y={-60} width={260} height={90} cornerRadius={[40, 40, 8, 8]} fill={color} stroke="rgba(0,0,0,0.15)" />
          <Rect x={-150} y={0} width={300} height={50} cornerRadius={14} fill={color} stroke="rgba(0,0,0,0.15)" />
          {[-60, 0, 60].map((x) => <Rect key={x} x={x - 20} y={-30} width={40} height={36} cornerRadius={8} fill={accent} rotation={x / 10} />)}
          {[-130, 130].map((x) => <Rect key={x} x={x - 4} y={50} width={8} height={22} fill="#c8a46a" />)}
        </Group>
      );
    case "drape":
      return (
        <Group>
          <Rect x={-260} y={-120} width={520} height={260} fill={color} opacity={0.9} />
          {Array.from({ length: 9 }, (_, i) => <Line key={i} points={[-240 + i * 60, -120, -250 + i * 60, 140]} stroke="rgba(0,0,0,0.12)" strokeWidth={10} tension={0.4} />)}
          <Path data="M -260 -120 Q -130 -20 0 -120 Q 130 -20 260 -120" stroke={accent} strokeWidth={22} lineCap="round" />
          <Path data="M -260 -110 Q -195 -60 -130 -110 M 130 -110 Q 195 -60 260 -110" stroke={accent} strokeWidth={12} lineCap="round" opacity={0.8} />
        </Group>
      );
    case "runner":
      return (
        <Group>
          <Line points={[-60, -120, 60, -120, 150, 120, -150, 120]} closed fill="#fbf8f3" stroke="rgba(0,0,0,0.08)" />
          {Array.from({ length: 26 }, (_, i) => <Ellipse key={i} x={((i * 53) % 260) - 130 + (i % 2) * 8} y={((i * 37) % 230) - 110} radiusX={5} radiusY={3} rotation={i * 40} fill={i % 2 ? color : accent} />)}
        </Group>
      );
    case "lantern":
      return (
        <Group>
          <Rect x={-26} y={-60} width={52} height={90} cornerRadius={4} stroke="#c8a46a" strokeWidth={4} fill="rgba(255,214,140,0.25)" />
          <Path data="M -30 -60 L 0 -86 L 30 -60 Z" fill="#c8a46a" />
          <Ellipse y={-10} radiusX={8} radiusY={14} fill="#ffcf7a" shadowColor="#ffb347" shadowBlur={20} shadowOpacity={0.9} />
          <Group y={46} scale={{ x: 0.5, y: 0.5 }}>{blooms(8, 12, 30)}</Group>
        </Group>
      );
    case "chandelier":
      return (
        <Group>
          <Line points={[0, -140, 0, -60]} stroke="#c8a46a" strokeWidth={3} />
          <Ellipse y={-50} radiusX={90} radiusY={18} stroke="#c8a46a" strokeWidth={3} />
          {Array.from({ length: 16 }, (_, i) => <Line key={i} points={[-84 + i * 11.2, -46, -84 + i * 11.2, -46 + 30 + ((i * 13) % 40)]} stroke="rgba(255,255,255,0.8)" strokeWidth={1.5} dash={[2, 4]} />)}
        </Group>
      );
    case "text":
      return <Text text={item.text ?? ""} fontFamily="Bodoni Moda, Didot, Georgia, serif" fontStyle="italic" fontSize={46} fill={color} align="center" width={520} offsetX={260} offsetY={23} />;
    case "image":
      return image ? <KImage image={image} width={item.width ?? 260} height={((item.width ?? 260) * image.height) / image.width} offsetX={(item.width ?? 260) / 2} offsetY={((item.width ?? 260) * image.height) / image.width / 2} stroke="#fff" strokeWidth={8} shadowBlur={20} shadowOpacity={0.25} /> : null;
  }
}

/**
 * Mode A: the moodboard. React Konva with draggable, resizable, rotatable decor nodes, a Transformer
 * for the selection, palette-coloured vector elements, uploaded references, and image export.
 */
export default function MoodboardCanvas({ visible, handleRef }: { visible: boolean; handleRef: React.RefObject<MoodboardHandle | null> }) {
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<Konva.Stage>(null);
  const transformer = useRef<Konva.Transformer>(null);
  const nodes = useRef(new Map<string, Konva.Group>());
  const [width, setWidth] = useState(800);
  const { items, background, selectedId, select, updateItem, palette } = useStudio();
  const scale = width / BOARD_W;

  useImperativeHandle(handleRef, () => ({
    exportImage: (pixelRatio = 2) => {
      const s = stage.current;
      if (!s) return null;
      transformer.current?.nodes([]);
      const url = s.toDataURL({ pixelRatio: pixelRatio / scale, mimeType: "image/jpeg", quality: 0.88 });
      const node = selectedId ? nodes.current.get(selectedId) : null;
      if (node) transformer.current?.nodes([node]);
      return url;
    },
  }));

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const node = selectedId ? nodes.current.get(selectedId) : null;
    transformer.current?.nodes(node ? [node] : []);
    transformer.current?.getLayer()?.batchDraw();
  }, [selectedId, items]);

  // Keyboard: delete, nudge, undo/redo.
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      const st = useStudio.getState();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) st.redo(); else st.undo(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") { e.preventDefault(); st.redo(); return; }
      if (!st.selectedId) return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); st.removeItem(st.selectedId); }
      const step = e.shiftKey ? 20 : 4;
      const item = st.items.find((i) => i.id === st.selectedId);
      if (!item) return;
      const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[e.key]) { e.preventDefault(); st.updateItem(item.id, { x: item.x + moves[e.key][0], y: item.y + moves[e.key][1] }); }
      if (e.key === "Escape") st.select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  const floorGradient = useMemo(() => ({ start: { x: 0, y: BOARD_H * 0.55 }, end: { x: 0, y: BOARD_H }, stops: [0, "rgba(0,0,0,0)", 1, "rgba(0,0,0,0.12)"] }), []);

  return (
    <div ref={host} className="relative w-full" style={{ visibility: visible ? "visible" : "hidden", position: visible ? "relative" : "absolute", inset: 0 }}>
      <Stage
        ref={stage}
        width={width}
        height={width * (BOARD_H / BOARD_W)}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={(e) => { if (e.target === e.target.getStage() || e.target.name() === "bg") select(null); }}
        onTouchStart={(e) => { if (e.target === e.target.getStage() || e.target.name() === "bg") select(null); }}
        role="img"
        aria-label={`Moodboard with ${items.length} elements`}
      >
        <Layer>
          <Rect name="bg" width={BOARD_W} height={BOARD_H} fill={background} />
          <Rect name="bg" y={BOARD_H * 0.55} width={BOARD_W} height={BOARD_H * 0.45} fillLinearGradientStartPoint={floorGradient.start} fillLinearGradientEndPoint={floorGradient.end} fillLinearGradientColorStops={floorGradient.stops} listening={false} />
          <Line points={[0, BOARD_H * 0.55, BOARD_W, BOARD_H * 0.55]} stroke="rgba(0,0,0,0.08)" listening={false} />
          {palette.map((c, i) => <Rect key={i} x={24 + i * 22} y={BOARD_H - 36} width={16} height={16} cornerRadius={8} fill={c} stroke="rgba(0,0,0,0.15)" listening={false} />)}
          <Text x={BOARD_W - 330} y={BOARD_H - 32} width={306} align="right" text="THE CELEBRATIONS · CONCEPT BOARD · NOT TO SCALE" fontFamily="DM Mono, monospace" fontSize={10} letterSpacing={2} fill="rgba(0,0,0,0.45)" listening={false} />
        </Layer>
        <Layer>
          {items.map((item) => (
            <Group
              key={item.id}
              ref={(node) => { if (node) nodes.current.set(item.id, node); else nodes.current.delete(item.id); }}
              x={item.x}
              y={item.y}
              scaleX={item.scale}
              scaleY={item.scale}
              rotation={item.rotation}
              draggable
              onMouseDown={() => select(item.id)}
              onTap={() => select(item.id)}
              onDragStart={() => select(item.id)}
              onDragEnd={(e) => updateItem(item.id, { x: e.target.x(), y: e.target.y() })}
              onTransformEnd={(e) => { const n = e.target; updateItem(item.id, { x: n.x(), y: n.y(), scale: n.scaleX(), rotation: n.rotation() }); }}
              onMouseEnter={(e) => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = "grab"; }}
              onMouseLeave={(e) => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = "default"; }}
            >
              <DecorShape item={item} />
            </Group>
          ))}
          <Transformer
            ref={transformer}
            keepRatio
            enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
            anchorSize={10}
            anchorCornerRadius={5}
            anchorStroke="#9b1c2e"
            borderStroke="#9b1c2e"
            borderDash={[4, 4]}
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 30 || newBox.height < 30 ? oldBox : newBox)}
          />
        </Layer>
      </Stage>
    </div>
  );
}
