'use client'

import { type WidgetConfig } from '@/lib/stores/dashboard-store'
import {
    ActivityWidget,
    CalendarWidget,
    RecentNotesWidget,
    StatsWidget,
    TasksOverviewWidget,
} from './widgets'

interface WidgetRendererProps {
  widget: WidgetConfig
  className?: string
}

export function WidgetRenderer({ widget, className }: WidgetRendererProps) {
  const getWidgetSize = (widget: WidgetConfig) => {
    const { width, height } = widget.size
    
    // Map widget size to CSS classes
    const widthClass = width === 1 ? 'col-span-1' : 
                      width === 2 ? 'md:col-span-2' : 
                      width === 3 ? 'lg:col-span-3' : 
                      'lg:col-span-4'
    
    const heightClass = height === 1 ? 'row-span-1' : 
                       height === 2 ? 'row-span-2' : 
                       'row-span-3'
    
    return `${widthClass} ${heightClass}`
  }

  const widgetClassName = `${getWidgetSize(widget)} ${className || ''}`

  switch (widget.type) {
    case 'tasks-overview':
      return <TasksOverviewWidget className={widgetClassName} />
    
    case 'recent-notes':
      return <RecentNotesWidget className={widgetClassName} />
    
    case 'calendar':
      return <CalendarWidget className={widgetClassName} />
    
    case 'stats':
      return <StatsWidget className={widgetClassName} />
    
    case 'activity':
      return <ActivityWidget className={widgetClassName} />
    
    default:
      return (
        <div className={`${widgetClassName} p-4 border rounded-lg`}>
          <p>Unknown widget type: {widget.type}</p>
        </div>
      )
  }
}