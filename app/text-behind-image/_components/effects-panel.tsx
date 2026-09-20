"use client";

import { useState } from "react";
import { useEditorStore } from "../_lib/editor-store";
import { hasEffects, type EffectTarget } from "../_lib/image-effects";

const adjustments = [
  { key: "blur", label: "Blur", min: 0, max: 30, unit: "" },
  { key: "brightness", label: "Brightness", min: -100, max: 100, unit: "%" },
  { key: "contrast", label: "Contrast", min: -100, max: 100, unit: "%" },
  { key: "saturation", label: "Saturation", min: -100, max: 100, unit: "%" },
  { key: "hue", label: "Hue rotate", min: 0, max: 360, unit: "°" },
  { key: "pixelate", label: "Pixelate", min: 0, max: 60, unit: "" },
  { key: "noise", label: "Grain", min: 0, max: 50, unit: "%" },
] as const;

export default function EffectsPanel() {
  const [target, setTarget] = useState<EffectTarget>("background");
  const effects = useEditorStore(state => state.effects);
  const update = useEditorStore(state => state.updateEffects);
  const reset = useEditorStore(state => state.resetEffects);
  const value = effects[target];
  return <div className="space-y-4 p-3.5">
    <div className="grid grid-cols-2 rounded-xl bg-[#eae7f0] p-1" role="group" aria-label="Effect target">
      {(["background", "subject"] as const).map(item => <button key={item} type="button" aria-pressed={target === item} onClick={() => setTarget(item)} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium capitalize transition ${target === item ? "bg-white text-[#201a30] shadow-sm" : "text-[#736c7f]"}`}>{item}{hasEffects(effects[item]) ? <span className="h-1.5 w-1.5 rounded-full bg-[#7557ff]" aria-label="Effects applied"/> : null}</button>)}
    </div>
    <p className="text-xs leading-5 text-[#716b7a]">{target === "background" ? "Set the mood around your subject. Darken the scene or soften distractions to make your text stand out." : "Fine-tune your subject independently. Keep it crisp against a softer background, or try a different color treatment."}</p>
    <div className="flex items-center justify-between"><h3 className="text-[11px] font-medium uppercase tracking-widest text-[#716b7a]">Adjustments</h3><button type="button" disabled={!hasEffects(value)} onClick={() => reset(target)} className="text-xs font-medium text-[#7255e8] disabled:opacity-30">Reset {target}</button></div>
    <div className="space-y-5">{adjustments.map(item => <div key={`${target}-${item.key}`}><div className="mb-2 flex items-center justify-between"><label htmlFor={`effect-${target}-${item.key}`} className="text-xs text-[#514a5c]">{item.label}</label><output className="text-xs tabular-nums text-[#82798e]">{value[item.key] === 0 && ["blur", "pixelate", "noise"].includes(item.key) ? "Off" : `${value[item.key]}${item.unit}`}</output></div><input id={`effect-${target}-${item.key}`} className="w-full accent-[#7557ff]" type="range" min={item.min} max={item.max} step={1} value={value[item.key]} onChange={event => update(target, { [item.key]: Number(event.target.value) })}/></div>)}</div>
    <div><h3 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-[#716b7a]">Color filters</h3><div className="grid grid-cols-3 gap-2">{(["grayscale", "sepia", "invert"] as const).map(filter => <button key={filter} type="button" aria-pressed={value[filter]} onClick={() => update(target, { [filter]: !value[filter] })} className={`rounded-xl border px-2 py-3 text-xs capitalize transition ${value[filter] ? "border-[#241d34] bg-[#241d34] text-white" : "border-black/[.07] bg-white text-[#716b7a]"}`}>{filter}</button>)}</div></div>
    <div className="rounded-2xl border border-[#7557ff]/10 bg-[#ede8ff]/60 p-4 text-xs leading-5 text-[#706582]">Try background brightness −30 and blur 8 with a crisp subject. Add Knockout text for an outlined headline across the subject.</div>
  </div>;
}
