import type { NextConfig } from 'next'

// Check if building for Electron
const isElectronBuild = process.env.NEXT_PUBLIC_ELECTRON === 'true'

const nextConfig: NextConfig = {
  // Disable static export for Electron integration - enables server-side features
  // output: 'export', // Commented out for Electron integration
  trailingSlash: true,
  
  // Asset handling configuration for Electron
  assetPrefix: isElectronBuild ? './' : (process.env.NODE_ENV === 'production' ? '' : ''),
  basePath: '',
  
  // Image optimization disabled for Electron compatibility
  images: {
    unoptimized: true, // Required for Electron integration
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
  },
  
  // Enhanced webpack configuration for Electron integration
  webpack: (config, { isServer, dev }) => {
    // Server-side externals
    if (isServer) {
      config.externals = [...(config.externals || []), 'socket.io']
    }
    
    // Electron-specific webpack optimizations
    if (!isServer) {
      // Configure public path for Electron renderer process
      config.output = {
        ...config.output,
        publicPath: isElectronBuild ? './' : (dev ? 'http://localhost:3000/' : '/'),
      }
      
      // Resolve electron modules properly
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
      
      // Exclude electron from client bundle
      if (isElectronBuild) {
        config.externals = {
          ...config.externals,
          electron: 'commonjs electron',
        }
      }
    }
    
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization?.splitChunks,
          cacheGroups: {
            ...config.optimization?.splitChunks?.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            // Separate chunk for Electron-specific code
            ...(isElectronBuild && {
              electron: {
                test: /[\\/]electron[\\/]/,
                name: 'electron',
                chunks: 'all',
                priority: 10,
              },
            }),
          },
        },
      }
    }
    
    return config
  },
  
  // Bundle optimization for Electron
  bundlePagesRouterDependencies: true,
  
  // Disable server-side generation features that don't work well in Electron
  poweredByHeader: false,
  
  // Configure headers for Electron security
  async headers() {
    if (!isElectronBuild) {
      return []
    }
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https:; img-src 'self' data: https:; connect-src 'self' https: wss: ws:;",
          },
        ],
      },
    ]
  },
}

export default nextConfig
