"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { RootState } from "@react-three/fiber";
import { gsap, SplitText, useGSAP } from "@/lib/motion/gsap";
import { useExperience } from "@/lib/store";
import { DECOR, PREVIEW_TOGGLES, deriveToggles, serializeStudio, useStudio, type DecorType, type Lighting, type Arrangement } from "@/lib/studio/store";
import type { StudioTemplate } from "@/lib/types";
import ExperienceCanvas from "@/components/webgl/ExperienceCanvas";
import type { MoodboardHandle } from "./MoodboardCanvas";
import SubmitDrawer from "./SubmitDrawer";
import styles from "./studio.module.css";

const MoodboardCanvas = dynamic(() => import("./MoodboardCanvas"), { ssr: false, loading: () => <div className={styles.loading}>Preparing the board…</div> });
const ConceptPreview3D = dynamic(() => import("./ConceptPreview3D"), { ssr: false, loading: () => <div className={styles.loading}>Building the 3D preview…</div> });
const MorphPlane = dynamic(() => import("@/components/webgl/scenes/MorphPlane"), { ssr: false });

const EVENT_TYPES = ["Nikkah", "Mehndi", "Wedding", "Walima / Reception", "Engagement", "Birthday", "Corporate", "Private celebration"];
/** Extra moodboard-only touches (shown in the moodboard tools). */
const EXTRAS: { type: DecorType; label: string }[] = [
  { type: "floral", label: "More flowers" }, { type: "candles", label: "More candles" }, { type: "lantern", label: "Lantern" },
  { type: "chandelier", label: "Crystal hanging" }, { type: "table", label: "Another table" }, { type: "text", label: "Add text" },
];
const EXTRA_LABEL: Partial<Record<DecorType, string>> = { lantern: "Lantern", chandelier: "Crystal hanging", text: "Text" };
const DECOR_BY_TYPE = Object.fromEntries(Object.values(DECOR).map((d) => [d.type, d])) as Partial<Record<DecorType, (typeof DECOR)[keyof typeof DECOR]>>;
const LAYOUTS: { value: Arrangement; label: string; hint: string }[] = [
  { value: "ceremony", label: "Ceremony aisle", hint: "Arch at the front, aisle down the middle" },
  { value: "stage", label: "Stage & lounge", hint: "A styled stage with seating" },
  { value: "banquet", label: "Dinner reception", hint: "Guest tables around the room" },
];
const LIGHTS: { value: Lighting; label: string; hint: string }[] = [
  { value: "golden", label: "Golden hour", hint: "Warm and glowing" },
  { value: "candlelit", label: "Candlelight evening", hint: "Dark, romantic, candles on" },
  { value: "daylight", label: "Bright daytime", hint: "Clear and airy" },
];
const TIP_KEY = "c06-studio-tip";
const BACKGROUNDS = ["#efe8dc", "#f7f3ec", "#2a1013", "#1b2420", "#2b1606", "#e9dcc9", "#d9d4e6"];
const DRAFT_KEY = "c06-studio-draft";

export default function EventStudio({ templates, initialTheme, title, statement }: { templates: StudioTemplate[]; initialTheme?: string; title: string; statement: string }) {
  const root = useRef<HTMLDivElement>(null);
  const board = useRef<MoodboardHandle | null>(null);
  const three = useRef<RootState | null>(null);
  const [phase, setPhase] = useState<"intro" | "workspace">("intro");
  const [themeIndex, setThemeIndex] = useState(() => Math.max(0, templates.findIndex((t) => t.slug === initialTheme)));
  const [drawer, setDrawer] = useState(false);
  const [showTip, setShowTip] = useState(false);
  useEffect(() => { try { setShowTip(!localStorage.getItem(TIP_KEY)); } catch { setShowTip(true); } }, []);
  const dismissTip = () => { setShowTip(false); try { localStorage.setItem(TIP_KEY, "1"); } catch { /* ignore */ } };
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
        const { items, background, palette, templateSlug, eventType, style, lighting, arrangement, references } = useStudio.getState();
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ items, background, palette, templateSlug, eventType, style, lighting, arrangement, references }));
      } catch { /* quota or private mode */ }
    }, 600);
    return () => window.clearTimeout(id);
  }, [studio.items, studio.background, studio.palette, studio.eventType, studio.style, studio.lighting, studio.arrangement, studio.references]);

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
    let entered = false;
    const done = () => {
      if (entered) return;
      entered = true;
      setPhase("workspace");
      window.scrollTo(0, 0);
      requestAnimationFrame(() => document.getElementById("workspace-title")?.focus());
    };
    if (reduced) return done();
    // Never let a slow/throttled animation hold the visitor back.
    window.setTimeout(done, 1600);
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

  const toggles = deriveToggles(studio.items);
  const is3d = studio.mode === "3d";
  const selectedLabel = selected ? EXTRA_LABEL[selected.type] ?? DECOR_BY_TYPE[selected.type]?.label ?? "Inspiration photo" : "";

  return (
    <div key="workspace" ref={root} className={styles.workspace}>
      {/* ---------- Top bar ---------- */}
      <div className={styles.bar} data-ws-bar>
        <div>
          <h1 id="workspace-title" tabIndex={-1} className="display text-2xl outline-none md:text-3xl">Event Studio</h1>
          <p className="mt-1 text-sm text-nocturne/60">Build your look on the left. Everything updates both views.</p>
        </div>

        <div className="grid justify-items-center gap-1.5">
          <div className={styles.modes} role="tablist" aria-label="How to view your design">
            <button role="tab" aria-selected={!is3d} onClick={() => studio.set({ mode: "board" })}><span aria-hidden>▦</span> Moodboard</button>
            <button role="tab" aria-selected={is3d} onClick={() => studio.set({ mode: "3d" })}><span aria-hidden>◈</span> 3D view</button>
          </div>
          <span className="text-xs text-nocturne/55">Same design, two ways to look at it</span>
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={studio.undo} disabled={!studio.past.length} className={styles.textBtn} title="Undo (Ctrl+Z)">↶ Undo</button>
          <button type="button" onClick={studio.redo} disabled={!studio.future.length} className={styles.textBtn} title="Redo (Ctrl+Shift+Z)">↷ Redo</button>
          <button type="button" onClick={() => { if (theme && window.confirm("Start over from the selected look? You can still undo.")) studio.startOver(theme); }} className={styles.textBtn}>Start over</button>
          <button type="button" onClick={exportPng} className={styles.textBtn}>Save picture</button>
          <button type="button" onClick={() => setDrawer(true)} className="btn-portal ink !py-3"><span className="dot" />Send to our designers</button>
        </div>
      </div>

      {showTip && (
        <div className={styles.tip} role="note">
          <span><strong>New here?</strong> 1) Pick what you&apos;re celebrating and a look. 2) Choose colours and décor. 3) Switch to <em>3D view</em> to walk around it, then send it to us. Nothing is booked until we talk.</span>
          <button type="button" onClick={dismissTip} aria-label="Hide tip">Got it</button>
        </div>
      )}

      <div className={styles.grid}>
        {/* ---------- Left: guided steps (apply to both views) ---------- */}
        <aside className={styles.left} data-ws-panel aria-label="Design steps">
          <section className={styles.step}>
            <h2 className={styles.stepTitle}><span>1</span> What are you celebrating?</h2>
            <div className={styles.chips}>
              {EVENT_TYPES.map((t) => (
                <button key={t} type="button" aria-pressed={studio.eventType === t} onClick={() => studio.set({ eventType: t })}>{t}</button>
              ))}
            </div>
          </section>

          <section className={styles.step}>
            <h2 className={styles.stepTitle}><span>2</span> Pick a look</h2>
            <p className={styles.stepHint}>A starting point you can change. Picking a look replaces the current layout (Undo brings it back).</p>
            <div className={styles.templateList}>
              {templates.map((t, i) => (
                <button key={t.slug} type="button" onClick={() => chooseTheme(i)} aria-pressed={studio.templateSlug === t.slug}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.image.replace(".jpg", "-sm.jpg")} alt="" />
                  <span>{t.name}{studio.templateSlug === t.slug && " ✓"}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.step}>
            <h2 className={styles.stepTitle}><span>3</span> Your colours</h2>
            <p className={styles.stepHint}>Tap a colour to change it. All matching décor updates.</p>
            <div className="flex flex-wrap gap-3">
              {studio.palette.map((c, i) => (
                <label key={i} className="grid cursor-pointer justify-items-center gap-1 text-xs text-nocturne/70">
                  <span className={styles.colorInput} style={{ background: c }}>
                    <input type="color" value={c} onChange={(e) => studio.setPaletteColor(i, e.target.value)} aria-label={`Change colour ${i + 1}`} />
                  </span>
                  {theme?.palette.find((p) => p.hex.toLowerCase() === c.toLowerCase())?.name ?? `Colour ${i + 1}`}
                </label>
              ))}
            </div>
          </section>

          <section className={styles.step}>
            <h2 className={styles.stepTitle}><span>4</span> Choose your décor</h2>
            <p className={styles.stepHint}>Switch items on or off. They appear on the moodboard and in 3D.</p>
            <ul className={styles.decorList}>
              {PREVIEW_TOGGLES.map((key) => (
                <li key={key}>
                  <label className={styles.decorRow}>
                    <span>
                      <strong>{DECOR[key].label}</strong>
                      <small>{DECOR[key].hint}</small>
                    </span>
                    <input type="checkbox" role="switch" checked={toggles[key]} onChange={(e) => studio.setDecor(key, e.target.checked)} />
                    <i aria-hidden className={styles.switch} />
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.step}>
            <h2 className={styles.stepTitle}><span>5</span> Inspiration photos <em className="font-normal not-italic text-nocturne/50">(optional)</em></h2>
            <p className={styles.stepHint}>Add up to 6 pictures you love. They&apos;re pinned to your moodboard and sent with your design.</p>
            <label className={styles.upload}>
              <input type="file" accept="image/*" multiple onChange={(e) => { onUpload(e.target.files); e.target.value = ""; }} />
              <span>＋ Add photos</span>
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
          </section>
        </aside>

        {/* ---------- Centre: the design ---------- */}
        <section className={styles.stage} data-ws-stage aria-label={is3d ? "3D view of your design" : "Moodboard of your design"}>
          <div className={styles.stageLabel}>
            <span className="label">{is3d ? "3D view" : "Moodboard"}</span>
            <span className="text-xs text-nocturne/60">{is3d ? "Drag to look around · scroll or pinch to zoom" : "Drag items to move them · tap an item to edit it"}</span>
          </div>
          <div className={styles.stageInner} style={{ aspectRatio: is3d ? undefined : "10 / 7" }}>
            <MoodboardCanvas visible={!is3d} handleRef={board} />
            {is3d && (
              <div className={styles.three}>
                <ConceptPreview3D onReady={(st) => { three.current = st; }} />
                <p className={`label ${styles.disclaimer}`}>Concept preview · not to scale · final décor confirmed in consultation</p>
              </div>
            )}
          </div>
          <div className={styles.stageFooter}>
            <span className="text-sm text-nocturne/70">Happy with it? Send it to our team and we&apos;ll get back to you with ideas and a quote.</span>
            <button type="button" onClick={() => setDrawer(true)} className="btn-portal ink !py-3"><span className="dot" />Send to our designers</button>
          </div>
        </section>

        {/* ---------- Right: tools for the current view only ---------- */}
        <aside className={styles.right} data-ws-panel aria-label={is3d ? "3D view settings" : "Moodboard tools"}>
          {is3d ? ThreeDPanel() : BoardPanel()}
        </aside>
      </div>

      {drawer && <SubmitDrawer onClose={() => setDrawer(false)} capture={capture} configuration={serializeStudio} references={studio.references} />}
    </div>
  );

  function BoardPanel() {
    if (selected) {
      return (
        <div className="grid gap-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className={styles.panelTitle}>Edit: {selectedLabel}</h2>
            <button type="button" onClick={() => studio.select(null)} className="text-sm text-nocturne/60 underline">Done</button>
          </div>
          {selected.type === "text" && (
            <label className="field"><span>Your text</span><input value={selected.text ?? ""} onChange={(e) => studio.updateItem(selected.id, { text: e.target.value }, false)} onBlur={() => studio.checkpoint()} maxLength={60} /></label>
          )}
          {selected.type !== "image" && (
            <div>
              <p className={styles.groupLabel}>Colour</p>
              <div className="flex gap-2">
                {studio.palette.map((c) => <button key={c} type="button" aria-label={`Use colour ${c}`} aria-pressed={selected.color === c} onClick={() => studio.updateItem(selected.id, { color: c })} className={styles.bgSwatch} style={{ background: c }} />)}
              </div>
            </div>
          )}
          <label className="field"><span>Size</span>
            <span className="flex items-center gap-2 text-xs text-nocturne/60">Smaller<input className="flex-1" type="range" min={0.3} max={2.5} step={0.05} value={selected.scale} onChange={(e) => studio.updateItem(selected.id, { scale: Number(e.target.value) }, false)} onPointerUp={() => studio.checkpoint()} />Bigger</span>
          </label>
          <label className="field"><span>Turn</span>
            <input type="range" min={-180} max={180} step={1} value={selected.rotation} onChange={(e) => studio.updateItem(selected.id, { rotation: Number(e.target.value) }, false)} onPointerUp={() => studio.checkpoint()} />
          </label>
          <div className={styles.inspectorBtns}>
            <button type="button" onClick={() => studio.reorder(selected.id, "top")}>Bring to front</button>
            <button type="button" onClick={() => studio.reorder(selected.id, "bottom")}>Send to back</button>
            <button type="button" onClick={() => studio.duplicateItem(selected.id)}>Make a copy</button>
            <button type="button" onClick={() => studio.removeItem(selected.id)} className={styles.danger}>Delete</button>
          </div>
        </div>
      );
    }
    return (
      <div className="grid gap-6">
        <div>
          <h2 className={styles.panelTitle}>Moodboard tips</h2>
          <ul className="mt-3 grid gap-2 text-sm text-nocturne/75">
            <li>• <strong>Move:</strong> drag any item.</li>
            <li>• <strong>Edit:</strong> tap an item to resize, recolour or delete it.</li>
            <li>• <strong>Mistake?</strong> Press Undo at the top.</li>
          </ul>
        </div>
        <div>
          <p className={styles.groupLabel}>Extra touches</p>
          <div className={styles.library}>
            {EXTRAS.map((x) => (
              <button key={x.type} type="button" onClick={() => studio.addItem(x.type)}>
                <span aria-hidden className={styles.libIcon} data-type={x.type} />
                {x.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className={styles.groupLabel}>Board background</p>
          <div className="flex flex-wrap gap-2">
            {BACKGROUNDS.map((c) => <button key={c} type="button" aria-label={`Background ${c}`} aria-pressed={studio.background === c} onClick={() => studio.setBackground(c)} className={styles.bgSwatch} style={{ background: c }} />)}
          </div>
        </div>
      </div>
    );
  }

  function ThreeDPanel() {
    return (
      <div className="grid gap-6">
        <div>
          <h2 className={styles.panelTitle}>Room layout</h2>
          <div className={styles.optionCards}>
            {LAYOUTS.map((o) => (
              <button key={o.value} type="button" aria-pressed={studio.arrangement === o.value} onClick={() => studio.set({ arrangement: o.value })}>
                <strong>{o.label}</strong><small>{o.hint}</small>
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2 className={styles.panelTitle}>Lighting</h2>
          <div className={styles.optionCards}>
            {LIGHTS.map((o) => (
              <button key={o.value} type="button" aria-pressed={studio.lighting === o.value} onClick={() => studio.set({ lighting: o.value })}>
                <strong>{o.label}</strong><small>{o.hint}</small>
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-nocturne/65">Colours and décor are set on the left and stay the same in both views.</p>
      </div>
    );
  }
}
