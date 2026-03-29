import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';
const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  images: {
    // Disable image optimization on Cloudflare Workers to reduce CPU usage
    unoptimized: process.env.NODE_ENV === 'production',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.gpems.app',
        pathname: '/agritrade/zfocus/**',
      },
    ],
  },
  // Enable static exports for better caching
  experimental: {
    // Reduce memory usage
    webpackMemoryOptimizations: true,
  },
};

// Chỉ khởi tạo Cloudflare bindings khi chạy next dev (không chạy khi build trên CI)
if (process.env.NODE_ENV === 'development') {
  import('@opennextjs/cloudflare').then(({ initOpenNextCloudflareForDev }) => {
    initOpenNextCloudflareForDev();
  });
}

export default withNextIntl(nextConfig);
