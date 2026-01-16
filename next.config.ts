import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["knex"],
  images: {
    remotePatterns: [new URL("https://s3.eu-west-1.wasabisys.com/voxd/**")],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // cacheComponents: true,
  async headers() {
    return [
      {
        // Allow iframe embedding for /iframes/* routes
        source: "/iframes/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
        ],
      },
      {
        // Prevent iframe embedding for all other routes
        source: "/((?!iframes).*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
