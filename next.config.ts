import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // デプロイ時のTypeScriptエラーを無視（警告として扱う）
    ignoreBuildErrors: true,
  },
  eslint: {
    // デプロイ時のESLint警告を無視
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
