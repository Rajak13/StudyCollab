'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { useDesktopFileHandling } from '@/hooks/use-desktop-file-handling'
import {
    CheckCircle,
    ExternalLink,
    FileText,
    Link,
    Settings,
    XCircle
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface FileAssociation {
  extension: string
  description: string
  mimeType: string
  registered: boolean
}

export function FileAssociationManager() {
  const [isOpen, setIsOpen] = useState(false)
  const [associations, setAssociations] = useState<FileAssociation[]>([])
  const [isRegistering, setIsRegistering] = useState(false)
  const [protocolRegistered, setProtocolRegistered] = useState(false)

  const { isElectron, registerFileAssociations } = useDesktopFileHandling()

  // Default file associations for StudyCollab
  const defaultAssociations: FileAssociation[] = [
    {
      extension: '.study',
      description: 'StudyCollab Document',
      mimeType: 'application/x-studycollab',
      registered: false
    },
    {
      extension: '.studygroup',
      description: 'StudyCollab Group File',
      mimeType: 'application/x-studycollab-group',
      registered: false
    },
    {
      extension: '.studynotes',
      description: 'StudyCollab Notes',
      mimeType: 'application/x-studycollab-notes',
      registered: false
    }
  ]

  // Check current registration status
  useEffect(() => {
    if (isElectron && isOpen) {
      checkRegistrationStatus()
    }
  }, [isElectron, isOpen])

  const checkRegistrationStatus = useCallback(async () => {
    if (!isElectron || !window.desktopAPI) return

    try {
      // Check if protocol is registered
      const appInfo = await window.desktopAPI.getAppInfo()
      setProtocolRegistered(appInfo.success)

      // For now, we'll assume file associations follow protocol registration
      // In a real implementation, you'd check each file association individually
      const updatedAssociations = defaultAssociations.map(assoc => ({
        ...assoc,
        registered: appInfo.success
      }))
      
      setAssociations(updatedAssociations)
    } catch (error) {
      console.error('Failed to check registration status:', error)
      setAssociations(defaultAssociations)
    }
  }, [isElectron])

  const handleRegisterAssociations = useCallback(async () => {
    if (!isElectron || !registerFileAssociations) return

    setIsRegistering(true)
    
    try {
      const success = await registerFileAssociations()
      
      if (success) {
        toast({
          title: 'Success',
          description: 'File associations registered successfully'
        })
        
        // Update status
        setProtocolRegistered(true)
        setAssociations(prev => prev.map(assoc => ({ ...assoc, registered: true })))
      } else {
        toast({
          title: 'Partial Success',
          description: 'Some file associations may not have been registered. Check system permissions.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Register associations error:', error)
      toast({
        title: 'Error',
        description: 'Failed to register file associations',
        variant: 'destructive'
      })
    } finally {
      setIsRegistering(false)
    }
  }, [isElectron, registerFileAssociations])

  const handleOpenSystemSettings = useCallback(() => {
    if (!isElectron) return

    // Open system default apps settings
    const platform = navigator.platform.toLowerCase()
    
    if (platform.includes('win')) {
      // Windows: Open default apps settings
      window.open('ms-settings:defaultapps')
    } else if (platform.includes('mac')) {
      // macOS: Open default apps in System Preferences
      // Note: This would need to be implemented in the main process
      toast({
        title: 'Manual Setup Required',
        description: 'Please open System Preferences > General > Default web browser to set file associations',
      })
    } else {
      // Linux: Varies by desktop environment
      toast({
        title: 'Manual Setup Required',
        description: 'Please check your desktop environment settings for file associations',
      })
    }
  }, [isElectron])

  const getStatusIcon = (registered: boolean) => {
    return registered ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusBadge = (registered: boolean) => {
    return (
      <Badge variant={registered ? 'default' : 'destructive'}>
        {registered ? 'Registered' : 'Not Registered'}
      </Badge>
    )
  }

  if (!isElectron) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled>
            <Link className="mr-2 h-4 w-4" />
            File Associations
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File Associations</DialogTitle>
            <DialogDescription>
              File associations are only available in the desktop application.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Link className="mr-2 h-4 w-4" />
          File Associations
          <Badge variant="secondary" className="ml-2">
            Desktop
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            File Associations Manager
          </DialogTitle>
          <DialogDescription>
            Manage file associations and protocol handlers for StudyCollab
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Protocol Registration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Protocol Handler
              </CardTitle>
              <CardDescription>
                Allows StudyCollab to handle studycollab:// URLs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(protocolRegistered)}
                  <span className="font-medium">studycollab://</span>
                  {getStatusBadge(protocolRegistered)}
                </div>
                
                {protocolRegistered && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Test protocol handler
                      window.open('studycollab://test')
                    }}
                  >
                    Test
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* File Associations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                File Extensions
              </CardTitle>
              <CardDescription>
                File types that will open with StudyCollab
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {associations.map((assoc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(assoc.registered)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{assoc.extension}</span>
                          {getStatusBadge(assoc.registered)}
                        </div>
                        <p className="text-sm text-gray-600">{assoc.description}</p>
                        <p className="text-xs text-gray-400">{assoc.mimeType}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-4">
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Registration Actions</Label>
                <p className="text-sm text-gray-600">
                  Register StudyCollab as the default handler for supported file types
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleOpenSystemSettings}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  System Settings
                </Button>
                
                <Button
                  onClick={handleRegisterAssociations}
                  disabled={isRegistering}
                >
                  {isRegistering ? 'Registering...' : 'Register All'}
                </Button>
              </div>
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Protocol handler allows opening studycollab:// links</li>
                <li>• File associations let you double-click .study files to open them</li>
                <li>• Some systems may require administrator permissions</li>
                <li>• Changes take effect immediately for new files</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}