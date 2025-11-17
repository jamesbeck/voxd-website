import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["knex"],
  images: {
    remotePatterns: [new URL("https://s3.eu-west-1.wasabisys.com/voxd/**")],
  },
  // cacheComponents: true,
};

export default nextConfig;
