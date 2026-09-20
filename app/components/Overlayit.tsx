import Image from "next/image";
import Link from "next/link";
import moon from "@/public/moon.png";
import peace from "@/public/girl.png";
import pov from "@/public/pov.png";

const works=[{image:peace,label:"Portrait energy",tone:"bg-[#ff9bc2]"},{image:moon,label:"Dream sequence",tone:"bg-[#aa98ff]"},{image:pov,label:"Main character",tone:"bg-[#d8ff63]"}];
export default function Overlayit(){return <section id="showcase" className="page-shell py-20 lg:py-28"><div className="text-center"><span className="eyebrow">Made to stop the scroll</span><h2 className="mx-auto mt-5 max-w-3xl text-4xl font-black tracking-[-.05em] sm:text-6xl">One simple effect.<br/>Endless main-character energy.</h2></div><div className="mt-14 grid gap-6 md:grid-cols-3">{works.map((work,index)=><article key={work.label} className={`group relative overflow-hidden rounded-[2rem] border-2 border-[#17131f] ${index===1?"md:translate-y-8":""}`}><div className={`relative aspect-[4/5] ${work.tone}`}><Image src={work.image} alt={work.label} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width:768px) 90vw,30vw"/></div><div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-full bg-white/90 px-5 py-3 font-bold backdrop-blur"><span>{work.label}</span><span aria-hidden="true">✦</span></div></article>)}</div><div className="mt-20 text-center"><Link href="/text-behind-image" className="pill-button-primary">Make your own <span aria-hidden="true">→</span></Link></div></section>}
