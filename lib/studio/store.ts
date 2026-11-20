"use client";
import { create } from "zustand";
import type { StudioTemplate } from "@/lib/types";

export const BOARD_W = 1000;
export const BOARD_H = 700;

export type DecorType = "arch" | "floral" | "candles" | "table" | "sofa" | "drape" | "runner" | "lantern" | "chandelier" | "text" | "image";

export interface StudioItem {
  id: string;
  type: DecorType;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  accent: string;
  text?: string;
  src?: string;
  /** Id of an uploaded reference image (for image items). */
  refId?: string;
  width?: number;
  height?: number;
}

export interface ReferenceImage { id: string; name: string; dataUrl: string }

export type Lighting = "golden" | "candlelit" | "daylight";
export type Arrangement = "ceremony" | "stage" | "banquet";
export const PREVIEW_TOGGLES = ["arch", "florals", "candles", "drape", "seating", "tables", "runner"] as const;
export type PreviewToggle = (typeof PREVIEW_TOGGLES)[number];

interface Snapshot { items: StudioItem[]; background: string; palette: string[] }

interface StudioState extends Snapshot {
  templateSlug: string | null;
  eventType: string;
  style: string;
  selectedId: string | null;
  mode: "board" | "3d";
  lighting: Lighting;
  arrangement: Arrangement;
  toggles: Record<PreviewToggle, boolean>;
  references: ReferenceImage[];
  past: Snapshot[];
  future: Snapshot[];
  applyTemplate: (template: StudioTemplate) => void;
  addItem: (type: DecorType, extra?: Partial<StudioItem>) => void;
  updateItem: (id: string, patch: Partial<StudioItem>, commit?: boolean) => void;
  removeItem: (id: string) => void;
  duplicateItem: (id: string) => void;
  reorder: (id: string, direction: "up" | "down" | "top" | "bottom") => void;
  select: (id: string | null) => void;
  setBackground: (color: string) => void;
  setPaletteColor: (index: number, color: string) => void;
  set: (patch: Partial<Pick<StudioState, "eventType" | "style" | "mode" | "lighting" | "arrangement">>) => void;
  toggle: (key: PreviewToggle) => void;
  addReference: (ref: ReferenceImage) => void;
  removeReference: (id: string) => void;
  undo: () => void;
  redo: () => void;
  checkpoint: () => void;
  hydrate: (data: Partial<StudioState>) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const snap = (s: Snapshot): Snapshot => ({ items: s.items.map((i) => ({ ...i })), background: s.background, palette: [...s.palette] });

export const useStudio = create<StudioState>((set, get) => {
  /** Record the current state onto the undo stack before a change. */
  const record = () => set((s) => ({ past: [...s.past.slice(-49), snap(s)], future: [] }));

  return {
    items: [],
    background: "#efe8dc",
    palette: ["#f4efe6", "#8d9f7f", "#e8c4c0", "#c8a46a"],
    templateSlug: null,
    eventType: "",
    style: "",
    selectedId: null,
    mode: "board",
    lighting: "golden",
    arrangement: "ceremony",
    toggles: { arch: true, florals: true, candles: true, drape: true, seating: true, tables: false, runner: true },
    references: [],
    past: [],
    future: [],

    applyTemplate: (t) => {
      record();
      const palette = t.palette.map((p) => p.hex);
      const items: StudioItem[] = t.layout.map((l, i) => ({
        id: uid(), type: l.type as DecorType, x: l.x * BOARD_W, y: l.y * BOARD_H, scale: l.scale ?? 1, rotation: l.rotation ?? 0,
        color: palette[i % palette.length], accent: palette[(i + 1) % palette.length],
      }));
      set({
        templateSlug: t.slug, items, palette, background: t.background, selectedId: null,
        eventType: get().eventType || t.eventTypes[0] || "", style: t.mood, lighting: t.lighting, arrangement: t.arrangement,
        toggles: { arch: t.arrangement === "ceremony" || t.layout.some((l) => l.type === "arch"), florals: true, candles: true, drape: t.arrangement !== "ceremony", seating: t.arrangement !== "banquet", tables: t.arrangement === "banquet", runner: t.arrangement === "ceremony" },
      });
    },
    addItem: (type, extra) => {
      record();
      const { palette, items } = get();
      const item: StudioItem = { id: uid(), type, x: BOARD_W / 2 + (Math.random() - 0.5) * 160, y: BOARD_H / 2 + (Math.random() - 0.5) * 120, scale: 1, rotation: 0, color: palette[items.length % palette.length], accent: palette[(items.length + 1) % palette.length], ...(type === "text" ? { text: "Our celebration" } : {}), ...extra };
      set({ items: [...items, item], selectedId: item.id });
    },
    updateItem: (id, patch, commit = true) => {
      if (commit) record();
      set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
    },
    removeItem: (id) => { record(); set((s) => ({ items: s.items.filter((i) => i.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); },
    duplicateItem: (id) => {
      const source = get().items.find((i) => i.id === id);
      if (!source) return;
      record();
      const copy = { ...source, id: uid(), x: source.x + 30, y: source.y + 30 };
      set((s) => ({ items: [...s.items, copy], selectedId: copy.id }));
    },
    reorder: (id, direction) => {
      record();
      set((s) => {
        const items = [...s.items];
        const i = items.findIndex((x) => x.id === id);
        if (i < 0) return {};
        const [item] = items.splice(i, 1);
        const to = direction === "top" ? items.length : direction === "bottom" ? 0 : direction === "up" ? Math.min(items.length, i + 1) : Math.max(0, i - 1);
        items.splice(to, 0, item);
        return { items };
      });
    },
    select: (id) => set({ selectedId: id }),
    setBackground: (color) => { record(); set({ background: color }); },
    setPaletteColor: (index, color) => {
      record();
      set((s) => {
        const old = s.palette[index];
        const palette = s.palette.map((c, i) => (i === index ? color : c));
        // Items using the old colour follow the palette change.
        const items = s.items.map((it) => ({ ...it, color: it.color === old ? color : it.color, accent: it.accent === old ? color : it.accent }));
        return { palette, items };
      });
    },
    set: (patch) => set(patch),
    toggle: (key) => set((s) => ({ toggles: { ...s.toggles, [key]: !s.toggles[key] } })),
    addReference: (ref) => set((s) => ({ references: [...s.references, ref].slice(0, 6) })),
    removeReference: (id) => set((s) => ({ references: s.references.filter((r) => r.id !== id), items: s.items.filter((i) => i.refId !== id) })),
    undo: () => {
      const { past } = get();
      if (!past.length) return;
      const prev = past[past.length - 1];
      set((s) => ({ ...prev, past: s.past.slice(0, -1), future: [snap(s), ...s.future].slice(0, 50), selectedId: null }));
    },
    redo: () => {
      const { future } = get();
      if (!future.length) return;
      const next = future[0];
      set((s) => ({ ...next, future: s.future.slice(1), past: [...s.past, snap(s)], selectedId: null }));
    },
    checkpoint: record,
    hydrate: (data) => set(data),
  };
});

/** Serialisable configuration persisted with a submission and to the local draft. */
export function serializeStudio() {
  const s = useStudio.getState();
  return {
    version: 1,
    board: { width: BOARD_W, height: BOARD_H, background: s.background, items: s.items.map(({ src, ...rest }) => ({ ...rest, src: src?.startsWith("data:") ? `ref:${rest.refId ?? "upload"}` : src })) },
    palette: s.palette,
    templateSlug: s.templateSlug,
    eventType: s.eventType,
    style: s.style,
    preview3d: { lighting: s.lighting, arrangement: s.arrangement, toggles: s.toggles },
  };
}
