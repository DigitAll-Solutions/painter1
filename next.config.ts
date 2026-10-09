import type { NextConfig } from "next";

import { WORK_FILTERS } from "./lib/our-work-filters";

const nextConfig: NextConfig = {
  experimental: {
    // Warranty requests carry up to 5 photos, resized in the browser; Vercel caps a request at 4.5 MB
    serverActions: { bodySizeLimit: "4mb" },
  },
  async redirects() {
    return [
      // Temporary (307, not cached by search engines) until the franchisor homepage exists at "/"
      { source: "/", destination: "/knoxville", permanent: false },
    ];
  },
  async rewrites() {
    return [
      // Our Work filter links (?service=interior …) are served by prebuilt pages, so the gallery
      // filters work without JavaScript and every view stays static. Unknown values show "All".
      {
        source: "/:location/our-work",
        has: [{ type: "query", key: "service", value: `(?<service>${WORK_FILTERS.map((filter) => filter.key).join("|")})` }],
        destination: "/:location/our-work/:service",
      },
    ];
  },
};

export default nextConfig;
