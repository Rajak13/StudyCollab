'use client'

import { useState } from 'react'
import { FixedCollaborativeCanvas } from './fixed-collaborative-canvas'

export function CanvasDemo() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [aspectRatio, setAspectRatio] = useState(16/9)
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true)

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Canvas Rendering Architecture Demo</h2>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Container Width</label>
            <input
              type="range"
              min="400"
              max="1200"
              value={dimensions.width}
              onChange={(e) => setDimensions(prev => ({ ...prev, width: parseInt(e.target.value) }))}
              className="w-full"
            />
            <span className="text-sm text-gray-500">{dimensions.width}px</span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Container Height</label>
            <input
              type="range"
              min="300"
              max="800"
              value={dimensions.height}
              onChange={(e) => setDimensions(prev => ({ ...prev, height: parseInt(e.target.value) }))}
              className="w-full"
            />
            <span className="text-sm text-gray-500">{dimensions.height}px</span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(parseFloat(e.target.value))}
              className="w-full p-2 border rounded"
            >
              <option value={16/9}>16:9 (Widescreen)</option>
              <option value={4/3}>4:3 (Standard)</option>
              <option value={1}>1:1 (Square)</option>
              <option value={3/2}>3:2 (Photo)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={maintainAspectRatio}
              onChange={(e) => setMaintainAspectRatio(e.target.checked)}
              className="mr-2"
            />
            Maintain Aspect Ratio
          </label>
        </div>

        {/* Canvas Container */}
        <div 
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
          style={{ width: dimensions.width, height: dimensions.height }}
        >
          <FixedCollaborativeCanvas
            groupId="demo-group"
            userId="demo-user"
            userName="Demo User"
            active={true}
            maintainAspectRatio={maintainAspectRatio}
            aspectRatio={aspectRatio}
            autoResize={true}
            minWidth={300}
            minHeight={200}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  )
}