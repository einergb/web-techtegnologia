import type { NextConfig } from "next";

const imageHosts = (process.env.IMAGE_HOSTS || "img.codeconheiner.com")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: imageHosts.map((hostname) => ({ protocol: "https", hostname })),
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      ],
    }];
  },
};

export default nextConfig;
