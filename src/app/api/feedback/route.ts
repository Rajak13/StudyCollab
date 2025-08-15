import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general', 'improvement']),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message must be less than 1000 characters'),
  email: z.string().email('Invalid email address').optional(),
  rating: z.number().min(1).max(5).optional(),
  page: z.string().optional(),
  userAgent: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = feedbackSchema.parse(body)

    // In a real application, you would save this to a database
    // For now, we'll just log it and return success
    console.log('Feedback received:', {
      ...validatedData,
      timestamp: new Date().toISOString(),
      ip: request.ip || 'unknown'
    })

    // You could integrate with services like:
    // - Email service (SendGrid, Resend, etc.)
    // - Database (Supabase, PostgreSQL, etc.)
    // - Issue tracking (GitHub Issues, Linear, etc.)
    // - Analytics (PostHog, Mixpanel, etc.)

    return NextResponse.json({ 
      success: true, 
      message: 'Thank you for your feedback! We appreciate your input.' 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid feedback data', 
          errors: error.errors 
        },
        { status: 400 }
      )
    }

    console.error('Feedback submission error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to submit feedback. Please try again later.' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Feedback API is working. Use POST to submit feedback.' 
  })
}