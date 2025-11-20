/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prevents the "Module not found" errors for binary libs
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth', 'pdfjs-dist'],
  },
  webpack: (config) => {
    // Fixes standard node modules that webpack hates
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    return config
  },
};

module.exports = nextConfig;