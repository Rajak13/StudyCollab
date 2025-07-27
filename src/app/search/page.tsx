import { DashboardLayout } from '@/components/layout'

export default function SearchPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Search</h1>
          <p className="text-muted-foreground">
            Search through your notes, tasks, and study materials
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Search Coming Soon</h2>
          <p className="text-muted-foreground">
            This feature is under development. You&apos;ll be able to search across all your content here.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}