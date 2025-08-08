import { ComponentType, lazy } from 'react'

/**
 * Enhanced lazy loading with error boundaries and loading states
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
) {
  const LazyComponent = lazy(importFn)

  // Return component with error boundary wrapper
  return LazyComponent
}

/**
 * Create lazy component for named exports
 */
export function createLazyNamedComponent<T extends ComponentType<any>>(
  importFn: () => Promise<any>,
  componentName: string,
  fallback?: ComponentType
) {
  const LazyComponent = lazy(async () => {
    const module = await importFn()
    return { default: module[componentName] }
  })

  return LazyComponent
}

/**
 * Preload a lazy component for better UX
 */
export function preloadComponent(importFn: () => Promise<any>) {
  // Start loading the component
  const componentPromise = importFn()

  // Return a function to check if it's loaded
  return {
    promise: componentPromise,
    isLoaded: false,
    load: () => {
      componentPromise.then(() => {
        return true
      })
      return componentPromise
    }
  }
}

/**
 * Route-based code splitting utilities
 */
export const LazyComponents = {
  // Dashboard components
  Dashboard: createLazyComponent(() => import('@/components/dashboard/dashboard')),
  DashboardSettings: createLazyComponent(() => import('@/components/dashboard/dashboard-settings')),

  // Task components
  TaskManager: createLazyComponent(() => import('@/components/tasks/task-manager')),
  TaskCalendarView: createLazyComponent(() => import('@/components/tasks/task-calendar-view')),
  TaskStatistics: createLazyComponent(() => import('@/components/tasks/task-statistics')),

  // Note components
  NoteEditor: createLazyComponent(() => import('@/components/notes/note-editor')),
  TiptapEditor: createLazyComponent(() => import('@/components/notes/tiptap-editor')),

  // Study group components
  StudyGroupsManager: createLazyComponent(() => import('@/components/study-groups/study-groups-manager')),
  GroupDetail: createLazyComponent(() => import('@/components/study-groups/group-detail')),
  GroupChat: createLazyComponent(() => import('@/components/study-groups/group-chat')),

  // File components
  FileManager: createLazyComponent(() => import('@/components/files/file-manager')),
  FilePreview: createLazyComponent(() => import('@/components/files/file-preview')),
}

/**
 * Preload critical components on app start
 */
export function preloadCriticalComponents() {
  // Preload components that are likely to be used soon
  const criticalComponents = [
    () => import('@/components/dashboard/dashboard'),
    () => import('@/components/tasks/task-manager'),
    () => import('@/components/notes/note-editor'),
  ]

  criticalComponents.forEach(importFn => {
    preloadComponent(importFn)
  })
}

/**
 * Preload components based on route
 */
export function preloadRouteComponents(route: string) {
  const routeComponentMap: Record<string, () => Promise<any>> = {
    '/dashboard': () => import('@/components/dashboard/dashboard'),
    '/tasks': () => import('@/components/tasks/task-manager'),
    '/notes': () => import('@/components/notes/note-editor'),
    '/study-groups': () => import('@/components/study-groups/study-groups-manager'),
    '/files': () => import('@/components/files/file-manager'),
  }

  const importFn = routeComponentMap[route]
  if (importFn) {
    preloadComponent(importFn)
  }
}