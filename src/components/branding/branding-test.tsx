/**
 * Branding Test Component
 * Simple component to test branding functionality
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppName, useBranding, useLogo } from '@/hooks/use-branding'
import { LogoDisplay } from './logo-display'

export function BrandingTest() {
  const { appName, loading: appNameLoading } = useAppName()
  const { logoPath: navbarLogo, loading: logoLoading } = useLogo('navbar')
  const { config, loading: configLoading, updateBranding, updateLogos } = useBranding()

  const handleTestUpdate = async () => {
    try {
      await updateBranding({
        appName: 'Test StudyCollab',
        windowTitle: 'Test StudyCollab - Updated Title',
        description: 'This is a test update'
      })
      
      await updateLogos({
        navbar: '/test-logo.png'
      })
      
      alert('Branding updated successfully!')
    } catch (error) {
      alert('Failed to update branding: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleReset = async () => {
    try {
      await updateBranding({
        appName: 'StudyCollab',
        windowTitle: 'StudyCollab - Collaborative Study Platform',
        description: 'A comprehensive study platform for students'
      })
      
      await updateLogos({
        navbar: '/logo.png'
      })
      
      alert('Branding reset successfully!')
    } catch (error) {
      alert('Failed to reset branding: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  if (configLoading || appNameLoading || logoLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branding Test</CardTitle>
          <CardDescription>Loading branding configuration...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding Test</CardTitle>
        <CardDescription>
          Test the branding configuration system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Current Configuration</h3>
            <div className="space-y-2 text-sm">
              <div><strong>App Name:</strong> {appName}</div>
              <div><strong>Window Title:</strong> {config?.windowTitle}</div>
              <div><strong>Description:</strong> {config?.description}</div>
              <div><strong>Navbar Logo:</strong> {navbarLogo}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Logo Preview</h3>
            <div className="flex items-center space-x-2 p-4 border rounded">
              <LogoDisplay
                type="navbar"
                width={32}
                height={32}
                className="rounded"
              />
              <span className="font-medium">{appName}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button onClick={handleTestUpdate}>
            Test Update
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
        </div>

        {config && (
          <div className="mt-4 p-4 bg-muted rounded text-sm">
            <h4 className="font-semibold mb-2">Full Configuration:</h4>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}