'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  BookOpen,
  FileText,
  Layout,
  Lightbulb,
  Plus,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { NoteTemplate, noteTemplates } from './note-templates'

interface TemplateSelectorProps {
  onTemplateSelect: (template: NoteTemplate) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export function TemplateSelector({
  onTemplateSelect,
  open,
  onOpenChange,
  trigger,
}: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const dialogOpen = open !== undefined ? open : isOpen
  const setDialogOpen = onOpenChange || setIsOpen

  const handleTemplateSelect = (template: NoteTemplate) => {
    onTemplateSelect(template)
    setDialogOpen(false)
  }

  const getTemplateIcon = (templateId: string) => {
    switch (templateId) {
      case 'basic':
        return <FileText className="h-8 w-8 text-blue-500" />
      case 'cornell':
        return <Layout className="h-8 w-8 text-green-500" />
      case 'mindmap':
        return <Lightbulb className="h-8 w-8 text-purple-500" />
      case 'study':
        return <BookOpen className="h-8 w-8 text-orange-500" />
      case 'meeting':
        return <Users className="h-8 w-8 text-indigo-500" />
      default:
        return <FileText className="h-8 w-8 text-gray-500" />
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose a Note Template</DialogTitle>
          <DialogDescription>
            Select a template to get started with your note. You can always
            change the format later.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid max-h-[60vh] grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2 lg:grid-cols-3">
          {noteTemplates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer border-2 transition-shadow hover:border-primary/50 hover:shadow-md"
              onClick={() => handleTemplateSelect(template)}
            >
              <CardHeader className="pb-2 text-center">
                <div className="mb-2 flex justify-center">
                  {getTemplateIcon(template.id)}
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                  {template.preview}
                </div>

                <Button
                  variant="outline"
                  className="mt-3 w-full"
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

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
