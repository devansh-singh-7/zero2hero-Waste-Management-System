/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript and ESLint errors are no longer ignored in production
  experimental: {
    optimizePackageImports: [
      'react-icons',
      'lucide-react',
      'react-hot-toast',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      'leaflet',
      'react-leaflet',
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  poweredByHeader: false,
  compress: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        perf_hooks: false,
        fs: false,
        child_process: false,
        dgram: false,
        dns: false,
        module: false,
      };
    }
    return config;
  },
};

export default nextConfig;
