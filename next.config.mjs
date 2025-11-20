/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Explicitly externalize these to prevent build failures with PDF/Word parsers
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

export default nextConfig;