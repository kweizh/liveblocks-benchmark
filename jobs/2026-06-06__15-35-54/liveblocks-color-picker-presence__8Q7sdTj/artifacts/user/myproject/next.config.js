/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_ZEALT_RUN_ID: process.env.ZEALT_RUN_ID || process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "",
    NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY:
      process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || process.env.LIVEBLOCKS_PUBLIC_KEY || "",
  },
};
module.exports = nextConfig;
