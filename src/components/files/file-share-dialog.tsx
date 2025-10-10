'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { useCreateFileShare, useFileShares } from '@/hooks/use-files'
import { FileRecord, FileShare } from '@/types/database'
import { Copy, Download, ExternalLink, Lock, Share, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface FileShareDialogProps {
  file: FileRecord
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FileShareDialog({
  file,
  open,
  onOpenChange,
}: FileShareDialogProps) {
  const [expiresAt, setExpiresAt] = useState('')
  const [password, setPassword] = useState('')
  const [maxDownloads, setMaxDownloads] = useState('')
  const [usePassword, setUsePassword] = useState(false)
  const [useExpiry, setUseExpiry] = useState(false)
  const [useDownloadLimit, setUseDownloadLimit] = useState(false)

  const createShareMutation = useCreateFileShare()
  const { data: sharesData, refetch: refetchShares } = useFileShares(file.id)

  const shares = sharesData?.data || []

  const handleCreateShare = async () => {
    const shareData: {
      expires_at?: string
      password?: string
      max_downloads?: number
    } = {}

    if (useExpiry && expiresAt) {
      shareData.expires_at = new Date(expiresAt).toISOString()
    }

    if (usePassword && password) {
      shareData.password = password
    }

    if (useDownloadLimit && maxDownloads) {
      shareData.max_downloads = parseInt(maxDownloads)
    }

    try {
      await createShareMutation.mutateAsync({
        fileId: file.id,
        shareData,
      })

      // Reset form
      setExpiresAt('')
      setPassword('')
      setMaxDownloads('')
      setUsePassword(false)
      setUseExpiry(false)
      setUseDownloadLimit(false)

      refetchShares()
    } catch {
      // Error handling is done in the mutation
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: 'Copied!',
        description: 'Share link copied to clipboard',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isExpired = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 5) // Minimum 5 minutes from now
    return now.toISOString().slice(0, 16)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share className="h-5 w-5" />
            <span>Share &quot;{file.name}&quot;</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Share</TabsTrigger>
            <TabsTrigger value="existing">
              Existing Shares ({shares.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Password Protection</Label>
                  <p className="text-sm text-gray-500">
                    Require a password to access the file
                  </p>
                </div>
                <Switch
                  checked={usePassword}
                  onCheckedChange={setUsePassword}
                />
              </div>

              {usePassword && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label>Expiration Date</Label>
                  <p className="text-sm text-gray-500">
                    Set when the share link expires
                  </p>
                </div>
                <Switch checked={useExpiry} onCheckedChange={setUseExpiry} />
              </div>

              {useExpiry && (
                <div>
                  <Label htmlFor="expires-at">Expires At</Label>
                  <Input
                    id="expires-at"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={getMinDateTime()}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label>Download Limit</Label>
                  <p className="text-sm text-gray-500">
                    Limit the number of downloads
                  </p>
                </div>
                <Switch
                  checked={useDownloadLimit}
                  onCheckedChange={setUseDownloadLimit}
                />
              </div>

              {useDownloadLimit && (
                <div>
                  <Label htmlFor="max-downloads">Maximum Downloads</Label>
                  <Input
                    id="max-downloads"
                    type="number"
                    min="1"
                    max="1000"
                    value={maxDownloads}
                    onChange={(e) => setMaxDownloads(e.target.value)}
                    placeholder="Enter maximum downloads"
                  />
                </div>
              )}
            </div>

            <Button
              onClick={handleCreateShare}
              disabled={createShareMutation.isPending}
              className="w-full"
            >
              {createShareMutation.isPending
                ? 'Creating...'
                : 'Create Share Link'}
            </Button>
          </TabsContent>

          <TabsContent value="existing" className="space-y-4">
            {shares.length === 0 ? (
              <div className="py-8 text-center">
                <Share className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium">No shares yet</h3>
                <p className="text-gray-500">
                  Create your first share link to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {shares.map((share: FileShare) => (
                  <Card
                    key={share.id}
                    className={isExpired(share.expires_at) ? 'opacity-60' : ''}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              isExpired(share.expires_at)
                                ? 'destructive'
                                : 'default'
                            }
                          >
                            {isExpired(share.expires_at) ? 'Expired' : 'Active'}
                          </Badge>
                          {share.password_hash && (
                            <Badge variant="outline">
                              <Lock className="mr-1 h-3 w-3" />
                              Password
                            </Badge>
                          )}
                          {share.max_downloads && (
                            <Badge variant="outline">
                              <Download className="mr-1 h-3 w-3" />
                              {share.download_count}/{share.max_downloads}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Input
                          value={`${window.location.origin}/files/shared/${share.share_token}`}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              `${window.location.origin}/files/shared/${share.share_token}`
                            )
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `${window.location.origin}/files/shared/${share.share_token}`,
                              '_blank'
                            )
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Created:</span>
                          <br />
                          {formatDate(share.created_at)}
                        </div>
                        {share.expires_at && (
                          <div>
                            <span className="font-medium">Expires:</span>
                            <br />
                            {formatDate(share.expires_at)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          Downloads: {share.download_count}
                          {share.max_downloads && ` / ${share.max_downloads}`}
                        </span>
                        <span className="text-gray-500">
                          Token: {share.share_token.slice(0, 8)}...
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
