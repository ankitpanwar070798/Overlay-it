import Link from "next/link";

export default function Navbar() {
  return <header className="sticky top-0 z-50 border-b border-black/[.06] bg-[#f8f6ff]/85 backdrop-blur-xl"><div className="page-shell flex h-20 items-center justify-between">
    <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight" aria-label="OverlayIt home"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#17131f] text-sm text-[#d8ff63] shadow-[3px_3px_0_#7557ff]">OI</span>OverlayIt</Link>
    <nav className="hidden items-center gap-8 text-sm font-semibold md:flex" aria-label="Main navigation"><Link className="hover:text-[#7557ff]" href="#how-it-works">How it works</Link><Link className="hover:text-[#7557ff]" href="#features">Features</Link><Link className="hover:text-[#7557ff]" href="#showcase">Showcase</Link></nav>
    <Link href="/text-behind-image" className="pill-button bg-[#d8ff63] px-5 text-[#17131f] hover:-translate-y-0.5 hover:shadow-[0_5px_0_#17131f]">Start creating <span aria-hidden="true">↗</span></Link>
  </div></header>;
}
