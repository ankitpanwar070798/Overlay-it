import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @param {string} phase */
export default function nextConfig(phase) {
  return {
    // Keep development assets separate from production output. Otherwise a
    // `next build` can replace the CSS chunks that an open dev server expects.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "tailwindui.com",
        },
      ],
    },
  };
}

