'use client'

import { JSONContent } from '@tiptap/react'

export interface NoteTemplate {
  id: string
  name: string
  description: string
  content: JSONContent
  preview: string
}

export const noteTemplates: NoteTemplate[] = [
  {
    id: 'basic',
    name: 'Basic Note',
    description: 'A simple note with title and content',
    preview: 'Simple text editor for general note-taking',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Note Title' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Start writing your note here...' }],
        },
      ],
    },
  },
  {
    id: 'cornell',
    name: 'Cornell Notes',
    description: 'Structured note-taking with cues, notes, and summary',
    preview: 'Organized layout with sections for cues, notes, and summary',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Cornell Notes - Topic' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Date: ' },
            { type: 'text', marks: [{ type: 'bold' }], text: new Date().toLocaleDateString() },
          ],
        },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableHeader',
                  attrs: { colspan: 1, rowspan: 1, colwidth: [200] },
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Cues' }],
                    },
                  ],
                },
                {
                  type: 'tableHeader',
                  attrs: { colspan: 1, rowspan: 1, colwidth: [400] },
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Notes' }],
                    },
                  ],
                },
              ],
            },
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  attrs: { colspan: 1, rowspan: 1, colwidth: [200] },
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Key questions, keywords, formulas' }],
                    },
                  ],
                },
                {
                  type: 'tableCell',
                  attrs: { colspan: 1, rowspan: 1, colwidth: [400] },
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Main ideas, details, examples' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Summary' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Write a brief summary of the main points...' }],
        },
      ],
    },
  },
  {
    id: 'mindmap',
    name: 'Mind Map',
    description: 'Visual note-taking with central topic and branches',
    preview: 'Hierarchical structure for brainstorming and concept mapping',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1, textAlign: 'center' },
          content: [{ type: 'text', text: 'Central Topic' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Main Branch 1' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Sub-topic 1.1' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Sub-topic 1.2' }],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Main Branch 2' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Sub-topic 2.1' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Sub-topic 2.2' }],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Main Branch 3' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Sub-topic 3.1' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Sub-topic 3.2' }],
                },
              ],
            },
          ],
        },
      ],
    },
  },
]

export function getTemplateById(id: string): NoteTemplate | undefined {
  return noteTemplates.find((template) => template.id === id)
}

export function getDefaultTemplate(): NoteTemplate {
  return noteTemplates[0] // Basic template
}