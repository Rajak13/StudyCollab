/**
 * Branding Configuration Page
 * Allows developers to configure custom logos and branding
 * This page is publicly accessible for development purposes
 */

'use client'

import { BrandingConfigPanel } from '@/components/branding/branding-config-panel'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function BrandingConfigPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold">Developer Branding Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Customize the logos, colors, and branding of your StudyCollab instance
          </p>
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              🎨 Developer Mode
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              This page is accessible to developers for customizing the application branding. 
              Changes are saved locally and will persist across sessions.
            </p>
          </div>
        </div>

        <BrandingConfigPanel />
      </div>
    </div>
  )
}