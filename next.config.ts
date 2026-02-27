import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
