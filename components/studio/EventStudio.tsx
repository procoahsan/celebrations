"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { RootState } from "@react-three/fiber";
import { gsap, SplitText, useGSAP } from "@/lib/motion/gsap";
import { useExperience } from "@/lib/store";
import { PREVIEW_TOGGLES, serializeStudio, useStudio, type DecorType, type Lighting, type Arrangement } from "@/lib/studio/store";
import type { StudioTemplate } from "@/lib/types";
import ExperienceCanvas from "@/components/webgl/ExperienceCanvas";
import type { MoodboardHandle } from "./MoodboardCanvas";
import SubmitDrawer from "./SubmitDrawer";
import styles from "./studio.module.css";

const MoodboardCanvas = dynamic(() => import("./MoodboardCanvas"), { ssr: false, loading: () => <div className={styles.loading}>Preparing the board…</div> });
const ConceptPreview3D = dynamic(() => import("./ConceptPreview3D"), { ssr: false, loading: () => <div className={styles.loading}>Building the 3D preview…</div> });
const MorphPlane = dynamic(() => import("@/components/webgl/scenes/MorphPlane"), { ssr: false });

const EVENT_TYPES = ["Nikkah", "Mehndi", "Wedding", "Walima / Reception", "Engagement", "Birthday", "Corporate", "Private celebration"];
const STYLES = ["Romantic & floral", "Regal & opulent", "Modern & minimal", "Festive & colourful", "Rustic & natural"];
const LIBRARY: { type: DecorType; label: string }[] = [
  { type: "arch", label: "Floral arch" }, { type: "floral", label: "Floral cluster" }, { type: "candles", label: "Candle stand" },
  { type: "drape", label: "Backdrop drape" }, { type: "sofa", label: "Stage sofa" }, { type: "table", label: "Round table" },
  { type: "runner", label: "Aisle runner" }, { type: "lantern", label: "Lantern" }, { type: "chandelier", label: "Crystal hanging" }, { type: "text", label: "Text" },
];
const BACKGROUNDS = ["#efe8dc", "#f7f3ec", "#2a1013", "#1b2420", "#2b1606", "#e9dcc9", "#d9d4e6"];
const DRAFT_KEY = "c06-studio-draft";

export default function EventStudio({ templates, initialTheme, title, statement }: { templates: StudioTemplate[]; initialTheme?: string; title: string; statement: string }) {
  const root = useRef<HTMLDivElement>(null);
  const board = useRef<MoodboardHandle | null>(null);
  const three = useRef<RootState | null>(null);
  const [phase, setPhase] = useState<"intro" | "workspace">("intro");
  const [themeIndex, setThemeIndex] = useState(() => Math.max(0, templates.findIndex((t) => t.slug === initialTheme)));
  const [drawer, setDrawer] = useState(false);
  const [panel, setPanel] = useState<"concept" | "elements" | "inspect">("concept");
  const reduced = useExperience((s) => s.reducedMotion);
  const studio = useStudio();
  const selected = studio.items.find((i) => i.id === studio.selectedId) ?? null;
  const theme = templates[themeIndex];

  // Restore a local draft (a per-device convenience; submissions are what persist).
  useEffect(() => {
    const explicit = initialTheme && templates.some((t) => t.slug === initialTheme);
    try {
      const raw = explicit ? null : localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft?.items?.length) { studio.hydrate(draft); return; }
      }
    } catch { /* storage unavailable */ }
    if (theme) studio.applyTemplate(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const { items, background, palette, templateSlug, eventType, style, lighting, arrangement, toggles, references } = useStudio.getState();
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ items, background, palette, templateSlug, eventType, style, lighting, arrangement, toggles, references }));
      } catch { /* quota or private mode */ }
    }, 600);
    return () => window.clearTimeout(id);
  }, [studio.items, studio.background, studio.palette, studio.eventType, studio.style, studio.lighting, studio.arrangement, studio.toggles, studio.references]);

  // Intro choreography.
  useGSAP(() => {
    if (reduced) return;
    const q = gsap.utils.selector(root);
    const split = SplitText.create(q("[data-intro-title]"), { type: "words,chars", mask: "chars", aria: "auto" });
    gsap.timeline({ delay: 0.3 })
      .from(split.chars, { yPercent: 110, duration: 1.4, stagger: 0.03, ease: "expo.out" })
      .from(q("[data-intro-frame]"), { clipPath: "inset(100% 0 0 0 round 999px 999px 0 0)", duration: 1.8, ease: "expo.inOut" }, 0.1)
      .from(q("[data-intro-fade]"), { autoAlpha: 0, y: 16, stagger: 0.08, duration: 1 }, 0.7);
    return () => split.revert();
  }, { scope: root, dependencies: [reduced] });

  const chooseTheme = (i: number) => {
    setThemeIndex(i);
    studio.applyTemplate(templates[i]);
  };

  const enterWorkspace = () => {
    const q = gsap.utils.selector(root);
    const done = () => { setPhase("workspace"); window.scrollTo(0, 0); requestAnimationFrame(() => document.getElementById("workspace-title")?.focus()); };
    if (reduced) return done();
    gsap.timeline({ onComplete: done })
      .to(q("[data-intro-fade], [data-intro-title]"), { autoAlpha: 0, y: -30, duration: 0.6, stagger: 0.03, ease: "power3.in" })
      .to(q("[data-intro-frame]"), { clipPath: "inset(0% 0% 100% 0% round 0 0 0 0)", duration: 0.9, ease: "curtain" }, 0.2);
  };

  useGSAP(() => {
    if (phase !== "workspace" || reduced) return;
    const q = gsap.utils.selector(root);
    gsap.timeline()
      .from(q("[data-ws-stage]"), { clipPath: "inset(10% 10% 10% 10% round 24px)", autoAlpha: 0, duration: 1.2, ease: "expo.out" })
      .from(q("[data-ws-panel]"), { autoAlpha: 0, x: (i) => (i ? 30 : -30), duration: 1, stagger: 0.1 }, 0.2)
      .from(q("[data-ws-bar] > *"), { autoAlpha: 0, y: -10, duration: 0.6, stagger: 0.05 }, 0.3);
  }, { scope: root, dependencies: [phase] });

  useEffect(() => { if (studio.mode !== "3d") three.current = null; }, [studio.mode]);

  const capture = () => {
    const previewImage = board.current?.exportImage(2) ?? null;
    let preview3dImage: string | undefined;
    const state = three.current;
    if (state) {
      state.gl.render(state.scene, state.camera);
      preview3dImage = state.gl.domElement.toDataURL("image/jpeg", 0.85);
    }
    return { previewImage, preview3dImage };
  };

  const exportPng = () => {
    const url = board.current?.exportImage(2);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `celebrations06-concept-${Date.now()}.jpg`;
    a.click();
  };

  const onUpload = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).slice(0, 6 - studio.references.length).forEach((file) => {
      if (!file.type.startsWith("image/") || file.size > 8_000_000) return;
      const reader = new FileReader();
      reader.onload = () => {
        // Downscale to keep submissions light.
        const img = new Image();
        img.onload = () => {
          const max = 1200;
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
          const dataUrl = c.toDataURL("image/jpeg", 0.82);
          const id = Math.random().toString(36).slice(2, 9);
          studio.addReference({ id, name: file.name, dataUrl });
          studio.addItem("image", { src: dataUrl, refId: id, width: 240 });
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  };

  if (phase === "intro") {
    return (
      <div key="intro" ref={root} className={styles.intro}>
        <div className={styles.introCopy}>
          <p className="label" data-intro-fade><span className="text-gilt">(Studio)</span>&nbsp; Interactive event design</p>
          <h1 className={`display ${styles.introTitle}`} data-intro-title data-reveal-skip>{title}</h1>
          <p className={styles.introText} data-intro-fade>{statement}</p>
          <div className={styles.themeRow} data-intro-fade role="radiogroup" aria-label="Choose a starting theme">
            {templates.map((t, i) => (
              <button key={t.slug} type="button" role="radio" aria-checked={i === themeIndex} onClick={() => chooseTheme(i)} className={i === themeIndex ? styles.themeOn : undefined}>
                <span className={styles.themeDots} aria-hidden>{t.palette.map((p) => <i key={p.hex} style={{ background: p.hex }} />)}</span>
                <span className="display">{t.name}</span>
                <span className="label opacity-60">{t.mood}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4" data-intro-fade>
            <button type="button" onClick={enterWorkspace} className="btn-portal solid"><span className="dot" />Enter the workspace</button>
            <span className="label text-mist">Your progress is saved on this device</span>
          </div>
        </div>
        <div className={styles.introFrame} data-intro-frame>
          <ExperienceCanvas className="absolute inset-0" camera={{ position: [0, 0, 5], fov: 35 }} fallback={/* eslint-disable-next-line @next/next/no-img-element */ <img src={theme?.image} alt="" className="h-full w-full object-cover" />}>
            <MorphPlane images={templates.map((t) => t.image)} index={themeIndex} accent={theme?.palette[0]?.hex} />
          </ExperienceCanvas>
          <p className={`label ${styles.introCaption}`}>Inspiration: {theme?.name} · The Celebrations portfolio</p>
        </div>
      </div>
    );
  }

  return (
    <div key="workspace" ref={root} className={styles.workspace}>
      <div className={styles.bar} data-ws-bar>
        <h1 id="workspace-title" tabIndex={-1} className="display text-2xl outline-none md:text-3xl">Event Studio</h1>
        <div className={styles.modes} role="tablist" aria-label="View mode">
          <button role="tab" aria-selected={studio.mode === "board"} onClick={() => studio.set({ mode: "board" })}>Moodboard · 2D</button>
          <button role="tab" aria-selected={studio.mode === "3d"} onClick={() => studio.set({ mode: "3d" })}>Concept · 3D</button>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={studio.undo} disabled={!studio.past.length} aria-label="Undo" title="Undo (Ctrl+Z)">↶</button>
          <button type="button" onClick={studio.redo} disabled={!studio.future.length} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">↷</button>
          <button type="button" onClick={exportPng} className={styles.textBtn}>Export image</button>
          <button type="button" onClick={() => setDrawer(true)} className="btn-portal ink !py-3"><span className="dot" />Send to our designers</button>
        </div>
      </div>

      <div className={styles.grid}>
        <aside className={styles.left} data-ws-panel aria-label="Concept and elements">
          <div className={styles.tabs} role="tablist">
            <button role="tab" aria-selected={panel === "concept"} onClick={() => setPanel("concept")}>Concept</button>
            <button role="tab" aria-selected={panel === "elements"} onClick={() => setPanel("elements")}>Elements</button>
            <button role="tab" aria-selected={panel === "inspect"} onClick={() => setPanel("inspect")} className="lg:hidden">Selected</button>
          </div>

          {panel === "concept" && (
            <div className={styles.panelBody}>
              <label className="field"><span>Event type</span>
                <select value={studio.eventType} onChange={(e) => studio.set({ eventType: e.target.value })}>
                  <option value="">Choose…</option>
                  {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label className="field"><span>Design style</span>
                <select value={studio.style} onChange={(e) => studio.set({ style: e.target.value })}>
                  <option value="">Choose…</option>
                  {[...new Set([studio.style, ...STYLES].filter(Boolean))].map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <div>
                <p className={styles.groupLabel}>Template</p>
                <div className={styles.templateList}>
                  {templates.map((t, i) => (
                    <button key={t.slug} type="button" onClick={() => chooseTheme(i)} aria-pressed={studio.templateSlug === t.slug}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.image.replace(".jpg", "-sm.jpg")} alt="" />
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className={styles.groupLabel}>Palette <span className="opacity-50">· click to change</span></p>
                <div className="flex gap-2">
                  {studio.palette.map((c, i) => (
                    <label key={i} className={styles.colorInput} style={{ background: c }}>
                      <span className="sr-only">Palette colour {i + 1}</span>
                      <input type="color" value={c} onChange={(e) => studio.setPaletteColor(i, e.target.value)} />
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className={styles.groupLabel}>Background</p>
                <div className="flex flex-wrap gap-2">
                  {BACKGROUNDS.map((c) => <button key={c} type="button" aria-label={`Background ${c}`} aria-pressed={studio.background === c} onClick={() => studio.setBackground(c)} className={styles.bgSwatch} style={{ background: c }} />)}
                </div>
              </div>
              <div>
                <p className={styles.groupLabel}>Reference images <span className="opacity-50">· up to 6</span></p>
                <label className={styles.upload}>
                  <input type="file" accept="image/*" multiple onChange={(e) => { onUpload(e.target.files); e.target.value = ""; }} />
                  <span>Upload inspiration</span>
                </label>
                {studio.references.length > 0 && (
                  <ul className={styles.refs}>
                    {studio.references.map((r) => (
                      <li key={r.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.dataUrl} alt={r.name} />
                        <button type="button" onClick={() => studio.removeReference(r.id)} aria-label={`Remove ${r.name}`}>×</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {panel === "elements" && (
            <div className={styles.panelBody}>
              <p className={styles.groupLabel}>Add to the board</p>
              <div className={styles.library}>
                {LIBRARY.map((l) => (
                  <button key={l.type} type="button" onClick={() => { studio.addItem(l.type); studio.set({ mode: "board" }); }}>
                    <span aria-hidden className={styles.libIcon} data-type={l.type} />
                    {l.label}
                  </button>
                ))}
              </div>
              <p className={styles.groupLabel}>Layers <span className="opacity-50">· top first</span></p>
              <ol className={styles.layers}>
                {[...studio.items].reverse().map((it) => (
                  <li key={it.id}>
                    <button type="button" onClick={() => studio.select(it.id)} aria-pressed={it.id === studio.selectedId}>
                      <i style={{ background: it.color }} /> {LIBRARY.find((l) => l.type === it.type)?.label ?? "Reference image"}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {panel === "inspect" && <div className={`${styles.panelBody} lg:hidden`}>{Inspector()}</div>}
        </aside>

        <section className={styles.stage} data-ws-stage aria-label={studio.mode === "board" ? "Moodboard canvas" : "3D concept preview"}>
          <div className={styles.stageInner} style={{ aspectRatio: studio.mode === "board" ? "10 / 7" : undefined }}>
            <MoodboardCanvas visible={studio.mode === "board"} handleRef={board} />
            {studio.mode === "3d" && (
              <div className={styles.three}>
                <ConceptPreview3D onReady={(s) => { three.current = s; }} />
                <p className={`label ${styles.disclaimer}`}>Stylized concept preview · not to scale · décor availability confirmed in consultation</p>
              </div>
            )}
          </div>
          <p className={styles.hint}>{studio.mode === "board" ? "Drag to place · corners to resize and rotate · Delete removes · arrows nudge" : "Drag to orbit · scroll or pinch to zoom"}</p>
        </section>

        <aside className={styles.right} data-ws-panel aria-label={studio.mode === "board" ? "Selected element" : "3D preview options"}>
          {studio.mode === "board" ? <div className="hidden lg:block">{Inspector()}</div> : PreviewOptions()}
        </aside>
      </div>

      {drawer && <SubmitDrawer onClose={() => setDrawer(false)} capture={capture} configuration={serializeStudio} references={studio.references} />}
    </div>
  );

  function Inspector() {
    if (!selected) return <p className="text-sm opacity-60">Select an element on the board to adjust its colour, size, rotation and layer.</p>;
    return (
      <div className="grid gap-5">
        <p className={styles.groupLabel}>{LIBRARY.find((l) => l.type === selected.type)?.label ?? "Reference image"}</p>
        {selected.type === "text" && (
          <label className="field"><span>Text</span><input value={selected.text ?? ""} onChange={(e) => studio.updateItem(selected.id, { text: e.target.value }, false)} onBlur={() => studio.checkpoint()} maxLength={60} /></label>
        )}
        {selected.type !== "image" && (
          <div>
            <p className={styles.groupLabel}>Colour</p>
            <div className="flex gap-2">
              {studio.palette.map((c) => <button key={c} type="button" aria-label={`Use ${c}`} aria-pressed={selected.color === c} onClick={() => studio.updateItem(selected.id, { color: c })} className={styles.bgSwatch} style={{ background: c }} />)}
            </div>
          </div>
        )}
        <label className="field"><span>Size · {Math.round(selected.scale * 100)}%</span>
          <input type="range" min={0.3} max={2.5} step={0.05} value={selected.scale} onChange={(e) => studio.updateItem(selected.id, { scale: Number(e.target.value) }, false)} onPointerUp={() => studio.checkpoint()} />
        </label>
        <label className="field"><span>Rotation · {Math.round(selected.rotation)}°</span>
          <input type="range" min={-180} max={180} step={1} value={selected.rotation} onChange={(e) => studio.updateItem(selected.id, { rotation: Number(e.target.value) }, false)} onPointerUp={() => studio.checkpoint()} />
        </label>
        <div className={styles.inspectorBtns}>
          <button type="button" onClick={() => studio.reorder(selected.id, "up")}>Bring forward</button>
          <button type="button" onClick={() => studio.reorder(selected.id, "down")}>Send back</button>
          <button type="button" onClick={() => studio.duplicateItem(selected.id)}>Duplicate</button>
          <button type="button" onClick={() => studio.removeItem(selected.id)} className={styles.danger}>Remove</button>
        </div>
      </div>
    );
  }

  function PreviewOptions() {
    return (
      <div className="grid gap-6">
        <div>
          <p className={styles.groupLabel}>Arrangement</p>
          <div className={styles.segment}>
            {(["ceremony", "stage", "banquet"] as Arrangement[]).map((a) => (
              <button key={a} type="button" aria-pressed={studio.arrangement === a} onClick={() => studio.set({ arrangement: a })}>{a}</button>
            ))}
          </div>
        </div>
        <div>
          <p className={styles.groupLabel}>Lighting</p>
          <div className={styles.segment}>
            {(["golden", "candlelit", "daylight"] as Lighting[]).map((l) => (
              <button key={l} type="button" aria-pressed={studio.lighting === l} onClick={() => studio.set({ lighting: l })}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <p className={styles.groupLabel}>Décor</p>
          <div className="grid gap-2">
            {PREVIEW_TOGGLES.map((t) => (
              <label key={t} className={styles.toggle}>
                <input type="checkbox" checked={studio.toggles[t]} onChange={() => studio.toggle(t)} />
                <span className="capitalize">{t}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className={styles.groupLabel}>Theme colours</p>
          <div className="flex gap-2">
            {studio.palette.map((c, i) => (
              <label key={i} className={styles.colorInput} style={{ background: c }}>
                <span className="sr-only">Palette colour {i + 1}</span>
                <input type="color" value={c} onChange={(e) => studio.setPaletteColor(i, e.target.value)} />
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
