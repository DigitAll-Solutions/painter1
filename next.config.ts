import type { NextConfig } from "next";

import { WORK_FILTERS } from "./lib/our-work-filters";
import { SERVICE_SLUG_RENAMES } from "./lib/service-slugs";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Temporary (307, not cached by search engines) until the franchisor homepage exists at "/"
      { source: "/", destination: "/knoxville", permanent: false },
      // Renamed service pages (308): /knoxville/cabinet-refinishing → /knoxville/cabinet-painting, every location
      ...Object.entries(SERVICE_SLUG_RENAMES).map(([from, to]) => ({ source: `/:location/${from}`, destination: `/:location/${to}`, permanent: true })),
      // No reviews page (Rick, Oct 14): reviews stay on the homepage. Old /knoxville/reviews(/…) URLs (308)
      // land on its reviews section, every location; /studio is left alone.
      { source: "/:location((?!studio(?![^/]))[^/]+)/reviews/:rest*", destination: "/:location#reviews", permanent: true },
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
