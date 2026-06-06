/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  env: {
    NEXT_PUBLIC_ZEALT_RUN_ID: process.env.ZEALT_RUN_ID || "",
  }
};
export default nextConfig;
