"use client";
import { useState } from "react";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";

const examples={Products:{before:"/headphone-bg.jpg",after:"/headphone.png"},Animals:{before:"/wolf-bg.jpg",after:"/wolf.png"}};
type Example=keyof typeof examples;

export default function ImageComparison(){const [active,setActive]=useState<Example>("Products");const image=examples[active];return <section id="features" className="bg-[#17131f] py-20 text-white lg:py-28"><div className="page-shell grid items-center gap-12 lg:grid-cols-[.7fr_1.3fr]">
  <div><span className="eyebrow border-white/10 bg-white/10 text-[#d8ff63]">Clean edges. Big ideas.</span><h2 className="mt-6 text-4xl font-black tracking-[-.05em] sm:text-6xl">Keep the subject.<br/><span className="text-[#aa98ff]">Lose the clutter.</span></h2><p className="mt-5 max-w-md text-lg leading-8 text-white/60">Slide to compare. Background removal runs on your device, keeping your image private while preparing it for the editor.</p><div className="mt-8 flex gap-2" role="tablist" aria-label="Comparison examples">{(Object.keys(examples) as Example[]).map((name)=><button key={name} role="tab" aria-selected={active===name} onClick={()=>setActive(name)} className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${active===name?"bg-[#d8ff63] text-[#17131f]":"bg-white/10 text-white hover:bg-white/20"}`}>{name}</button>)}</div></div>
  <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 p-3 shadow-2xl"><ReactCompareSlider className="aspect-[16/10] overflow-hidden rounded-[1.4rem]" itemOne={<ReactCompareSliderImage src={image.after} alt={`${active} with background removed`} style={{objectFit:"cover"}}/>} itemTwo={<ReactCompareSliderImage src={image.before} alt={`${active} original`} style={{objectFit:"cover"}}/>}/><div className="flex justify-between px-3 pb-1 pt-4 text-xs font-bold uppercase tracking-[.14em] text-white/50"><span>Cutout</span><span>Original</span></div></div>
  </div></section>}
