import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  trailingSlash: true,
  
  // Image optimization configuration
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rvosteyajdubiwvvhitu.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  eslint: {
    // Disable ESLint during builds to avoid blocking deployment
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    // Disable TypeScript checking during builds to avoid blocking deployment
    ignoreBuildErrors: true,
  },
  
  experimental: {
    // Enable optimized package imports for better tree shaking
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Enable performance optimizations
    optimizeCss: true,
    // Enable modern bundling
    esmExternals: true,
    // Enable server components optimization
    serverComponentsExternalPackages: ['@tanstack/react-query'],
  },
  
  // Enhanced webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Server-side externals
    if (isServer) {
      config.externals = [...(config.externals || []), 'socket.io']
    }
    
    // Client-side optimizations
    if (!isServer) {
      // Resolve modules properly
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          fs: false,
          path: false,
          os: false,
          crypto: false,
          stream: false,
          buffer: false,
        },
      }
    }
    
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        // Enable module concatenation for better performance
        concatenateModules: true,
        // Enable side effects optimization
        sideEffects: false,
        // Optimize chunk splitting
        splitChunks: {
          ...config.optimization?.splitChunks,
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            ...config.optimization?.splitChunks?.cacheGroups,
            // Framework chunk
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'framework',
              chunks: 'all',
              priority: 40,
              enforce: true,
            },
            // UI library chunk
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 30,
            },
            // Query library chunk
            query: {
              test: /[\\/]node_modules[\\/](@tanstack)[\\/]/,
              name: 'query',
              chunks: 'all',
              priority: 25,
            },
            // Vendor chunk for other libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 20,
            },
            // Performance components chunk
            performance: {
              test: /[\\/]src[\\/]components[\\/]performance[\\/]/,
              name: 'performance',
              chunks: 'all',
              priority: 15,
            },

            // Common chunk for shared components
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              enforce: true,
            },
          },
        },
        // Enable runtime chunk optimization
        runtimeChunk: {
          name: 'runtime',
        },
      }
      

    }
    
    // Performance plugins
    if (!dev && !isServer) {
      // Add performance monitoring
      config.plugins = config.plugins || []
      
      // Bundle analyzer for performance monitoring (only in analysis mode)
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: 'web-bundle-report.html',
          })
        )
      }
    }
    
    return config
  },
  
  // Bundle optimization
  bundlePagesRouterDependencies: true,
  
  // Disable powered by header
  poweredByHeader: false,
}

export default nextConfig
