'use client'

import { JoinRequestsTest } from '@/components/study-groups/join-requests-test'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TestJoinRequestsPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/study-groups" 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Study Groups
        </Link>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Join Requests Functionality Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This page allows you to test the complete join request functionality including:
              creating groups, submitting requests, approving/rejecting requests, and verifying membership.
            </p>
          </CardContent>
        </Card>

        <JoinRequestsTest />
      </div>
    </div>
  )
}