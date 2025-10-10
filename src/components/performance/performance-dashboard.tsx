'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { usePerformanceMonitoring } from '@/hooks/use-performance-monitoring'
import {
    Activity,
    Battery,
    Cpu,
    HardDrive,
    MemoryStick,
    Monitor,
    RefreshCw,
    Trash2,
    TrendingDown,
    TrendingUp,
    Zap
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface PerformanceDashboardProps {
  className?: string
  compact?: boolean
}

export function PerformanceDashboard({ className, compact = false }: PerformanceDashboardProps) {
  const {
    electronMetrics,
    webMetrics,
    isMonitoring,
    batteryMode,
    memoryPressure,
    cpuPressure,
    startMonitoring,
    stopMonitoring,
    enableBatteryMode,
    disableBatteryMode,
    getPerformanceInsights,
    handleMemoryPressure,
    performResourceCleanup,
  } = usePerformanceMonitoring()

  const [insights, setInsights] = useState<ReturnType<typeof getPerformanceInsights> | null>(null)

  useEffect(() => {
    if (electronMetrics || webMetrics) {
      setInsights(getPerformanceInsights())
    }
  }, [electronMetrics, webMetrics, getPerformanceInsights])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const getMemoryUsageColor = (usage: number) => {
    if (usage > 0.8) return 'text-red-500'
    if (usage > 0.6) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getCpuUsageColor = (usage: number) => {
    if (usage > 80) return 'text-red-500'
    if (usage > 60) return 'text-yellow-500'
    return 'text-green-500'
  }

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">Performance</span>
          </div>
          <div className="flex items-center space-x-2">
            {batteryMode && <Battery className="h-4 w-4 text-yellow-500" />}
            {memoryPressure && <MemoryStick className="h-4 w-4 text-red-500" />}
            {cpuPressure && <Cpu className="h-4 w-4 text-red-500" />}
          </div>
        </div>
        
        {electronMetrics && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <MemoryStick className="h-3 w-3" />
              <span>{formatBytes(electronMetrics.memory.heapUsed)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Cpu className="h-3 w-3" />
              <span className={getCpuUsageColor(electronMetrics.cpu.usage)}>
                {electronMetrics.cpu.usage.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">Monitor and optimize application performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
          >
            <Activity className="h-4 w-4 mr-2" />
            {isMonitoring ? 'Stop' : 'Start'} Monitoring
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={performResourceCleanup}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup
          </Button>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm">Monitoring {isMonitoring ? 'Active' : 'Inactive'}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Battery className={`h-4 w-4 ${batteryMode ? 'text-yellow-500' : 'text-gray-400'}`} />
          <span className="text-sm">Battery Mode</span>
          <Switch
            checked={batteryMode}
            onCheckedChange={batteryMode ? disableBatteryMode : enableBatteryMode}
          />
        </div>

        {memoryPressure && (
          <Badge variant="destructive" className="flex items-center space-x-1">
            <MemoryStick className="h-3 w-3" />
            <span>Memory Pressure</span>
          </Badge>
        )}

        {cpuPressure && (
          <Badge variant="destructive" className="flex items-center space-x-1">
            <Cpu className="h-3 w-3" />
            <span>CPU Pressure</span>
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Electron Metrics */}
        {electronMetrics && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(electronMetrics.memory.heapUsed)}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {formatBytes(electronMetrics.memory.heapTotal)} allocated
                </p>
                <Progress 
                  value={(electronMetrics.memory.heapUsed / electronMetrics.memory.heapTotal) * 100} 
                  className="mt-2"
                />
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>RSS:</span>
                    <span>{formatBytes(electronMetrics.memory.rss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>External:</span>
                    <span>{formatBytes(electronMetrics.memory.external)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getCpuUsageColor(electronMetrics.cpu.usage)}`}>
                  {electronMetrics.cpu.usage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Load Average: {electronMetrics.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}
                </p>
                <Progress 
                  value={electronMetrics.cpu.usage} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Info</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Platform:</span>
                    <span>{electronMetrics.system.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Architecture:</span>
                    <span>{electronMetrics.system.arch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Memory:</span>
                    <span>{formatBytes(electronMetrics.system.totalMemory)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Free Memory:</span>
                    <span>{formatBytes(electronMetrics.system.freeMemory)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span>{formatDuration(electronMetrics.system.uptime * 1000)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Web Performance Metrics */}
        {webMetrics && (
          <>
            {webMetrics.navigation && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Page Performance</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatDuration(webMetrics.navigation.loadEventEnd - webMetrics.navigation.navigationStart)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total load time</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>DOM Content Loaded:</span>
                      <span>{formatDuration(webMetrics.navigation.domContentLoadedEventEnd - webMetrics.navigation.navigationStart)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>First Paint:</span>
                      <span>{formatDuration(webMetrics.navigation.responseStart - webMetrics.navigation.navigationStart)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {webMetrics.memory && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">JS Heap</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatBytes(webMetrics.memory.usedJSHeapSize)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    of {formatBytes(webMetrics.memory.totalJSHeapSize)} total
                  </p>
                  <Progress 
                    value={(webMetrics.memory.usedJSHeapSize / webMetrics.memory.totalJSHeapSize) * 100} 
                    className="mt-2"
                  />
                  <div className="mt-2 text-xs">
                    <div className="flex justify-between">
                      <span>Heap Size Limit:</span>
                      <span>{formatBytes(webMetrics.memory.jsHeapSizeLimit)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resources</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {webMetrics.resources.length}
                </div>
                <p className="text-xs text-muted-foreground">Resources loaded</p>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Performance Marks:</span>
                    <span>{webMetrics.marks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Performance Measures:</span>
                    <span>{webMetrics.measures.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Performance Insights */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Performance Insights</span>
            </CardTitle>
            <CardDescription>
              Recommendations and warnings based on current metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.warnings.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 mb-2 flex items-center">
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Warnings
                  </h4>
                  <ul className="space-y-1">
                    {insights.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-red-600 flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insights.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-600 mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {insights.recommendations.map((recommendation, index) => (
                      <li key={index} className="text-sm text-blue-600 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Load Time:</span>
                  <div className="text-lg font-bold">
                    {formatDuration(insights.metrics.loadTime)}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Memory Usage:</span>
                  <div className={`text-lg font-bold ${getMemoryUsageColor(insights.metrics.memoryUsage)}`}>
                    {(insights.metrics.memoryUsage * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <span className="font-medium">Resources:</span>
                  <div className="text-lg font-bold">
                    {insights.metrics.resourceCount}
                  </div>
                </div>
              </div>

              {memoryPressure && (
                <div className="mt-4">
                  <Button
                    onClick={handleMemoryPressure}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <MemoryStick className="h-4 w-4 mr-2" />
                    Clear Memory Pressure
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}