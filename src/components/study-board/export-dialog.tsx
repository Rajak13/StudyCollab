'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { CanvasExporter, ExportOptions, ExportProgress } from '@/lib/canvas-export'
import { useStudyBoardStore } from '@/lib/stores/study-board-store'
import Konva from 'konva'
import { Download, FileImage, FileText, Image, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface ExportDialogProps {
  stage: Konva.Stage | null
  className?: string
}

const formatIcons = {
  png: Image,
  jpg: Image,
  pdf: FileText,
  svg: FileImage,
}

const formatDescriptions = {
  png: 'High quality raster image with transparency support',
  jpg: 'Compressed raster image, smaller file size',
  pdf: 'Vector-based document format, perfect for printing',
  svg: 'Scalable vector graphics, editable and web-friendly',
}

export function ExportDialog({ stage, className = '' }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null)
  const [format, setFormat] = useState<'png' | 'jpg' | 'pdf' | 'svg'>('png')
  const [quality, setQuality] = useState(0.9)
  const [multiplier, setMultiplier] = useState(2)
  const [filename, setFilename] = useState('')
  const [includeBackground, setIncludeBackground] = useState(true)
  const [selectedOnly, setSelectedOnly] = useState(false)
  
  const { elements } = useStudyBoardStore()

  const handleExport = async () => {
    if (!stage) return

    setIsExporting(true)
    setExportProgress(null)

    const options: ExportOptions = {
      format,
      quality,
      multiplier,
      filename: filename || undefined,
      includeBackground,
      selectedOnly,
      elements,
    }

    try {
      await CanvasExporter.exportCanvas(stage, options, (progress) => {
        setExportProgress(progress)
      })
      
      // Close dialog after successful export
      setTimeout(() => {
        setIsOpen(false)
        setIsExporting(false)
        setExportProgress(null)
      }, 1000)
    } catch (error) {
      console.error('Export failed:', error)
      setIsExporting(false)
      setExportProgress(null)
    }
  }

  const getQualityLabel = () => {
    if (quality >= 0.9) return 'High'
    if (quality >= 0.7) return 'Medium'
    return 'Low'
  }

  const getResolutionLabel = () => {
    if (multiplier >= 3) return 'Ultra High (3x)'
    if (multiplier >= 2) return 'High (2x)'
    if (multiplier >= 1.5) return 'Medium (1.5x)'
    return 'Standard (1x)'
  }

  const selectedElements = elements.filter(el => 
    stage?.findOne(`#${el.id}`)?.hasName('selected')
  )

  const FormatIcon = formatIcons[format]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={`${className} text-xs lg:text-sm`}>
          <Download className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
          <span className="hidden sm:inline">Export</span>
          <span className="sm:hidden">Exp</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export Canvas</span>
          </DialogTitle>
        </DialogHeader>
        
        {isExporting ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {exportProgress?.message || 'Preparing export...'}
                </div>
                <Progress 
                  value={exportProgress?.progress || 0} 
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label>Export Format</Label>
              <Select value={format} onValueChange={(value: any) => setFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(formatIcons).map(([fmt, Icon]) => (
                    <SelectItem key={fmt} value={fmt}>
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span className="uppercase">{fmt}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-600 flex items-start space-x-2">
                <FormatIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{formatDescriptions[format]}</span>
              </div>
            </div>

            {/* Filename */}
            <div className="space-y-2">
              <Label htmlFor="filename">Filename (optional)</Label>
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder={`study-board-${Date.now()}.${format}`}
              />
            </div>

            {/* Quality Settings */}
            {(format === 'jpg' || format === 'png') && (
              <div className="space-y-3">
                <Label>Image Quality: {getQualityLabel()}</Label>
                <div className="px-3">
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
            )}

            {/* Resolution Settings */}
            {(format === 'png' || format === 'jpg' || format === 'pdf') && (
              <div className="space-y-3">
                <Label>Resolution: {getResolutionLabel()}</Label>
                <div className="px-3">
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.5"
                    value={multiplier}
                    onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1x</span>
                    <span>4x</span>
                  </div>
                </div>
              </div>
            )}

            {/* Export Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Background</Label>
                  <div className="text-xs text-gray-600">
                    Export with white background
                  </div>
                </div>
                <Switch
                  checked={includeBackground}
                  onCheckedChange={setIncludeBackground}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Selected Elements Only</Label>
                  <div className="text-xs text-gray-600">
                    {selectedElements.length > 0 
                      ? `Export ${selectedElements.length} selected elements`
                      : 'No elements selected'
                    }
                  </div>
                </div>
                <Switch
                  checked={selectedOnly}
                  onCheckedChange={setSelectedOnly}
                  disabled={selectedElements.length === 0}
                />
              </div>
            </div>

            {/* Export Button */}
            <div className="flex space-x-2">
              <Button
                onClick={handleExport}
                disabled={!stage}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Export {format.toUpperCase()}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
            </div>

            {/* File Size Estimate */}
            <div className="text-xs text-gray-500 text-center">
              {format === 'svg' && 'Vector format - small file size'}
              {format === 'pdf' && 'Document format - medium file size'}
              {(format === 'png' || format === 'jpg') && (
                <>
                  Estimated size: {multiplier >= 3 ? 'Large' : multiplier >= 2 ? 'Medium' : 'Small'}
                  {format === 'jpg' && ` (${Math.round(quality * 100)}% quality)`}
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}