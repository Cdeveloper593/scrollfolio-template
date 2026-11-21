import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: { useTypeScriptCli: false, workerThreads: true },
};

export default nextConfig;
