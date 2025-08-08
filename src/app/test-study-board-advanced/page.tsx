'use client'

import { StudyBoard } from '@/components/study-board/study-board'
import { useState } from 'react'

export default function TestStudyBoardAdvanced() {
  const [groupId] = useState('test-group-advanced')
  const [userId] = useState('test-user-1')
  const [userName] = useState('Test User')

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Study Board Advanced Features Test</h1>
        <p className="text-gray-600 mb-6">
          Testing the advanced features: Templates, Layer Management, Enhanced Export, and Canvas Navigation
        </p>
      </div>
      
      <div className="h-[calc(100vh-120px)]">
        <StudyBoard
          groupId={groupId}
          userId={userId}
          userName={userName}
          className="h-full"
        />
      </div>
    </div>
  )
}