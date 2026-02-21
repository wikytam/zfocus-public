import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';
const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.gpems.app',
        pathname: '/agritrade/zfocus/**',
      },
    ],
  },
};

// Chỉ khởi tạo Cloudflare bindings khi chạy next dev (không chạy khi build trên CI)
if (process.env.NODE_ENV === 'development') {
  import('@opennextjs/cloudflare').then(({ initOpenNextCloudflareForDev }) => {
    initOpenNextCloudflareForDev();
  });
}

export default withNextIntl(nextConfig);
