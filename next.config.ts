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
  // We use "any" cast here to prevent the TypeScript error you saw in the screenshot
  // while still passing the configuration to the engine.
  experimental: {
    serverComponentsExternalPackages: ['pdfjs-dist'],
    turbo: {
      resolveAlias: {
        canvas: './empty-module.js',
      },
    },
  } as any, 
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;