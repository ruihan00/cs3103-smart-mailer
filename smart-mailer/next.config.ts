import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  pathname: "*",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/files/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
