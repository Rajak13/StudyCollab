'use client'

import { FileManager } from '@/components/files/file-manager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestFilesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>File Storage System Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-gray-600">
            This page tests the file storage and management system
            implementation.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>File upload with progress indicators</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>File organization with folders</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>File preview functionality</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>Secure file sharing with permissions</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>Download tracking and analytics</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <FileManager />
    </div>
  )
}
