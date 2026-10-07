import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Temporary (307, not cached by search engines) until the franchisor homepage exists at "/"
      { source: "/", destination: "/knoxville", permanent: false },
    ];
  },
};

export default nextConfig;
