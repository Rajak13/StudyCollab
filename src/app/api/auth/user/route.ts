import { serverAuth } from '@/lib/auth'
import { db } from '@/lib/database'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get the authenticated user from Supabase
    const { user: authUser, error: authError } = await serverAuth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user profile from our database
    const { data: userProfile, error: dbError } = await db.serverQuery(
      'profiles',
      async (client) =>
        await client.from('profiles').select('*').eq('id', authUser.id).single()
    )

    if (dbError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: userProfile,
      authUser: {
        id: authUser.id,
        email: authUser.email,
        emailConfirmed: authUser.email_confirmed_at !== null,
        lastSignIn: authUser.last_sign_in_at,
      },
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get the authenticated user
    const { user: authUser, error: authError } = await serverAuth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()
    const { name, avatar_url, university, major, graduation_year, bio } = body

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url
    if (university !== undefined) updateData.university = university
    if (major !== undefined) updateData.major = major
    if (graduation_year !== undefined)
      updateData.graduation_year = graduation_year
    if (bio !== undefined) updateData.bio = bio

    // Update the user profile
    const { data: updatedUser, error: updateError } = await db.serverQuery(
      'profiles',
      async (client) =>
        await client
          .from('profiles')
          .update(updateData)
          .eq('id', authUser.id)
          .select('*')
          .single()
    )

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: updatedUser,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
