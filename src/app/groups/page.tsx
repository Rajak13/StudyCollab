import { DashboardLayout } from '@/components/layout'

export default function StudyGroupsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Study Groups</h1>
          <p className="text-muted-foreground">
            Join and manage your study groups and collaborative sessions
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Study Groups Coming Soon</h2>
          <p className="text-muted-foreground">
            This feature is under development. You&apos;ll be able to create and join study groups here.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}