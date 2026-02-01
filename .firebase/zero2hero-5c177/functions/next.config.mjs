// next.config.mjs
var nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    optimizePackageImports: [
      "react-icons",
      "lucide-react",
      "react-hot-toast",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "leaflet",
      "react-leaflet"
    ]
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
  },
  poweredByHeader: false,
  compress: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
  },
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
        module: false
      };
    }
    return config;
  }
};
var next_config_default = nextConfig;
export {
  next_config_default as default
};
