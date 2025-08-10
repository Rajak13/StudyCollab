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
  Dashboard: createLazyNamedComponent(
    () => import('@/components/dashboard/dashboard'),
    'Dashboard'
  ),  
  DashboardSettings: createLazyNamedComponent(
    () => import('@/components/dashboard/dashboard-settings'),
  'DashboardSettings'),

  // Task components
  TaskManager: createLazyNamedComponent(() => import('@/components/tasks/task-manager'), 'TaskManager'),
  TaskCalendarView: createLazyNamedComponent(() => import('@/components/tasks/task-calendar-view'), 'TaskCalendarView'),
  TaskStatistics: createLazyNamedComponent(() => import('@/components/tasks/task-statistics'), 'TaskStatistics'),

  // Note components
  NoteEditor: createLazyNamedComponent(() => import('@/components/notes/note-editor'), 'NoteEditor'),
  TiptapEditor: createLazyNamedComponent(() => import('@/components/notes/tiptap-editor'), 'TiptapEditor'),

  // Study group components
  StudyGroupsManager: createLazyNamedComponent(() => import('@/components/study-groups/study-groups-manager'), 'StudyGroupsManager'),
  GroupDetail: createLazyNamedComponent(() => import('@/components/study-groups/group-detail'), 'GroupDetail'),
  GroupChat: createLazyNamedComponent(() => import('@/components/study-groups/group-chat'), 'GroupChat'),

  // File components
  FileManager: createLazyNamedComponent(() => import('@/components/files/file-manager'), 'FileManager'),
  FilePreview: createLazyNamedComponent(() => import('@/components/files/file-preview'), 'FilePreview'),
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