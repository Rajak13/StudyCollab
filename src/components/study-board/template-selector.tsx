'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CANVAS_TEMPLATES, CanvasTemplate, createElementsFromTemplate } from '@/lib/canvas-templates'
import { useStudyBoardStore } from '@/lib/stores/study-board-store'
import { CanvasElement } from '@/types/study-board'
import { BarChart3, FileText, Lightbulb, Presentation } from 'lucide-react'
import { useState } from 'react'

interface TemplateSelectorProps {
  onTemplateSelect?: (elements: CanvasElement[]) => void
  onAddElements?: (elements: CanvasElement[]) => void
  className?: string
}

const categoryIcons = {
  brainstorming: Lightbulb,
  planning: FileText,
  analysis: BarChart3,
  presentation: Presentation,
}

const categoryColors = {
  brainstorming: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  planning: 'bg-blue-100 text-blue-800 border-blue-200',
  analysis: 'bg-green-100 text-green-800 border-green-200',
  presentation: 'bg-purple-100 text-purple-800 border-purple-200',
}

export function TemplateSelector({ onTemplateSelect, onAddElements, className = '' }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CanvasTemplate['category'] | 'all'>('all')
  const { addElement } = useStudyBoardStore()

  const filteredTemplates = selectedCategory === 'all' 
    ? CANVAS_TEMPLATES 
    : CANVAS_TEMPLATES.filter(template => template.category === selectedCategory)

  const handleTemplateSelect = (template: CanvasTemplate) => {
    const elements = createElementsFromTemplate(template)
    
    if (onTemplateSelect) {
      onTemplateSelect(elements)
    } else if (onAddElements) {
      onAddElements(elements)
    } else {
      // Add elements to the store - they will be synced to canvas through the existing system
      elements.forEach(element => addElement(element))
    }
    
    setIsOpen(false)
  }

  const categories: Array<{ key: CanvasTemplate['category'] | 'all', label: string }> = [
    { key: 'all', label: 'All Templates' },
    { key: 'brainstorming', label: 'Brainstorming' },
    { key: 'planning', label: 'Planning' },
    { key: 'analysis', label: 'Analysis' },
    { key: 'presentation', label: 'Presentation' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={`${className} text-xs lg:text-sm`}>
          <FileText className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
          <span className="hidden sm:inline">Templates</span>
          <span className="sm:hidden">Temp</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category.key}
                variant={selectedCategory === category.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.key)}
                className="flex items-center space-x-2"
              >
                {category.key !== 'all' && (
                  <>
                    {(() => {
                      const Icon = categoryIcons[category.key as keyof typeof categoryIcons]
                      return Icon ? <Icon className="w-4 h-4" /> : null
                    })()}
                  </>
                )}
                <span>{category.label}</span>
              </Button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredTemplates.map(template => {
              const Icon = categoryIcons[template.category]
              return (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full border ${categoryColors[template.category]}`}>
                      {template.category}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  
                  {/* Template Preview */}
                  <div className="bg-gray-50 rounded border h-24 flex items-center justify-center">
                    <div className="text-xs text-gray-500">
                      {template.elements.length} elements
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTemplateSelect(template)
                    }}
                  >
                    Use Template
                  </Button>
                </div>
              )
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No templates found for the selected category.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}