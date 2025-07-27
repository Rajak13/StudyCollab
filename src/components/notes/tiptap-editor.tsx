'use client'

import CharacterCount from '@tiptap/extension-character-count'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { EditorContent, JSONContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useCallback, useEffect } from 'react'
import { EditorToolbar } from './editor-toolbar'

interface TiptapEditorProps {
    content?: JSONContent
    onChange?: (content: JSONContent) => void
    onUpdate?: (content: JSONContent) => void
    placeholder?: string
    editable?: boolean
    className?: string
    showToolbar?: boolean
    showCharacterCount?: boolean
    maxCharacters?: number
}

export function TiptapEditor({
    content,
    onChange,
    onUpdate,
    placeholder = 'Start writing...',
    editable = true,
    className = '',
    showToolbar = true,
    showCharacterCount = true,
    maxCharacters = 10000,
}: TiptapEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            CharacterCount.configure({
                limit: maxCharacters,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline cursor-pointer',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-lg',
                },
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Highlight.configure({
                multicolor: true,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Underline,
        ],
        content,
        editable,
        onUpdate: ({ editor }) => {
            const json = editor.getJSON()
            onUpdate?.(json)
            onChange?.(json)
        },
        editorProps: {
            attributes: {
                class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none ${className}`,
            },
        },
    })

    // Update editor content when prop changes
    useEffect(() => {
        if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
            editor.commands.setContent(content)
        }
    }, [editor, content])

    // Update editable state
    useEffect(() => {
        if (editor) {
            editor.setEditable(editable)
        }
    }, [editor, editable])

    const insertImage = useCallback(() => {
        const url = window.prompt('Enter image URL:')
        if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run()
        }
    }, [editor])

    const setLink = useCallback(() => {
        const previousUrl = editor?.getAttributes('link').href
        const url = window.prompt('Enter URL:', previousUrl)

        if (url === null) {
            return
        }

        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }, [editor])

    const addTable = useCallback(() => {
        editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    }, [editor])

    if (!editor) {
        return (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-4">
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            {showToolbar && (
                <EditorToolbar
                    editor={editor}
                    onInsertImage={insertImage}
                    onSetLink={setLink}
                    onAddTable={addTable}
                />
            )}

            <div className="p-4">
                <EditorContent editor={editor} />
            </div>

            {showCharacterCount && (
                <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between">
                    <span>
                        {editor.storage.characterCount.characters()}/{maxCharacters} characters
                    </span>
                    <span>
                        {editor.storage.characterCount.words()} words
                    </span>
                </div>
            )}
        </div>
    )
}