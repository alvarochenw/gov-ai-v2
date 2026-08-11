import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/gov-ai-v2",
  images: {
    unoptimized: true,
  },
}

export default nextConfig
