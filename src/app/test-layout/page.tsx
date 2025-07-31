'use client'

import { DashboardLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestLayoutPage() {
  const mockUser = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: undefined,
  }

  return (
    <DashboardLayout user={mockUser}>
      <div className="container mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Layout Test Page</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Bottom Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The bottom navigation should now be visible on all devices, not
                just mobile.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sidebar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The sidebar should only be visible on desktop (lg screens and
                above).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Header</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The header should have a profile dropdown with user details and
                logout button.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Theme Toggle</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The theme toggle now supports Light, Dark, Educational, and
                Nepali themes.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border border-primary/20 bg-primary/10 p-2">
                  <span className="font-medium">Light Theme</span>
                  <div className="text-xs text-muted-foreground">
                    Clean & Modern
                  </div>
                </div>
                <div className="rounded border border-red-500/20 bg-red-500/10 p-2">
                  <span className="font-medium">🇳🇵 Dark Theme</span>
                  <div className="text-xs text-muted-foreground">
                    Crimson & Black
                  </div>
                </div>
                <div className="rounded border border-green-500/20 bg-green-500/10 p-2">
                  <span className="font-medium">Educational Theme</span>
                  <div className="text-xs text-muted-foreground">
                    Study Focused
                  </div>
                </div>
                <div className="rounded border border-red-600/20 bg-red-600/10 p-2">
                  <span className="font-medium">🇳🇵 Nepali Theme</span>
                  <div className="text-xs text-muted-foreground">
                    Flag Colors
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Educational Theme</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This card demonstrates the educational theme colors optimized
                for studying.
              </p>
              <Button className="mt-2">Highlight Button</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Responsive Design</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Test the layout on different screen sizes to see the responsive
                behavior.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
