import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  serverExternalPackages: ["pdf-parse", "bring-shopping"],
  /** Evita que Safari/PWA sirva HTML viejo; los JS de _next siguen con su propia caché de build. */
  async headers() {
    const htmlNoStore = [{ key: "Cache-Control", value: "no-store, must-revalidate" }];
    return [
      { source: "/", headers: htmlNoStore },
      { source: "/login", headers: htmlNoStore },
      { source: "/recipes", headers: htmlNoStore },
      { source: "/shopping-list", headers: htmlNoStore },
      { source: "/recipe/:path*", headers: htmlNoStore },
    ];
  },
};

export default nextConfig;
