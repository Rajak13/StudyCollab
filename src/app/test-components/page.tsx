'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardLoading, Loading } from '@/components/ui/loading'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'

export default function TestComponentsPage() {
  return (
    <div className="container mx-auto space-y-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Component Test Page</h1>
        <ThemeToggle />
      </div>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>Different button variants and sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Components */}
      <Card>
        <CardHeader>
          <CardTitle>Form Components</CardTitle>
          <CardDescription>Input fields and form elements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" placeholder="Enter your message" />
          </div>
        </CardContent>
      </Card>

      {/* Loading States */}
      <Card>
        <CardHeader>
          <CardTitle>Loading States</CardTitle>
          <CardDescription>Different loading indicators</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium">Spinner Small</p>
              <Spinner size="sm" />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium">Spinner Default</p>
              <Spinner />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium">Spinner Large</p>
              <Spinner size="lg" />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium">Spinner XL</p>
              <Spinner size="xl" />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="text-sm font-medium">Loading Component Variants</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Spinner</p>
                <Loading variant="spinner" text="Loading..." />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Dots</p>
                <Loading variant="dots" />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Skeleton</p>
                <Loading variant="skeleton" />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="text-sm font-medium">Skeleton Components</p>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty States */}
      <Card>
        <CardHeader>
          <CardTitle>Empty States</CardTitle>
          <CardDescription>Empty state components</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No items found"
            description="There are no items to display at the moment."
            action={{
              label: 'Add Item',
              onClick: () => alert('Add item clicked!'),
            }}
          />
        </CardContent>
      </Card>

      {/* Card Loading */}
      <Card>
        <CardHeader>
          <CardTitle>Card Loading State</CardTitle>
          <CardDescription>Loading state for card content</CardDescription>
        </CardHeader>
        <CardLoading />
      </Card>
    </div>
  )
}
