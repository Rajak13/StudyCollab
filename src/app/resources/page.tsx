import { DashboardLayout } from '@/components/layout'
import { ResourceList } from '@/components/resources'

export default function ResourcesPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <ResourceList />
      </div>
    </DashboardLayout>
  )
}
