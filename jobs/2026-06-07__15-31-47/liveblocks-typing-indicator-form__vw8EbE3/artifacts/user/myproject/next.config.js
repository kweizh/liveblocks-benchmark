/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_ROOM_ID: process.env.ZEALT_RUN_ID
      ? `harbor-typing-form-${process.env.ZEALT_RUN_ID}`
      : "harbor-typing-form-local",
  },
};
module.exports = nextConfig;
