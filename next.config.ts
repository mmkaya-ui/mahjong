import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Ensure trailing slashes for static export routing if needed (optional but good for some hosts)
  trailingSlash: true,
};

export default nextConfig;
