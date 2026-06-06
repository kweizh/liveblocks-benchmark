/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: { typedRoutes: false },
  transpilePackages: ["@blocknote/core", "@blocknote/mantine", "@blocknote/react", "y-prosemirror", "prosemirror-view"]
};
export default nextConfig;
