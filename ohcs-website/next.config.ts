import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Trailing slash for Cloudflare Pages compatibility
  trailingSlash: true,
};

export default nextConfig;
