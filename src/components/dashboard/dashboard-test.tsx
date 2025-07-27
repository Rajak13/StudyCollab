'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { CheckCircle, Info, RefreshCw } from 'lucide-react'

export function DashboardTest() {
  const { 
    widgets, 
    layout, 
    isEditing, 
    setEditing, 
    resetLayout, 
    addWidget,
    getVisibleWidgets 
  } = useDashboardStore()

  const visibleWidgets = getVisibleWidgets()
  const hiddenWidgets = widgets.filter(w => !w.visible)

  const testResults = [
    {
      name: 'Widget Store Initialization',
      passed: widgets.length > 0,
      description: 'Dashboard store should have default widgets'
    },
    {
      name: 'Layout Configuration',
      passed: layout.columns > 0 && layout.gap > 0,
      description: 'Layout should have valid configuration'
    },
    {
      name: 'Visible Widgets',
      passed: visibleWidgets.length > 0,
      description: 'At least one widget should be visible'
    },
    {
      name: 'Widget Types',
      passed: widgets.every(w => ['tasks-overview', 'recent-notes', 'calendar', 'stats', 'activity'].includes(w.type)),
      description: 'All widgets should have valid types'
    },
    {
      name: 'Widget Persistence',
      passed: typeof window !== 'undefined' && localStorage.getItem('dashboard-store') !== null,
      description: 'Dashboard state should be persisted'
    }
  ]

  const handleTestAddWidget = () => {
    addWidget({
      type: 'stats',
      title: 'Test Widget',
      position: { x: 0, y: 0 },
      size: { width: 2, height: 1 },
      visible: true
    })
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Info className="h-5 w-5" />
          <span>Dashboard System Test</span>
        </CardTitle>
        <CardDescription>
          Test the dashboard functionality and widget system
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Test Results */}
        <div>
          <h3 className="text-lg font-semibold mb-3">System Tests</h3>
          <div className="space-y-2">
            {testResults.map((test, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 rounded-lg border">
                <CheckCircle 
                  className={`h-4 w-4 ${test.passed ? 'text-green-500' : 'text-red-500'}`} 
                />
                <div className="flex-1">
                  <div className="font-medium">{test.name}</div>
                  <div className="text-sm text-muted-foreground">{test.description}</div>
                </div>
                <div className={`text-sm font-medium ${test.passed ? 'text-green-500' : 'text-red-500'}`}>
                  {test.passed ? 'PASS' : 'FAIL'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard State */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Dashboard State</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-muted-foreground">Total Widgets</div>
              <div className="text-2xl font-bold">{widgets.length}</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-muted-foreground">Visible Widgets</div>
              <div className="text-2xl font-bold">{visibleWidgets.length}</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-muted-foreground">Hidden Widgets</div>
              <div className="text-2xl font-bold">{hiddenWidgets.length}</div>
            </div>
          </div>
        </div>

        {/* Layout Configuration */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Layout Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-muted-foreground">Columns</div>
              <div className="text-2xl font-bold">{layout.columns}</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-muted-foreground">Gap (px)</div>
              <div className="text-2xl font-bold">{layout.gap}</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-muted-foreground">Padding (px)</div>
              <div className="text-2xl font-bold">{layout.containerPadding}</div>
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Test Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setEditing(!isEditing)}
              variant={isEditing ? 'default' : 'outline'}
            >
              {isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'}
            </Button>
            <Button onClick={handleTestAddWidget} variant="outline">
              Add Test Widget
            </Button>
            <Button onClick={resetLayout} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Layout
            </Button>
          </div>
        </div>

        {/* Widget List */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Widget List</h3>
          <div className="space-y-2">
            {widgets.map((widget) => (
              <div key={widget.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div>
                  <div className="font-medium">{widget.title}</div>
                  <div className="text-sm text-muted-foreground">
                    Type: {widget.type} | Size: {widget.size.width}x{widget.size.height}
                  </div>
                </div>
                <div className={`text-sm font-medium ${widget.visible ? 'text-green-500' : 'text-red-500'}`}>
                  {widget.visible ? 'Visible' : 'Hidden'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}