import type { Metadata } from "next";
import PackStudio from "./studio";

export const metadata: Metadata = {
  title: "Social Content Packs | OverlayIt",
  description: "Turn one photo into a coordinated post, Story, and video thumbnail. Create and download your content pack in your browser.",
};

export default function SocialPacksPage() { return <PackStudio/>; }
