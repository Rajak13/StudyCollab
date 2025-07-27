'use client'

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
import { FileText, Layout, Lightbulb, Plus } from 'lucide-react'
import { useState } from 'react'
import { NoteTemplate, noteTemplates } from './note-templates'

interface TemplateSelectorProps {
  onTemplateSelect: (template: NoteTemplate) => void
  trigger?: React.ReactNode
}

export function TemplateSelector({ onTemplateSelect, trigger }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleTemplateSelect = (template: NoteTemplate) => {
    onTemplateSelect(template)
    setIsOpen(false)
  }

  const getTemplateIcon = (templateId: string) => {
    switch (templateId) {
      case 'basic':
        return <FileText className="h-8 w-8 text-blue-500" />
      case 'cornell':
        return <Layout className="h-8 w-8 text-green-500" />
      case 'mindmap':
        return <Lightbulb className="h-8 w-8 text-purple-500" />
      default:
        return <FileText className="h-8 w-8 text-gray-500" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choose a Note Template</DialogTitle>
          <DialogDescription>
            Select a template to get started with your note. You can always change the format later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {noteTemplates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
              onClick={() => handleTemplateSelect(template)}
            >
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  {getTemplateIcon(template.id)}
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                  {template.preview}
                </div>
                
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTemplateSelect(template)
                  }}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}