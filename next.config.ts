import type { NextConfig } from "next";

import { WORK_FILTERS } from "./lib/our-work-filters";
import { PRODUCTION_HOST_PATTERN } from "./lib/indexing";
import { legacyRedirects } from "./lib/legacy-redirects";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Never index anything but the production domain: painter1.vercel.app, previews and staging hosts
      // send X-Robots-Tag noindex (robots.txt disallows them too; lib/indexing.ts)
      { source: "/:path*", missing: [{ type: "host", value: PRODUCTION_HOST_PATTERN }], headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
  async redirects() {
    return [
      // Temporary (307, not cached by search engines) until the franchisor homepage exists at "/"
      { source: "/", destination: "/knoxville", permanent: false },
      // Old WordPress URLs of the locations live on this site (308), scoped to those locations only, so
      // they never catch the other locations still on WordPress: lib/legacy-redirects.ts
      ...legacyRedirects(),
    ];
  },
  async rewrites() {
    return [
      // The LCP image of each page (SanityImage with preload) loads through this site's own origin, so a
      // phone doesn't have to open a second connection (DNS + TCP + TLS) to cdn.sanity.io before it can
      // start. Sanity's cache headers pass through (public, s-maxage 30 days), so Vercel's CDN caches it.
      // Array rewrites run before the dynamic [location] routes.
      { source: "/sanity-img/:path*", destination: "https://cdn.sanity.io/images/:path*" },
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
