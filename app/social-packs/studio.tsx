"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FORMATS, THEMES, renderPack, type Framing, type PackContent } from "./_lib/render-pack";
import { createZip } from "./_lib/zip";

type FormatId = typeof FORMATS[number]["id"];
const defaultFrames = (): Record<FormatId, Framing> => ({ post: { mode: "fit", x: 50, y: 50 }, story: { mode: "fit", x: 50, y: 50 }, thumbnail: { mode: "fit", x: 50, y: 50 } });
const starters: { name: string; content: PackContent }[] = [
  { name: "Announcement", content: { label: "Something new", headline: "Good things are coming.", detail: "Your announcement, date, or a little more detail.", brand: "@yourhandle" } },
  { name: "New video", content: { label: "New episode", headline: "Worth watching.", detail: "A quick reason to watch your latest video.", brand: "Watch on my channel" } },
  { name: "Product launch", content: { label: "Just dropped", headline: "Meet your new favorite.", detail: "Your product name and what makes it special.", brand: "Shop the collection" } },
];
function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Image export failed. Please try again.")), "image/png"));
}

export default function PackStudio() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState<PackContent>(starters[0].content);
  const [themeId, setThemeId] = useState<string>("studio");
  const [frames, setFrames] = useState(defaultFrames);
  const [selected, setSelected] = useState<FormatId>("post");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const thumbs = useRef<Partial<Record<FormatId, HTMLCanvasElement | null>>>({});
  const request = useRef(0);
  const theme = THEMES.find(item => item.id === themeId) || THEMES[0];
  const format = FORMATS.find(item => item.id === selected)!;
  const ready = Boolean(image && content.headline.trim() && !loading && !busy);

  useEffect(() => () => { request.current++; }, []);
  useEffect(() => {
    if (!image) return;
    try {
      if (preview.current) renderPack(preview.current, image, format, theme, content, frames[selected]);
      for (const item of FORMATS) {
        const canvas = thumbs.current[item.id];
        if (canvas) renderPack(canvas, image, item, theme, content, frames[item.id]);
      }
    } catch { setError("The preview could not be drawn. Try another photo."); }
  }, [image, format, theme, content, frames, selected]);

  async function upload(file?: File) {
    if (!file) return;
    setError(""); setStatus("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Choose a JPG, PNG, or WebP photo."); return; }
    if (file.size > 20 * 1024 * 1024) { setError("Choose a photo smaller than 20 MB."); return; }
    const id = ++request.current;
    setLoading(true);
    const url = URL.createObjectURL(file);
    try {
      const next = new Image();
      next.src = url;
      await next.decode();
      if (id !== request.current) return;
      if (!next.naturalWidth || !next.naturalHeight || next.naturalWidth * next.naturalHeight > 40_000_000) throw new Error("Please resize this photo to under 40 megapixels and try again.");
      setImage(next); setFileName(file.name); setFrames(defaultFrames());
      setStatus("Photo ready. Your three layouts are ready to customize.");
    } catch (cause) {
      if (id === request.current) setError(cause instanceof Error && cause.message.startsWith("Please") ? cause.message : "This photo could not be opened. Try another JPG, PNG, or WebP.");
    } finally { URL.revokeObjectURL(url); if (id === request.current) setLoading(false); }
  }

  async function exportImages(all: boolean) {
    if (!image || !ready) return;
    setBusy(true); setError(""); setStatus("Preparing your images…");
    try {
      const files = [];
      for (const item of all ? FORMATS : [format]) {
        const canvas = document.createElement("canvas");
        renderPack(canvas, image, item, theme, content, frames[item.id]);
        const blob = await canvasBlob(canvas);
        const name = `overlayit-${item.id}-${item.width}x${item.height}.png`;
        if (!all) downloadBlob(blob, name);
        else files.push({ name, bytes: new Uint8Array(await blob.arrayBuffer()) });
        canvas.width = 0; canvas.height = 0;
      }
      if (all) downloadBlob(createZip(files), "overlayit-social-pack.zip");
      setStatus(all ? "Pack prepared: your ZIP contains three full-resolution PNGs." : "Your PNG is ready. Check your downloads.");
    } catch { setError("The download could not be prepared. Try again, or download each image separately."); setStatus(""); }
    finally { setBusy(false); }
  }

  const updateFrame = (patch: Partial<Framing>) => setFrames(previous => ({ ...previous, [selected]: { ...previous[selected], ...patch } }));
  return <main className="min-h-screen bg-[#0b0c10] text-white">
    <header className="border-b border-white/10 bg-[#111218]">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link href="/" className="text-sm font-semibold">OverlayIt <span className="ml-2 font-normal text-white/50">/ Social packs</span></Link>
        <div className="flex items-center gap-4"><Link href="/text-behind-image" className="text-xs text-white/70 hover:text-white">Image editor</Link><button type="button" disabled={!ready} onClick={() => void exportImages(true)} className="rounded-full bg-[#d9ff5a] px-4 py-2.5 text-xs font-semibold text-[#14151b] disabled:opacity-40">{busy ? "Preparing…" : "Download pack · ZIP"}</button></div>
      </div>
    </header>
    <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6">
      <div className="mb-6"><p className="mb-2 text-xs text-[#c3b5ff]">One photo. Three ways to share it.</p><h1 className="text-2xl font-semibold tracking-tight">Your next post starts here.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">Create a matching post, Story, and video thumbnail. Write once, review each layout, and download together.</p></div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Upload pack photo" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }}/>
      {error ? <div role="alert" className="mb-4 rounded-xl border border-rose-300/30 bg-rose-300/10 p-4 text-sm text-rose-100">{error}</div> : null}
      <p role="status" aria-live="polite" className="mb-4 min-h-5 text-xs text-white/65">{loading ? "Opening your photo…" : status}</p>
      <div className="grid items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="rounded-3xl bg-[#f8f7fc] p-5 text-[#18171d]">
          <fieldset disabled={busy || loading} className="min-w-0 space-y-6 disabled:opacity-60">
            <legend className="mb-4 text-sm font-semibold">Build your pack</legend>
            <section><h2 className="mb-2 text-xs font-medium">01 · Your photo</h2><button type="button" onClick={() => input.current?.click()} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); void upload(event.dataTransfer.files[0]); }} className={`w-full rounded-2xl border border-dashed p-4 text-left transition ${dragging ? "border-[#7557ff] bg-[#ece7ff]" : "border-black/20 bg-white"}`}><span className="block text-sm font-medium">{image ? "Change photo" : "Choose or drop a photo"}</span><span className="mt-1 block truncate text-xs text-[#716b7a]">{fileName || "JPG, PNG, WebP · up to 20 MB"}</span></button><p className="mt-2 text-[11px] text-[#716b7a]">Your photo stays in this browser. Work is not saved after leaving.</p></section>
            <section><h2 className="mb-2 text-xs font-medium">02 · Make it yours</h2><details className="mb-4 rounded-xl border border-black/10 p-3"><summary className="cursor-pointer text-xs font-medium">Start with sample copy</summary><p className="my-2 text-[11px] text-[#716b7a]">Choosing one replaces the four text fields below.</p><div className="flex flex-wrap gap-2">{starters.map(starter => <button type="button" key={starter.name} onClick={() => setContent(starter.content)} className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs">{starter.name}</button>)}</div></details>
              <div className="space-y-3">{([{ key: "label", title: "Small label", max: 32 }, { key: "headline", title: "Headline", max: 90 }, { key: "detail", title: "Supporting detail", max: 140 }, { key: "brand", title: "Handle or call to action", max: 48 }] as const).map(field => <div key={field.key}><label htmlFor={`pack-${field.key}`} className="mb-1.5 flex justify-between text-xs text-[#716b7a]">{field.title}<span>{content[field.key].length}/{field.max}</span></label><input id={`pack-${field.key}`} className="editor-input" maxLength={field.max} value={content[field.key]} onChange={event => setContent(previous => ({ ...previous, [field.key]: event.target.value }))}/></div>)}</div>
            </section>
            <section><h2 className="mb-3 text-xs font-medium">03 · Pick a look</h2><div className="grid grid-cols-3 gap-2">{THEMES.map(item => <button type="button" key={item.id} aria-pressed={themeId === item.id} onClick={() => setThemeId(item.id)} className={`overflow-hidden rounded-xl border text-left ${themeId === item.id ? "border-[#7557ff] ring-2 ring-[#7557ff]/20" : "border-black/10"}`}><span className="flex h-14 items-center justify-center text-xl" style={{ background: item.background, color: item.accent, fontFamily: item.font }}>Aa</span><span className="block bg-white px-2 py-2 text-[11px]">{item.name}</span></button>)}</div></section>
          </fieldset>
        </aside>
        <section className="min-w-0 space-y-4" aria-label="Pack preview">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a format">{FORMATS.map(item => <button type="button" key={item.id} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)} className={`rounded-full border px-4 py-2.5 text-xs transition ${selected === item.id ? "border-[#bcaeff] bg-[#7960e8] text-white" : "border-white/10 bg-white/5 text-white/70"}`}>{item.name}</button>)}</div>
          <div className="rounded-3xl border border-white/10 bg-[#16171e] p-3 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/60"><span>{format.name}</span><span>{format.width} × {format.height} px</span></div>
            <div className="flex h-[55vh] min-h-[300px] max-h-[720px] items-center justify-center rounded-2xl bg-[#090a0e] p-3">
              {image ? <canvas ref={preview} aria-label={`${format.name} preview: ${content.headline}`} role="img" className="max-h-full max-w-full object-contain shadow-2xl" style={{ aspectRatio: `${format.width} / ${format.height}` }}/> : <button type="button" disabled={loading} onClick={() => input.current?.click()} className="max-w-sm rounded-2xl border border-dashed border-white/20 px-8 py-10 text-center"><span className="block text-base font-medium">One photo, a whole content pack.</span><span className="mt-3 block text-sm leading-6 text-white/50">Choose a photo to see three coordinated layouts come to life.</span><span className="mt-5 inline-block rounded-full bg-[#d9ff5a] px-4 py-2 text-xs font-medium text-[#14151b]">Choose photo</span></button>}
            </div>
            <fieldset disabled={!image || busy || loading} className="mt-4 disabled:opacity-40"><legend className="mb-2 text-xs text-white/70">Photo framing · {format.name}</legend><div className="flex flex-wrap items-center gap-3"><div className="flex rounded-full bg-black/25 p-1">{(["fit", "fill"] as const).map(mode => <button key={mode} type="button" aria-pressed={frames[selected].mode === mode} onClick={() => updateFrame({ mode })} className={`rounded-full px-4 py-2 text-xs ${frames[selected].mode === mode ? "bg-white text-[#18171d]" : "text-white/60"}`}>{mode === "fit" ? "Full photo" : "Fill & crop"}</button>)}</div><button type="button" onClick={() => updateFrame({ mode: "fit", x: 50, y: 50 })} className="text-xs text-[#c3b5ff]">Reset framing</button></div>{frames[selected].mode === "fill" ? <div className="mt-3 grid gap-4 sm:grid-cols-2">{(["x", "y"] as const).map(axis => <label key={axis} className="text-xs text-white/70">{axis === "x" ? "Horizontal" : "Vertical"} position<input type="range" min={0} max={100} value={frames[selected][axis]} onChange={event => updateFrame({ [axis]: Number(event.target.value) })} className="mt-2 block w-full accent-[#ac98ff]"/></label>)}</div> : <p className="mt-2 text-[11px] text-white/50">The entire photo stays visible. Framing changes apply only to this format.</p>}</fieldset>
          </div>
          <div className="grid grid-cols-3 gap-3">{FORMATS.map(item => <button type="button" key={item.id} onClick={() => setSelected(item.id)} aria-label={`Review ${item.name}`} className={`min-w-0 rounded-2xl border bg-[#16171e] p-3 text-left ${selected === item.id ? "border-[#ac98ff]" : "border-white/10"}`}><div className="flex h-24 items-center justify-center overflow-hidden rounded-lg bg-[#090a0e] sm:h-32"><canvas ref={node => { thumbs.current[item.id] = node; }} role="img" aria-label={`${item.name} layout`} className={`max-h-full max-w-full object-contain ${image ? "" : "invisible"}`}/></div><span className="mt-2 block text-[11px] text-white/75">{item.name}</span></button>)}</div>
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-white/50">Review all three layouts before downloading.</p><button type="button" disabled={!ready} onClick={() => void exportImages(false)} className="rounded-full border border-white/20 px-4 py-2.5 text-xs text-white disabled:opacity-40">Download this PNG</button></div>
          {!content.headline.trim() ? <p className="text-xs text-amber-200">Add a headline to enable downloads.</p> : null}
        </section>
      </div>
    </div>
  </main>;
}
