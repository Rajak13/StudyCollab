'use client'

import { useAuth } from '@/hooks/use-auth'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { DashboardControls } from './dashboard-controls'
import { DashboardGrid } from './dashboard-grid'

interface DashboardProps {
  className?: string
}

export function Dashboard({ className }: DashboardProps) {
  const { user } = useAuth()
  const { isEditing } = useDashboardStore()

  const displayName = user?.user_metadata?.name || user?.email || 'User'

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ${className}`}>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Enhanced Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Welcome back, {displayName}!
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-2xl">
              Here&apos;s what&apos;s happening with your studies today.
            </p>
          </div>
          <div className="shrink-0">
            <DashboardControls />
          </div>
        </div>

        {/* Enhanced Edit Mode Notice */}
        {isEditing && (
          <div className="backdrop-blur-sm bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200/50 dark:border-blue-700/50 rounded-xl p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse shadow-sm" />
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Dashboard editing mode is active
              </p>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 leading-relaxed">
              Drag widgets to reorder, use controls to add/remove widgets, or click &quot;Done Editing&quot; when finished.
            </p>
          </div>
        )}

        {/* Enhanced Dashboard Grid */}
        <div className="backdrop-blur-sm bg-white/30 dark:bg-slate-800/30 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-xl overflow-hidden">
          <DashboardGrid />
        </div>
      </div>
    </div>
  )
}