'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { FileManager } from '@/components/files/file-manager'

export default function FilesPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <FileManager />
      </div>
    </ProtectedRoute>
  )
}
