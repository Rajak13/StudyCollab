/** @type {import('next').NextConfig} */
const nextConfig = {
  // External packages for server components
  serverExternalPackages: ['better-sqlite3'],
  
  // Handle build-time environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    NEXT_PUBLIC_RELEASE_OWNER: process.env.NEXT_PUBLIC_RELEASE_OWNER || 'Rajak13',
    NEXT_PUBLIC_RELEASE_REPO: process.env.NEXT_PUBLIC_RELEASE_REPO || 'StudyCollab',
  },

  // Webpack configuration to handle Node.js modules in Edge Runtime
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error on build
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        dns: false,
        child_process: false,
        tls: false,
      }
    }

    // Handle better-sqlite3 and other native modules
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push('better-sqlite3')
    }

    return config
  },

  // Output configuration for static export compatibility
  output: 'standalone',
  
  // Image optimization
  images: {
    unoptimized: true,
  },

  // Disable ESLint during build for faster builds
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript checking during build (we'll check separately)
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig