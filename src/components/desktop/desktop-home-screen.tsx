'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useElectron, useElectronGlobalShortcuts } from '@/hooks/use-electron'
import { DesktopConfigManager } from '@/lib/desktop-config'
import { PlatformDetection } from '@/lib/platform-detection'
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  FileText,
  Folder,
  Settings,
  Star,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useDesktopNavigation } from './desktop-route-transition'

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
  const { electronAPI } = useElectron()
  const { registerShortcut } = useElectronGlobalShortcuts()
  const { navigateWithTransition, isTransitioning } = useDesktopNavigation()
  const [config, setConfig] = useState<any>(null)
  const [stats, setStats] = useState<DesktopStats>({
    totalTasks: 0,
    completedTasks: 0,
    totalNotes: 0,
    activeGroups: 0,
    pendingNotifications: 0
  })

  // Only render on client side to avoid SSR issues
  if (typeof window === 'undefined') {
    return null
  }

  useEffect(() => {
    // Load desktop configuration
    DesktopConfigManager.loadConfig().then(setConfig)

    // Load user stats (in a real app, this would come from an API)
    // For now, we'll use mock data with more realistic numbers
    setStats({
      totalTasks: 12,
      completedTasks: 8,
      totalNotes: 25,
      activeGroups: 3,
      pendingNotifications: 5
    })

    // Set up global shortcuts for desktop
    const setupShortcuts = async () => {
      if (registerShortcut) {
        try {
          await registerShortcut('CommandOrControl+Shift+N', 'new-note', 'Create new note')
          await registerShortcut('CommandOrControl+Shift+T', 'new-task', 'Create new task')
          await registerShortcut('CommandOrControl+Shift+G', 'open-groups', 'Open study groups')
          await registerShortcut('CommandOrControl+Shift+D', 'open-dashboard', 'Open dashboard')
          await registerShortcut('CommandOrControl+Shift+S', 'quick-search', 'Quick search')
        } catch (error) {
          console.warn('Failed to register global shortcuts:', error)
        }
      }
    }

    setupShortcuts()
  }, [registerShortcut])

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
    },
    {
      id: 'dashboard',
      label: 'Full Dashboard',
      description: 'Access the complete dashboard',
      icon: <Activity className="h-6 w-6" />,
      href: '/dashboard',
      shortcut: 'Ctrl+Shift+D'
    },
    {
      id: 'calendar',
      label: 'Calendar View',
      description: 'View your schedule and deadlines',
      icon: <Calendar className="h-6 w-6" />,
      href: '/calendar'
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
    },
    {
      id: '4',
      type: 'file',
      title: 'Biology Lab Report.pdf',
      description: 'Uploaded 1 day ago',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      href: '/files/4'
    },
    {
      id: '5',
      type: 'note',
      title: 'History Essay Outline',
      description: 'Created 2 days ago',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      href: '/notes/5'
    }
  ]

  const upcomingDeadlines = [
    {
      id: '1',
      title: 'Math Assignment',
      dueDate: new Date(Date.now() + 18 * 60 * 60 * 1000),
      priority: 'high' as const,
      href: '/tasks/1'
    },
    {
      id: '2',
      title: 'Physics Lab Report',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      priority: 'medium' as const,
      href: '/tasks/2'
    },
    {
      id: '3',
      title: 'History Essay',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: 'low' as const,
      href: '/tasks/3'
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

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const formatDueDate = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) return `${diffInHours}h left`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d left`
  }

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <div className={`min-h-screen bg-background transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
      <div className="p-6">
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
                    Jump into your most common tasks with keyboard shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {quickActions.map((action) => (
                      <div key={action.id} onClick={() => navigateWithTransition(action.href)}>
                        <Card className="group cursor-pointer transition-all hover:shadow-md hover:shadow-primary/20 hover:scale-105">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                {action.icon}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium group-hover:text-primary transition-colors">{action.label}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {action.description}
                                </p>
                                {action.shortcut && (
                                  <p className="mt-1 text-xs text-muted-foreground font-mono">
                                    {action.shortcut}
                                  </p>
                                )}
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity & Upcoming Deadlines */}
            <div className="space-y-6">
              {/* Recent Activity */}
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
                  <div className="space-y-3">
                    {recentActivity.slice(0, 4).map((activity) => (
                      <div key={activity.id} onClick={() => navigateWithTransition(activity.href)}>
                        <div className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 cursor-pointer">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary">
                              {activity.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => navigateWithTransition('/dashboard')}
                    >
                      View All Activity
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Deadlines */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Deadlines
                  </CardTitle>
                  <CardDescription>
                    Tasks and assignments due soon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingDeadlines.map((deadline) => (
                      <div key={deadline.id} onClick={() => navigateWithTransition(deadline.href)}>
                        <div className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 cursor-pointer">
                          <div className={`h-2 w-2 rounded-full ${deadline.priority === 'high' ? 'bg-red-500' :
                            deadline.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary">
                              {deadline.title}
                            </p>
                            <p className={`text-xs ${getPriorityColor(deadline.priority)}`}>
                              {formatDueDate(deadline.dueDate)}
                            </p>
                          </div>
                          <Star className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => navigateWithTransition('/tasks')}
                    >
                      View All Tasks
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Desktop Features Highlight */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Desktop Features
                </CardTitle>
                <CardDescription>
                  Take advantage of these desktop-exclusive features and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="group flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">Global Shortcuts</h3>
                      <p className="text-sm text-muted-foreground">
                        Quick access from anywhere
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        Ctrl+Shift+S for search
                      </p>
                    </div>
                  </div>

                  <div className="group flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">Native Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Never miss deadlines
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        System-level alerts
                      </p>
                    </div>
                  </div>

                  <div className="group flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                      <Folder className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">File Integration</h3>
                      <p className="text-sm text-muted-foreground">
                        Drag & drop support
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Direct file access
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Start Guide */}
                <div className="mt-6 rounded-lg bg-muted/50 p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Quick Start Guide
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-background rounded text-xs">Ctrl+Shift+N</kbd>
                      <span className="text-muted-foreground">Create new note</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-background rounded text-xs">Ctrl+Shift+T</kbd>
                      <span className="text-muted-foreground">Create new task</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-background rounded text-xs">Ctrl+Shift+G</kbd>
                      <span className="text-muted-foreground">Open study groups</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-background rounded text-xs">Ctrl+Shift+D</kbd>
                      <span className="text-muted-foreground">Go to dashboard</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}