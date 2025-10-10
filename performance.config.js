/**
 * Performance configuration for StudyCollab desktop application
 * This file contains settings for various performance optimizations
 */

module.exports = {
  // Electron performance settings
  electron: {
    // Main process optimizations
    main: {
      // Memory management
      maxOldSpaceSize: 512, // MB
      enableGarbageCollection: true,
      memoryThreshold: 500 * 1024 * 1024, // 500MB
      
      // CPU management
      cpuThreshold: 80, // 80%
      
      // Monitoring
      monitoringInterval: 30000, // 30 seconds
      enablePerformanceMonitoring: true,
    },
    
    // Renderer process optimizations
    renderer: {
      // Memory management
      enableLazyLoading: true,
      lazyLoadingThreshold: 0.1,
      lazyLoadingRootMargin: '50px',
      
      // Battery optimizations
      batteryMode: {
        reducedAnimations: true,
        reducedPolling: true,
        reducedCacheTime: true,
        disableBackgroundRefetch: true,
      },
      
      // Performance monitoring
      enableWebPerformanceAPI: true,
      performanceObserver: true,
      resourceCleanupInterval: 5 * 60 * 1000, // 5 minutes
    },
    
    // Startup optimizations
    startup: {
      preloadCriticalComponents: [
        'desktop-landing-page',
        'auth-components',
        'main-navigation',
      ],
      
      deferNonCriticalComponents: [
        'performance-dashboard',
        'advanced-features',
        'admin-components',
      ],
      
      enableCodeSplitting: true,
      enableTreeShaking: true,
    },
  },
  
  // Next.js performance settings
  nextjs: {
    // Bundle optimization
    bundleOptimization: {
      splitChunks: true,
      minimizeBundle: true,
      enableCompression: true,
      
      // Chunk splitting strategy
      chunkSplitting: {
        framework: ['react', 'react-dom'],
        ui: ['@radix-ui', 'lucide-react'],
        query: ['@tanstack'],
        performance: ['performance'],
      },
    },
    
    // Image optimization
    images: {
      unoptimized: true, // Required for Electron
      lazyLoading: true,
      placeholder: 'blur',
    },
    
    // Experimental features
    experimental: {
      optimizePackageImports: true,
      optimizeCss: true,
      esmExternals: true,
    },
  },
  
  // Development performance settings
  development: {
    // Hot reloading
    hotReload: {
      enabled: true,
      overlay: true,
    },
    
    // DevTools
    devTools: {
      enabled: true,
      performanceTab: true,
      memoryTab: true,
    },
    
    // Source maps
    sourceMaps: {
      enabled: true,
      type: 'eval-source-map',
    },
  },
  
  // Production performance settings
  production: {
    // Minification
    minification: {
      enabled: true,
      removeComments: true,
      removeConsole: false, // Keep for error reporting
    },
    
    // Compression
    compression: {
      enabled: true,
      algorithm: 'gzip',
      level: 9,
    },
    
    // Caching
    caching: {
      enabled: true,
      maxAge: 31536000, // 1 year
      immutable: true,
    },
  },
  
  // Performance thresholds and alerts
  thresholds: {
    // Memory thresholds
    memory: {
      warning: 400 * 1024 * 1024, // 400MB
      critical: 600 * 1024 * 1024, // 600MB
    },
    
    // CPU thresholds
    cpu: {
      warning: 70, // 70%
      critical: 90, // 90%
    },
    
    // Startup time thresholds
    startup: {
      warning: 3000, // 3 seconds
      critical: 5000, // 5 seconds
    },
    
    // Bundle size thresholds
    bundleSize: {
      warning: 5 * 1024 * 1024, // 5MB
      critical: 10 * 1024 * 1024, // 10MB
    },
  },
  
  // Performance monitoring configuration
  monitoring: {
    // Metrics collection
    metrics: {
      enabled: true,
      interval: 30000, // 30 seconds
      
      // Collected metrics
      collect: {
        memory: true,
        cpu: true,
        network: true,
        storage: true,
        performance: true,
      },
    },
    
    // Reporting
    reporting: {
      enabled: true,
      format: 'json',
      destination: 'performance-report.json',
    },
    
    // Alerts
    alerts: {
      enabled: true,
      channels: ['console', 'notification'],
    },
  },
  
  // Feature flags for performance optimizations
  features: {
    lazyLoading: true,
    codesplitting: true,
    treeshaking: true,
    bundleAnalysis: true,
    performanceMonitoring: true,
    batteryOptimization: true,
    memoryOptimization: true,
    startupOptimization: true,
  },
};