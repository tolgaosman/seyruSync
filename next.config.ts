import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "docs",
  images: {
    unoptimized: true,
  },
  basePath: isProd ? "/seyruSync/docs" : "",
};

export default nextConfig;
