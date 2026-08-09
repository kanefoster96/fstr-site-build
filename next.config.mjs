/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mocked integrations only for now — no external image domains required.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
