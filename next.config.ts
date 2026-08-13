import type { NextConfig } from "next"

const isProd = process.env.NODE_ENV === "production"

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/gov-ai-v2" : "",
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    "10.232.46.183",
    "10.232.36.239",
  ],
}

export default nextConfig
