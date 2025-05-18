import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   images: {
    domains: [
      "lh3.googleusercontent.com", // for Google profile pictures
      "avatars.githubusercontent.com", // GitHub profile pictures (optional)
      "cdn.discordapp.com", // Discord profile pictures (optional)
      "pbs.twimg.com", // Twitter profile pictures (optional)
    ],
  },
};

export default nextConfig;
