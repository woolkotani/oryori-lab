import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    "localhost",
    "KEITOnoMacBook-Air.local",
    "192.168.118.170",
    "192.168.0.0/16",
    "10.0.0.0/8",
    "grass-algorithm-williams-bandwidth.trycloudflare.com",
    "sales-idol-sandy-arrangement.trycloudflare.com",
  ],
};

export default nextConfig;
