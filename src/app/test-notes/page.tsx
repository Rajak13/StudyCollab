'use client'

import { getDefaultTemplate, NoteTemplate } from '@/components/notes/note-templates'
import { TemplateSelector } from '@/components/notes/template-selector'
import { TiptapEditor } from '@/components/notes/tiptap-editor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { JSONContent } from '@tiptap/react'
import { useState } from 'react'

export default function TestNotesPage() {
  const [content, setContent] = useState<JSONContent>(getDefaultTemplate().content)
  const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null)

  const handleTemplateSelect = (template: NoteTemplate) => {
    setSelectedTemplate(template)
    setContent(template.content)
  }

  const handleContentChange = (newContent: JSONContent) => {
    setContent(newContent)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Notes System Test</h1>
        
        <div className="flex gap-4 mb-4">
          <TemplateSelector onTemplateSelect={handleTemplateSelect} />
          <Button
            variant="outline"
            onClick={() => {
              setContent(getDefaultTemplate().content)
              setSelectedTemplate(null)
            }}
          >
            Reset to Basic
          </Button>
        </div>

        {selectedTemplate && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Using template: <strong>{selectedTemplate.name}</strong> - {selectedTemplate.description}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <TiptapEditor
              content={content}
              onChange={handleContentChange}
              placeholder="Start typing your note..."
              showCharacterCount={true}
              maxCharacters={5000}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview (Read-only)</CardTitle>
          </CardHeader>
          <CardContent>
            <TiptapEditor
              content={content}
              editable={false}
              showToolbar={false}
              showCharacterCount={false}
              className="min-h-[400px]"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>JSON Content</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-40">
            {JSON.stringify(content, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}