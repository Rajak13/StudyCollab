'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDownloadAnalytics } from '@/hooks/use-download-analytics'
import {
    BarChart3,
    Calendar,
    Download,
    Globe,
    PieChart,
    RefreshCw,
    TrendingUp,
    Users
} from 'lucide-react'
import { useEffect } from 'react'

interface DownloadAnalyticsProps {
  className?: string
}

export function DownloadAnalytics({ className }: DownloadAnalyticsProps) {
  const { 
    analytics, 
    isLoading, 
    error, 
    fetchAnalytics, 
    getConversionMetrics 
  } = useDownloadAnalytics()

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const conversionMetrics = getConversionMetrics()

  const handleRefresh = () => {
    fetchAnalytics()
  }

  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading analytics...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-destructive">Error loading analytics: {error}</div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">No analytics data available</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Download Analytics</h2>
            <p className="text-muted-foreground">
              Track desktop app downloads and conversion metrics
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalDownloads}</div>
              <p className="text-xs text-muted-foreground">
                All-time downloads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Downloads</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.dailyStats.today}</div>
              <p className="text-xs text-muted-foreground">
                Downloads today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Platform</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {conversionMetrics?.topPlatform || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Most popular platform
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platforms</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(analytics.platformBreakdown).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Active platforms
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Platform Distribution
              </CardTitle>
              <CardDescription>
                Downloads by operating system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionMetrics?.platformDistribution.map((platform) => (
                  <div key={platform.platform} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {platform.platform === 'windows' ? '🪟' : 
                           platform.platform === 'mac' ? '🍎' : 
                           platform.platform === 'linux' ? '🐧' : '💻'}
                        </span>
                        <span className="font-medium capitalize">{platform.platform}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {platform.downloads} downloads
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {platform.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Today's Platform Stats
              </CardTitle>
              <CardDescription>
                Today's downloads by platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.dailyStats.platforms).map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {platform === 'windows' ? '🪟' : 
                         platform === 'mac' ? '🍎' : 
                         platform === 'linux' ? '🐧' : '💻'}
                      </span>
                      <span className="font-medium capitalize">{platform}</span>
                    </div>
                    <Badge variant="outline">
                      {count} today
                    </Badge>
                  </div>
                ))}
                {Object.keys(analytics.dailyStats.platforms).length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No downloads today yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Downloads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Downloads
            </CardTitle>
            <CardDescription>
              Latest download activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentDownloads.map((download, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {download.platform === 'windows' ? '🪟' : 
                       download.platform === 'mac' ? '🍎' : 
                       download.platform === 'linux' ? '🐧' : '💻'}
                    </span>
                    <div>
                      <div className="font-medium capitalize">{download.platform}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(download.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      {download.country || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              ))}
              {analytics.recentDownloads.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No recent downloads
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}