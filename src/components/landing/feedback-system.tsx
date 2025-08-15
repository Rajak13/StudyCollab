'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'

interface FeedbackFormData {
  type: 'bug' | 'feature' | 'general' | 'improvement'
  message: string
  email: string
  rating?: number
}

const feedbackTypes = [
  { value: 'general', label: 'General Feedback', icon: '💬' },
  { value: 'bug', label: 'Bug Report', icon: '🐛' },
  { value: 'feature', label: 'Feature Request', icon: '✨' },
  { value: 'improvement', label: 'Improvement Suggestion', icon: '🚀' }
]

const ratingLabels = [
  { value: 1, label: 'Poor', emoji: '😞' },
  { value: 2, label: 'Fair', emoji: '😐' },
  { value: 3, label: 'Good', emoji: '🙂' },
  { value: 4, label: 'Very Good', emoji: '😊' },
  { value: 5, label: 'Excellent', emoji: '🤩' }
]

export function FeedbackSystem() {
  const [formData, setFormData] = useState<FeedbackFormData>({
    type: 'general',
    message: '',
    email: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.message.trim()) {
      toast({
        title: 'Message Required',
        description: 'Please enter your feedback message.',
        variant: 'destructive'
      })
      return
    }

    if (formData.message.length < 10) {
      toast({
        title: 'Message Too Short',
        description: 'Please provide at least 10 characters of feedback.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          page: window.location.pathname,
          userAgent: navigator.userAgent
        })
      })

      const result = await response.json()

      if (result.success) {
        setIsSubmitted(true)
        toast({
          title: 'Feedback Submitted!',
          description: result.message
        })
      } else {
        throw new Error(result.message || 'Failed to submit feedback')
      }
    } catch (error) {
      console.error('Feedback submission error:', error)
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit feedback. Please try again later.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData({
      type: 'general',
      message: '',
      email: ''
    })
    setIsSubmitted(false)
  }

  if (isSubmitted) {
    return (
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Card className="border-green-200 bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-8">
                <div className="mb-6 text-6xl">✅</div>
                <h3 className="mb-4 text-2xl font-bold text-green-800">
                  Thank You for Your Feedback!
                </h3>
                <p className="mb-6 text-green-700">
                  We've received your feedback and appreciate you taking the time to help us improve StudyCollab.
                </p>
                <Button onClick={handleReset} variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                  Submit More Feedback
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="feedback" className="bg-gradient-to-br from-primary/5 to-purple-600/5 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold">
            We Value Your Feedback
          </h2>
          <p className="text-xl text-muted-foreground">
            Help us improve StudyCollab by sharing your thoughts and suggestions
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <span>💭</span>
                Share Your Thoughts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="feedback-type">Feedback Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: FeedbackFormData['type']) => 
                      setFormData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select feedback type" />
                    </SelectTrigger>
                    <SelectContent>
                      {feedbackTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            {type.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Your Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us what you think about StudyCollab, report a bug, or suggest a new feature..."
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="min-h-[120px] resize-none"
                    maxLength={1000}
                  />
                  <div className="mt-1 text-right text-sm text-muted-foreground">
                    {formData.message.length}/1000 characters
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <p className="mt-1 text-sm text-muted-foreground">
                    We'll only use this to follow up on your feedback if needed
                  </p>
                </div>

                <div>
                  <Label>Overall Rating (Optional)</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ratingLabels.map((rating) => (
                      <Button
                        key={rating.value}
                        type="button"
                        variant={formData.rating === rating.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          rating: prev.rating === rating.value ? undefined : rating.value 
                        }))}
                        className="flex items-center gap-2"
                      >
                        <span>{rating.emoji}</span>
                        {rating.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || !formData.message.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2 animate-spin">⏳</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📤</span>
                      Submit Feedback
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}