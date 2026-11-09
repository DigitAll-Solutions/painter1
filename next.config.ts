import type { NextConfig } from "next";

import { WORK_FILTERS } from "./lib/our-work-filters";
import { PRODUCTION_HOST_PATTERN } from "./lib/indexing";
import { legacyRedirects } from "./lib/legacy-redirects";
import { WORDPRESS_PROXY_HOST_PATTERN, wordpressHeaders, wordpressRewrites } from "./lib/wordpress-proxy";

const nextConfig: NextConfig = {
  // WordPress URLs end with a slash: proxy.ts removes it on our own paths only (lib/wordpress-proxy.ts)
  skipTrailingSlashRedirect: true,
  async headers() {
    return [
      // Never index anything but the production domain: painter1.vercel.app, previews and staging hosts
      // send X-Robots-Tag noindex (robots.txt disallows them too; lib/indexing.ts). Proxied WordPress
      // pages on staging included.
      { source: "/:path*", missing: [{ type: "host", value: PRODUCTION_HOST_PATTERN }], headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      ...wordpressHeaders(),
    ];
  },
  async redirects() {
    return [
      // painter1.com's homepage stays WordPress (proxied); elsewhere (painter1.vercel.app, previews) "/"
      // has no page of its own, so it still goes to Knoxville (307, never cached by search engines)
      { source: "/", missing: [{ type: "host", value: WORDPRESS_PROXY_HOST_PATTERN }], destination: "/knoxville", permanent: false },
      // Old WordPress URLs of the locations live on this site (308), scoped to those locations only, so
      // they never catch the other locations still on WordPress: lib/legacy-redirects.ts
      ...legacyRedirects(),
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [],
      // afterFiles: after our files (public/, robots.txt, sitemap.xml), before the dynamic [location] routes
      afterFiles: [
        // First: on painter1.com, everything that isn't a live location or one of our paths is WordPress,
        // so /atlanta/our-work?service=… never reaches the Our Work rule below (lib/wordpress-proxy.ts)
        ...wordpressRewrites(),
        // The LCP image of each page (SanityImage with preload) loads through this site's own origin, so a
        // phone doesn't have to open a second connection (DNS + TCP + TLS) to cdn.sanity.io before it can
        // start. Sanity's cache headers pass through (public, s-maxage 30 days), so Vercel's CDN caches it.
        { source: "/sanity-img/:path*", destination: "https://cdn.sanity.io/images/:path*" },
        // Our Work filter links (?service=interior …) are served by prebuilt pages, so the gallery
        // filters work without JavaScript and every view stays static. Unknown values show "All".
        {
          source: "/:location/our-work",
          has: [{ type: "query", key: "service", value: `(?<service>${WORK_FILTERS.map((filter) => filter.key).join("|")})` }],
          destination: "/:location/our-work/:service",
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
