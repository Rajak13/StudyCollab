'use client'

import { TaskManager } from '@/components/tasks/task-manager'

export default function TestTaskAdvancedPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Task Management - Advanced Features Test
          </h1>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Advanced Features Implemented:
            </h2>
            <ul className="text-blue-800 dark:text-blue-200 space-y-1">
              <li>✅ Calendar view for tasks with due date visualization</li>
              <li>✅ Task statistics and progress tracking dashboard</li>
              <li>✅ Task priority and status management with visual indicators</li>
              <li>✅ Bulk task operations (update, delete, complete)</li>
              <li>✅ Keyboard shortcuts for power users</li>
              <li>✅ Enhanced visual indicators and progress bars</li>
              <li>✅ Improved calendar with completion rates</li>
            </ul>
          </div>
          
          <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
              Keyboard Shortcuts:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-green-800 dark:text-green-200 text-sm">
              <div>• <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Ctrl+N</kbd> - Create new task</div>
              <div>• <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Ctrl+V</kbd> - Toggle view mode</div>
              <div>• <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Ctrl+A</kbd> - Select all tasks</div>
              <div>• <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Ctrl+S</kbd> - Show statistics</div>
              <div>• <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Ctrl+C</kbd> - Manage categories</div>
              <div>• <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Ctrl+Enter</kbd> - Complete selected</div>
              <div>• <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Delete</kbd> - Delete selected</div>
              <div>• <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Shift+?</kbd> - Show help</div>
            </div>
          </div>
        </div>
        
        <TaskManager />
      </div>
    </div>
  )
}