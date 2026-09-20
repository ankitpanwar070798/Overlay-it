import { useEditorStore } from "../_lib/editor-store";
import type { TextLayer } from "../_lib/editor-types";

const modes = [
  { id: "normal", name: "Normal", description: "Solid text over the entire photo." },
  { id: "behind", name: "Behind", description: "Your subject sits in front of the text." },
  { id: "knockout", name: "Knockout", description: "Filled around your subject. Outlined across it." },
] as const;
export default function TextEffectPicker({ layer }: { layer: TextLayer }) {
  const update = useEditorStore(state => state.updateTextLayer);
  const mode = layer.textEffect || (layer.placement === "front" ? "normal" : "behind");
  return <section className="space-y-2.5">
    <h3 className="editor-label !mb-0">Text effect</h3>
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#e8e5ed] p-1" role="group" aria-label="Text effect">
      {modes.map(item => <button type="button" key={item.id} aria-pressed={mode === item.id} onClick={() => update(layer.id, { textEffect: item.id, placement: item.id === "normal" ? "front" : "behind" })} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-1 text-[11px] font-medium transition ${mode === item.id ? "bg-white text-[#6244d5] shadow-sm" : "text-[#756d80] hover:bg-white/50"}`}>
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          {item.id === "normal" ? <path d="M4 5h12M10 5v11M7 16h6"/> : item.id === "behind" ? <><rect x="3" y="3" width="10" height="10" rx="2"/><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none"/></> : <path d="m3 16 5-12h4l5 12M6 11h8"/>}
        </svg>{item.name}
      </button>)}
    </div>
    <p className="text-[11px] leading-4 text-[#81768c]">{modes.find(item => item.id === mode)?.description}</p>
    {mode === "knockout" ? <label className="block pt-1 text-xs text-[#716b7a]">Outline weight <span className="float-right tabular-nums">{layer.outlineWidth ?? 2}</span><input type="range" min={.5} max={8} step={.5} value={layer.outlineWidth ?? 2} onChange={event => update(layer.id, { outlineWidth: Number(event.target.value) })} className="mt-2 w-full accent-[#7557ff]"/></label> : null}
  </section>;
}
