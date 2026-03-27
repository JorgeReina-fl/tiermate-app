import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/render/:path*',
        destination: 'https://api.render.com/v1/:path*',
      },
    ]
  }
};

export default nextConfig;
