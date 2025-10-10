'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Palette, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
    useCreateTaskCategory,
    useDeleteTaskCategory,
    useTaskCategories,
    useUpdateTaskCategory
} from '@/hooks/use-tasks'
import { taskCategorySchema } from '@/lib/validations/tasks'
import type { TaskCategory, TaskCategoryFormData } from '@/types/database'

const predefinedColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
]

interface CategoryFormProps {
  category?: TaskCategory
  onSuccess: () => void
}

function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const [selectedColor, setSelectedColor] = useState(category?.color || '#3B82F6')
  
  const createCategory = useCreateTaskCategory()
  const updateCategory = useUpdateTaskCategory()

  const form = useForm<TaskCategoryFormData>({
    resolver: zodResolver(taskCategorySchema),
    defaultValues: {
      name: category?.name || '',
      color: category?.color || '#3B82F6',
    },
  })

  const { register, handleSubmit, setValue, formState: { errors } } = form

  const onSubmit = async (data: TaskCategoryFormData) => {
    try {
      const categoryData = { ...data, color: selectedColor }
      
      if (category) {
        await updateCategory.mutateAsync({ id: category.id, data: categoryData })
      } else {
        await createCategory.mutateAsync(categoryData)
      }
      
      onSuccess()
    } catch {
      // Error handling is done in the hooks
    }
  }

  const isLoading = createCategory.isPending || updateCategory.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Category Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Enter category name..."
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-gray-300"
            style={{ backgroundColor: selectedColor }}
          />
          <div className="flex flex-wrap gap-2">
            {predefinedColors.map((color) => (
              <button
                key={color}
                type="button"
                className="w-6 h-6 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => {
                  setSelectedColor(color)
                  setValue('color', color)
                }}
              />
            ))}
          </div>
        </div>
        <Input
          type="color"
          value={selectedColor}
          onChange={(e) => {
            setSelectedColor(e.target.value)
            setValue('color', e.target.value)
          }}
          className="w-20 h-10"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  )
}

interface TaskCategoryManagerProps {
  className?: string
}

export function TaskCategoryManager({ className }: TaskCategoryManagerProps) {
  const [editingCategory, setEditingCategory] = useState<TaskCategory | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const { data: categoriesResponse, isLoading } = useTaskCategories()
  const deleteCategory = useDeleteTaskCategory()
  
  const categories = categoriesResponse?.data || []

  const handleEdit = (category: TaskCategory) => {
    setEditingCategory(category)
    setShowEditDialog(true)
  }

  const handleDelete = async (category: TaskCategory) => {
    if (confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
      try {
        await deleteCategory.mutateAsync(category.id)
      } catch {
        // Error handling is done in the hook
      }
    }
  }

  const handleCreateSuccess = () => {
    setShowCreateDialog(false)
  }

  const handleEditSuccess = () => {
    setShowEditDialog(false)
    setEditingCategory(null)
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">Loading categories...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Task Categories
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <CategoryForm onSuccess={handleCreateSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Palette className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
            <p className="text-gray-600 mb-4">Create your first category to organize your tasks.</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium">{category.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={deleteCategory.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            {editingCategory && (
              <CategoryForm 
                category={editingCategory} 
                onSuccess={handleEditSuccess} 
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}