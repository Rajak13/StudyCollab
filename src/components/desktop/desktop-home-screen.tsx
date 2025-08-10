'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { DesktopConfigManager } from '@/lib/desktop-config'
import { PlatformDetection } from '@/lib/platform-detection'
import {
    Bell,
    BookOpen,
    CheckSquare,
    Clock,
    FileText,
    Folder,
    Settings,
    TrendingUp,
    Users,
    Zap
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface QuickAction {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  href: string
  shortcut?: string
}

interface RecentActivity {
  id: string
  type: 'note' | 'task' | 'group' | 'file'
  title: string
  description: string
  timestamp: Date
  href: string
}

interface DesktopStats {
  totalTasks: number
  completedTasks: number
  totalNotes: number
  activeGroups: number
  pendingNotifications: number
}

export function DesktopHomeScreen() {
  const { user } = useAuth()
  const [config, setConfig] = useState<any>(null)
  const [stats, setStats] = useState<DesktopStats>({
    totalTasks: 0,
    completedTasks: 0,
    totalNotes: 0,
    activeGroups: 0,
    pendingNotifications: 0
  })

  useEffect(() => {
    // Load desktop configuration
    DesktopConfigManager.loadConfig().then(setConfig)
    
    // Load user stats (in a real app, this would come from an API)
    // For now, we'll use mock data
    setStats({
      totalTasks: 12,
      completedTasks: 8,
      totalNotes: 25,
      activeGroups: 3,
      pendingNotifications: 5
    })
  }, [])

  const quickActions: QuickAction[] = [
    {
      id: 'new-note',
      label: 'New Note',
      description: 'Create a new study note',
      icon: <FileText className="h-6 w-6" />,
      href: '/notes/create',
      shortcut: 'Ctrl+Shift+N'
    },
    {
      id: 'new-task',
      label: 'New Task',
      description: 'Add a new task or assignment',
      icon: <CheckSquare className="h-6 w-6" />,
      href: '/tasks?action=create',
      shortcut: 'Ctrl+Shift+T'
    },
    {
      id: 'study-groups',
      label: 'Study Groups',
      description: 'Join or manage study groups',
      icon: <Users className="h-6 w-6" />,
      href: '/study-groups',
      shortcut: 'Ctrl+Shift+G'
    },
    {
      id: 'files',
      label: 'Files',
      description: 'Manage your study materials',
      icon: <Folder className="h-6 w-6" />,
      href: '/files'
    }
  ]

  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'note',
      title: 'Physics Chapter 12 Notes',
      description: 'Updated 2 hours ago',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      href: '/notes/1'
    },
    {
      id: '2',
      type: 'task',
      title: 'Math Assignment Due Tomorrow',
      description: 'Due in 18 hours',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      href: '/tasks/2'
    },
    {
      id: '3',
      type: 'group',
      title: 'Chemistry Study Group',
      description: 'New message from Sarah',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      href: '/study-groups/3'
    }
  ]

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'note':
        return <FileText className="h-4 w-4" />
      case 'task':
        return <CheckSquare className="h-4 w-4" />
      case 'group':
        return <Users className="h-4 w-4" />
      case 'file':
        return <Folder className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const completionPercentage = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0

  if (!PlatformDetection.isElectron()) {
    return null // This component should only render in desktop environment
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h1>
            <p className="text-muted-foreground">
              Ready to continue your studies? Here's what's happening.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {stats.pendingNotifications > 0 && (
              <Button variant="outline" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {stats.pendingNotifications}
                </span>
              </Button>
            )}
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Progress</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionPercentage}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedTasks} of {stats.totalTasks} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNotes}</div>
              <p className="text-xs text-muted-foreground">
                Study notes created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Groups</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeGroups}</div>
              <p className="text-xs text-muted-foreground">
                Active collaborations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productivity</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12%</div>
              <p className="text-xs text-muted-foreground">
                vs last week
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Jump into your most common tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {quickActions.map((action) => (
                    <Link key={action.id} href={action.href}>
                      <Card className="group cursor-pointer transition-all hover:shadow-md hover:shadow-primary/20">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                              {action.icon}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{action.label}</h3>
                              <p className="text-sm text-muted-foreground">
                                {action.description}
                              </p>
                              {action.shortcut && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {action.shortcut}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest updates and changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <Link key={activity.id} href={activity.href}>
                      <div className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary">
                            {activity.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                  
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full">
                      View All Activity
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Desktop Features Highlight */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Desktop Features</CardTitle>
              <CardDescription>
                Take advantage of these desktop-exclusive features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Global Shortcuts</h3>
                    <p className="text-sm text-muted-foreground">
                      Quick access from anywhere
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Native Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Never miss deadlines
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <Folder className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">File Integration</h3>
                    <p className="text-sm text-muted-foreground">
                      Drag & drop support
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}