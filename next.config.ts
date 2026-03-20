import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // This is the key fix for localhost
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'devcrm.mechlintech.com',
        port: '',
        pathname: '/logo.png',
      },
    ],
  },
};

export default nextConfig;