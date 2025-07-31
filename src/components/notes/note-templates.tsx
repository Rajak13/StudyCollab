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
          content: [{ type: 'text', text: 'My Note' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Start writing your thoughts here...' },
          ],
        },
        {
          type: 'paragraph',
          content: [],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'You can format text as ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'bold' },
            { type: 'text', text: ', ' },
            { type: 'text', marks: [{ type: 'italic' }], text: 'italic' },
            { type: 'text', text: ', or ' },
            { type: 'text', marks: [{ type: 'code' }], text: 'code' },
            { type: 'text', text: '.' },
          ],
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
            {
              type: 'text',
              marks: [{ type: 'bold' }],
              text: new Date().toLocaleDateString(),
            },
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
                      content: [
                        {
                          type: 'text',
                          marks: [{ type: 'bold' }],
                          text: 'Cues',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'tableHeader',
                  attrs: { colspan: 1, rowspan: 1, colwidth: [400] },
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          marks: [{ type: 'bold' }],
                          text: 'Notes',
                        },
                      ],
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
                      content: [
                        {
                          type: 'text',
                          text: 'Key questions, keywords, formulas',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'tableCell',
                  attrs: { colspan: 1, rowspan: 1, colwidth: [400] },
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        { type: 'text', text: 'Main ideas, details, examples' },
                      ],
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
          content: [
            {
              type: 'text',
              text: 'Write a brief summary of the main points...',
            },
          ],
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
  {
    id: 'study',
    name: 'Study Notes',
    description: 'Structured template for academic study notes',
    preview:
      'Organized sections for topic, objectives, key concepts, and review',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Study Notes - [Subject/Topic]' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Date: ' },
            { type: 'text', text: new Date().toLocaleDateString() },
            { type: 'text', text: ' | ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'Chapter/Unit: ' },
            { type: 'text', text: '[Chapter Number/Name]' },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '🎯 Learning Objectives' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'What I need to learn from this session',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Key skills to develop' }],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '📚 Key Concepts' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Main ideas and definitions:' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      marks: [{ type: 'bold' }],
                      text: 'Concept 1: ',
                    },
                    { type: 'text', text: 'Definition and explanation' },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      marks: [{ type: 'bold' }],
                      text: 'Concept 2: ',
                    },
                    { type: 'text', text: 'Definition and explanation' },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '💡 Examples & Applications' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Real-world examples and practice problems:',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '❓ Questions & Clarifications' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Questions to ask in class or research further',
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
          content: [{ type: 'text', text: '📝 Summary & Review' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Key takeaways and points to remember for exam:',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'meeting',
    name: 'Meeting Notes',
    description: 'Template for meeting notes with agenda and action items',
    preview: 'Structured format for meeting documentation and follow-ups',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Meeting Notes' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Date: ' },
            { type: 'text', text: new Date().toLocaleDateString() },
            { type: 'text', text: ' | ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'Time: ' },
            { type: 'text', text: '[Start - End Time]' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Attendees: ' },
            { type: 'text', text: '[List of participants]' },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '📋 Agenda' }],
        },
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Agenda item 1' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Agenda item 2' }],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '💬 Discussion Points' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Key points discussed during the meeting:' },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '✅ Decisions Made' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Decision 1 and rationale' }],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '🎯 Action Items' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: '[ ] ' },
                    {
                      type: 'text',
                      marks: [{ type: 'bold' }],
                      text: 'Task description',
                    },
                    {
                      type: 'text',
                      text: ' - Assigned to: [Name] - Due: [Date]',
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
          content: [{ type: 'text', text: '📅 Next Steps' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Next meeting: ' },
            { type: 'text', text: '[Date and time]' },
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
