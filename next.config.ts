import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS || false;
let repo = "";
if (isGithubActions) {
  const repository = process.env.GITHUB_REPOSITORY || "";
  repo = repository.split("/")[1] || "";
}

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: repo ? `/${repo}` : undefined,
};

export default nextConfig;
