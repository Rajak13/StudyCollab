import { DashboardLayout } from '@/components/layout'

export default function ResourcesPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Resources</h1>
          <p className="text-muted-foreground">
            Access study materials, documents, and learning resources
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Resources Coming Soon</h2>
          <p className="text-muted-foreground">
            This feature is under development. You&apos;ll be able to manage and share study resources here.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}