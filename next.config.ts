import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Handle pdf-parse and other binary modules
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'pdf-parse': 'commonjs pdf-parse',
        'mammoth': 'commonjs mammoth'
      });
    }
    
    return config;
  },
  serverExternalPackages: ['pdf-parse', 'mammoth']
};

export default nextConfig;
