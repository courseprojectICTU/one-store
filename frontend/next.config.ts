import type { NextConfig } from "next";

const isBuild = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(isBuild
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: "http://127.0.0.1:8787/api/:path*",
            },
          ];
        },
      }),
};

export default nextConfig;
