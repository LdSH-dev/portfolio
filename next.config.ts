import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // No experimental.inlineCss: it put the stylesheet in the HTML three times
  // (once as <style>, twice in the RSC payload), and parsing that cost more
  // than the one cached CSS request it saved.
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
