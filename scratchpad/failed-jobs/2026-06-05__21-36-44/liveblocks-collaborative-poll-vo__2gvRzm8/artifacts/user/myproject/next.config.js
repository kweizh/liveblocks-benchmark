/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Expose ZEALT_RUN_ID to the browser so the page can derive a unique room id.
  env: {
    NEXT_PUBLIC_ZEALT_RUN_ID: process.env.ZEALT_RUN_ID || "local",
  },
};

module.exports = nextConfig;
