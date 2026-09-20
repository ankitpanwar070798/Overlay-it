"use client";

import { useState } from "react";
import { useEditorStore } from "../_lib/editor-store";
import type { TextLayer } from "../_lib/editor-types";

type TextStyle = Pick<TextLayer, "fontFamily" | "fontWeight" | "color" | "shadowColor" | "shadowSize">;
const styles: { name: string; sample: string; background: string; value: TextStyle }[] = [
  { name: "Editorial", sample: "The moment", background: "#29252b", value: { fontFamily: "Playfair Display", fontWeight: 700, color: "#fff3df", shadowColor: "#000000", shadowSize: 8 } },
  { name: "Headline", sample: "MAKE WAVES", background: "#263236", value: { fontFamily: "Bebas Neue", fontWeight: 400, color: "#ffffff", shadowColor: "#000000", shadowSize: 12 } },
  { name: "Neon", sample: "After hours", background: "#181d22", value: { fontFamily: "Space Grotesk", fontWeight: 700, color: "#d9ff5a", shadowColor: "#d9ff5a", shadowSize: 24 } },
  { name: "Signature", sample: "Stay golden", background: "#3b2c33", value: { fontFamily: "Dancing Script", fontWeight: 700, color: "#ffdba8", shadowColor: "#000000", shadowSize: 8 } },
  { name: "Marker", sample: "Good energy", background: "#302540", value: { fontFamily: "Permanent Marker", fontWeight: 400, color: "#ffc9df", shadowColor: "#000000", shadowSize: 0 } },
  { name: "Minimal", sample: "Less, better.", background: "#eae7e1", value: { fontFamily: "Inter", fontWeight: 500, color: "#18171d", shadowColor: "#000000", shadowSize: 0 } },
];

export default function TextStyles({ layer }: { layer: TextLayer }) {
  const updateTextLayer = useEditorStore(state => state.updateTextLayer);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const applyStyle = async (style: typeof styles[number]) => {
    setPending(style.name);
    setMessage("");
    try {
      // Wait for the actual font so canvas measurement and export agree.
      const faces = await document.fonts.load(`${style.value.fontWeight} 32px "${style.value.fontFamily}"`, layer.text || "Sample");
      if (!faces.length) throw new Error("Font unavailable");
      updateTextLayer(layer.id, style.value);
      setMessage(`${style.name} applied. Undo to restore your previous style.`);
    } catch {
      setMessage("This font could not load. Check your connection and try again.");
    } finally {
      setPending(null);
    }
  };

  return <details className="group rounded-2xl border border-black/[.07] bg-white/60 p-4">
    <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
      Text styles <span aria-hidden="true" className="text-lg font-light transition group-open:rotate-45">+</span>
    </summary>
    <p className="mb-3 mt-2 text-xs leading-5 text-[#716b7a]">A starting point for your look. Apply a style, then make it yours.</p>
    <div className="grid grid-cols-2 gap-2" aria-label="Text style presets">
      {styles.map(style => {
        const active = (Object.keys(style.value) as (keyof TextStyle)[]).every(key => layer[key] === style.value[key]);
        return <button key={style.name} type="button" aria-label={`Apply ${style.name} text style`} aria-pressed={active} disabled={pending !== null}
          onClick={() => void applyStyle(style)}
          className={`min-w-0 overflow-hidden rounded-xl border text-left transition disabled:cursor-wait disabled:opacity-60 ${active ? "border-[#7557ff] ring-2 ring-[#7557ff]/20" : "border-black/[.08] hover:border-[#7557ff]/50"}`}>
          <span aria-hidden="true" className="flex h-16 items-center justify-center overflow-hidden px-2 text-center text-lg" style={{ background: style.background, color: style.value.color, fontFamily: `"${style.value.fontFamily}", sans-serif`, fontWeight: style.value.fontWeight, textShadow: style.value.shadowSize ? `0 0 ${style.value.shadowSize / 3}px ${style.value.shadowColor}` : "none" }}>{style.sample}</span>
          <span className="flex items-center justify-between gap-1 bg-white px-2.5 py-2 text-[11px] font-medium text-[#41394b]">{pending === style.name ? "Loading font…" : style.name}<span aria-hidden="true" className="text-[#7557ff]">{active ? "✓" : "+"}</span></span>
        </button>;
      })}
    </div>
    <p role="status" aria-live="polite" className="mt-2 text-[11px] leading-4 text-[#716b7a]">{message || "Keeps your words, size, and position. One click, one undo."}</p>
  </details>;
}
