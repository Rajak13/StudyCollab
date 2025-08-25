'use client'

import { useElectronFeatures } from '@/hooks/useElectronFeatures'
import { useElectron } from './ElectronProvider'

export const ElectronTest: React.FC = () => {
  const { isElectron, isReady } = useElectron()
  const { getAppVersion, showNotification } = useElectronFeatures()

  if (!isReady) {
    return <div>Loading Electron detection...</div>
  }

  const handleTestNotification = () => {
    showNotification('Test Notification', 'This is a test notification from StudyCollab!')
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">Electron Integration Status</h3>
      <div className="space-y-2">
        <p>
          <strong>Environment:</strong> {isElectron ? 'Electron Desktop App' : 'Web Browser'}
        </p>
        <p>
          <strong>App Version:</strong> {getAppVersion()}
        </p>
        <p>
          <strong>Node Environment:</strong> {process.env.NODE_ENV}
        </p>
        <p>
          <strong>Electron Build:</strong> {process.env.NEXT_PUBLIC_ELECTRON === 'true' ? 'Yes' : 'No'}
        </p>
        
        {isElectron && (
          <div className="mt-4">
            <button
              onClick={handleTestNotification}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Desktop Notification
            </button>
          </div>
        )}
      </div>
    </div>
  )
}