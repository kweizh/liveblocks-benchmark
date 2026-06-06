/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_ZEALT_RUN_ID: process.env.ZEALT_RUN_ID,
  },
};
export default nextConfig;
