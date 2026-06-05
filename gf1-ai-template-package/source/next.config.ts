import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  typedRoutes: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  // puppeteer-core loads native files at runtime and must not be bundled.
  // chromium-min ships no binary (the pack is fetched at runtime), so no file
  // tracing is needed — keeping it external just avoids the bundler touching it.
  serverExternalPackages: ['@sparticuz/chromium-min', 'puppeteer-core'],
  productionBrowserSourceMaps: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fupyymbofvdmdfmombkb.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  turbopack: {
    resolveAlias: {},
    debugIds: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Remove custom webpack devtool disabling to allow source maps
};

export default nextConfig;
