/**
 * Branding Configuration Panel
 * Allows developers to configure custom logos and branding
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { useBranding } from '@/hooks/use-branding'
import { BrandingConfig } from '@/lib/branding'
import { RotateCcw, Save } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface BrandingConfigPanelProps {
  className?: string
}

export function BrandingConfigPanel({ className }: BrandingConfigPanelProps) {
  const {
    config,
    loading,
    error,
    isClient,
    updateConfig,
    resetToDefaults,
    fixPaths
  } = useBranding()

  const { toast } = useToast()

  const [localConfig, setLocalConfig] = useState<BrandingConfig>(config)
  const [hasChanges, setHasChanges] = useState(false)

  // Update local config when main config changes
  useEffect(() => {
    setLocalConfig(config)
    setHasChanges(false)
  }, [config])

  // Handle text input changes
  const handleInputChange = useCallback((field: keyof BrandingConfig, value: string) => {
    const updatedConfig = {
      ...localConfig,
      [field]: value
    }
    setLocalConfig(updatedConfig)
    setHasChanges(true)
  }, [localConfig])

  // Handle asset path changes
  const handleAssetChange = useCallback((type: keyof BrandingConfig['assets'], value: string) => {
    const updatedConfig = {
      ...localConfig,
      assets: {
        ...localConfig.assets,
        [type]: value
      }
    }
    setLocalConfig(updatedConfig)
    setHasChanges(true)
  }, [localConfig])

  // Handle theme color changes
  const handleThemeChange = useCallback((field: keyof BrandingConfig['theme'], value: string) => {
    const updatedConfig = {
      ...localConfig,
      theme: {
        ...localConfig.theme,
        [field]: value
      }
    }
    setLocalConfig(updatedConfig)
    setHasChanges(true)
  }, [localConfig])

  // Save changes
  const handleSave = useCallback(async () => {
    try {
      await updateConfig(localConfig)
      setHasChanges(false)
      toast({
        title: 'Configuration saved',
        description: 'Branding configuration has been updated successfully.',
      })
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save configuration',
        variant: 'destructive',
      })
    }
  }, [localConfig, updateConfig, toast])

  // Reset to defaults
  const handleReset = useCallback(async () => {
    try {
      await resetToDefaults()
      toast({
        title: 'Reset successful',
        description: 'Branding configuration has been reset to defaults.',
      })
    } catch (error) {
      toast({
        title: 'Reset failed',
        description: error instanceof Error ? error.message : 'Failed to reset configuration',
        variant: 'destructive',
      })
    }
  }, [resetToDefaults, toast])

  // Fix incorrect paths
  const handleFixPaths = useCallback(async () => {
    try {
      const wasFixed = await fixPaths()
      if (wasFixed) {
        toast({
          title: 'Paths fixed',
          description: 'Incorrect logo paths have been corrected.',
        })
      } else {
        toast({
          title: 'No issues found',
          description: 'All logo paths are already correct.',
        })
      }
    } catch (error) {
      toast({
        title: 'Fix failed',
        description: error instanceof Error ? error.message : 'Failed to fix paths',
        variant: 'destructive',
      })
    }
  }, [fixPaths, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading branding configuration...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Configuration Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Branding Configuration</h2>
          <p className="text-muted-foreground">
            Customize logos, app name, and branding elements for your StudyCollab instance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/branding/preview">
              Preview Logos
            </Link>
          </Button>
          <Button variant="outline" onClick={handleFixPaths} size="sm">
            Fix Paths
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="logos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logos">Logos & Assets</TabsTrigger>
          <TabsTrigger value="branding">App Branding</TabsTrigger>
          <TabsTrigger value="theme">Theme Colors</TabsTrigger>
        </TabsList>

        <TabsContent value="logos" className="space-y-6">
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h3 className="font-semibold mb-2">How to add your custom images:</h3>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Place your image files in the <code className="bg-muted px-1 rounded">studycollab-mvp/public</code> folder</li>
              <li>2. Update the paths below to point to your images (e.g., <code className="bg-muted px-1 rounded">/my-logo.png</code>)</li>
              <li>3. Click "Save Changes" to apply your branding</li>
            </ol>
            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950 rounded border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> If you're getting 404 errors for your images, click the "Fix Paths" button above to correct any incorrect file paths.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(localConfig.assets).map(([type, path]) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="capitalize">{type} Logo</CardTitle>
                  <CardDescription>
                    {type === 'navbar' && 'Logo displayed in the navigation bar'}
                    {type === 'window' && 'Icon used for the desktop application window'}
                    {type === 'tray' && 'Icon displayed in the system tray'}
                    {type === 'splash' && 'Logo shown on the splash screen'}
                    {type === 'favicon' && 'Website favicon'}
                    {type === 'hero' && 'Hero section background image'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {isClient && path ? (
                      <Image
                        src={path}
                        alt={`${type} logo`}
                        width={150}
                        height={150}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <div className={`text-muted-foreground text-sm text-center ${isClient && path ? 'hidden' : ''}`}>
                      {!isClient ? 'Loading...' : path ? 'Image not found' : 'No logo set'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${type}-path`}>Image Path</Label>
                    <Input
                      id={`${type}-path`}
                      value={path}
                      onChange={(e) => handleAssetChange(type as keyof BrandingConfig['assets'], e.target.value)}
                      placeholder={`/my-${type}-logo.png`}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Name</CardTitle>
                <CardDescription>
                  The name displayed throughout the application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={localConfig.appName}
                  onChange={(e) => handleInputChange('appName', e.target.value)}
                  placeholder="StudyCollab"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Window Title</CardTitle>
                <CardDescription>
                  The title shown in the browser tab or desktop window
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={localConfig.windowTitle}
                  onChange={(e) => handleInputChange('windowTitle', e.target.value)}
                  placeholder="StudyCollab - Collaborative Study Platform"
                />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Description</CardTitle>
                <CardDescription>
                  A brief description of your StudyCollab instance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={localConfig.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="A comprehensive study platform for students"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Primary Color</CardTitle>
                <CardDescription>
                  Main brand color used throughout the interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={localConfig.theme.primaryColor}
                    onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                    className="w-12 h-12 rounded border"
                  />
                  <Input
                    value={localConfig.theme.primaryColor}
                    onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                    placeholder="#3b82f6"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accent Color</CardTitle>
                <CardDescription>
                  Secondary color for highlights and accents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={localConfig.theme.accentColor}
                    onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                    className="w-12 h-12 rounded border"
                  />
                  <Input
                    value={localConfig.theme.accentColor}
                    onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                    placeholder="#3b82f6"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Background Color</CardTitle>
                <CardDescription>
                  Default background color for the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={localConfig.theme.backgroundColor}
                    onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                    className="w-12 h-12 rounded border"
                  />
                  <Input
                    value={localConfig.theme.backgroundColor}
                    onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}