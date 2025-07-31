'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { formatFileSize } from '@/lib/file-upload'
import {
  AlertCircle,
  Archive,
  Download,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Lock,
  Music,
  Video,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface SharedFilePageProps {
  params: Promise<{ token: string }>
}

interface ShareData {
  id: string
  share_token: string
  expires_at: string | null
  max_downloads: number | null
  download_count: number
  requires_password: boolean
  file: {
    id: string
    name: string
    original_name: string
    file_size: number
    mime_type: string
    file_type: string
    description: string | null
    created_at: string
    user: {
      id: string
      name: string
    }
  }
}

export default function SharedFilePage({ params }: SharedFilePageProps) {
  const [token, setToken] = useState<string | null>(null)
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    params.then(({ token }) => {
      setToken(token)
    })
  }, [params])

  useEffect(() => {
    if (token) {
      fetchShareData()
    }
  }, [token])

  const fetchShareData = async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch(`/api/file-shares/${token}`)

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Share not found')
        return
      }

      const data = await response.json()
      setShareData(data.data)
      setIsAuthenticated(!data.data.requires_password)
    } catch (error) {
      setError('Failed to load share')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    try {
      const response = await fetch(`/api/file-shares/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast({
          title: 'Error',
          description: errorData.error || 'Invalid password',
          variant: 'destructive',
        })
        return
      }

      setIsAuthenticated(true)
      toast({
        title: 'Success',
        description: 'Access granted',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify password',
        variant: 'destructive',
      })
    }
  }

  const handleDownload = async () => {
    if (!shareData) return

    try {
      setDownloading(true)
      const response = await fetch(
        `/api/files/${shareData.file.id}/download?token=${token}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        toast({
          title: 'Error',
          description: errorData.error || 'Download failed',
          variant: 'destructive',
        })
        return
      }

      const data = await response.json()

      // Trigger download
      const link = document.createElement('a')
      link.href = data.download_url
      link.download = data.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Refresh share data to update download count
      fetchShareData()

      toast({
        title: 'Success',
        description: 'Download started',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Download failed',
        variant: 'destructive',
      })
    } finally {
      setDownloading(false)
    }
  }

  const getFileIconComponent = (fileType: string) => {
    switch (fileType) {
      case 'PDF':
        return <FileText className="h-8 w-8" />
      case 'IMAGE':
        return <ImageIcon className="h-8 w-8" />
      case 'VIDEO':
        return <Video className="h-8 w-8" />
      case 'AUDIO':
        return <Music className="h-8 w-8" />
      case 'ARCHIVE':
        return <Archive className="h-8 w-8" />
      default:
        return <FileIcon className="h-8 w-8" />
    }
  }

  const isExpired = () => {
    if (!shareData?.expires_at) return false
    return new Date(shareData.expires_at) < new Date()
  }

  const isDownloadLimitReached = () => {
    if (!shareData?.max_downloads) return false
    return shareData.download_count >= shareData.max_downloads
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p>Loading shared file...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Access Denied</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!shareData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Share Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">The shared file could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isExpired()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Link Expired</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              This share link has expired on{' '}
              {new Date(shareData.expires_at!).toLocaleDateString()}.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Password Required</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">
                  Enter password to access this file
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Access File
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="text-primary">
                {getFileIconComponent(shareData.file.file_type)}
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">{shareData.file.name}</CardTitle>
                <p className="text-gray-500">
                  Shared by {shareData.file.user.name} •{' '}
                  {formatFileSize(shareData.file.file_size)}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* File Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">File Type:</span>
                <p className="font-medium">{shareData.file.file_type}</p>
              </div>
              <div>
                <span className="text-gray-500">Size:</span>
                <p className="font-medium">
                  {formatFileSize(shareData.file.file_size)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Uploaded:</span>
                <p className="font-medium">
                  {new Date(shareData.file.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Downloads:</span>
                <p className="font-medium">
                  {shareData.download_count}
                  {shareData.max_downloads && ` / ${shareData.max_downloads}`}
                </p>
              </div>
            </div>

            {shareData.file.description && (
              <div>
                <h3 className="mb-2 font-medium">Description</h3>
                <p className="text-gray-600">{shareData.file.description}</p>
              </div>
            )}

            {/* Share Info */}
            <div className="flex flex-wrap gap-2">
              {shareData.expires_at && (
                <Badge variant="outline">
                  Expires: {new Date(shareData.expires_at).toLocaleDateString()}
                </Badge>
              )}
              {shareData.max_downloads && (
                <Badge variant="outline">
                  Download limit: {shareData.max_downloads}
                </Badge>
              )}
            </div>

            {/* Download Button */}
            <div className="flex space-x-2">
              <Button
                onClick={handleDownload}
                disabled={downloading || isDownloadLimitReached()}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                {downloading ? 'Downloading...' : 'Download File'}
              </Button>
            </div>

            {isDownloadLimitReached() && (
              <div className="flex items-center space-x-2 rounded-lg bg-amber-50 p-3 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">
                  Download limit has been reached for this file.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by StudyCollab</p>
        </div>
      </div>
    </div>
  )
}
