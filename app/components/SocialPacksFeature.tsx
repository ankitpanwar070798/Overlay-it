import Link from "next/link";

export default function SocialPacksFeature() {
  return <section className="page-shell py-10"><div className="flex flex-col gap-6 rounded-[28px] bg-[#171820] p-7 text-white sm:p-10 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-medium text-[#d9ff5a]">New · Social content packs</p><h2 className="mt-3 text-2xl font-semibold tracking-tight">One photo. Your next three posts.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/65">Create a coordinated post, Story, and video thumbnail. Customize once, review each layout, and download the whole pack.</p></div><Link href="/social-packs" className="shrink-0 self-start rounded-full bg-[#d9ff5a] px-6 py-3 text-sm font-medium text-[#171820] md:self-center">Create a social pack →</Link></div></section>;
}
