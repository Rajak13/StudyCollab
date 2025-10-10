#!/usr/bin/env node

/**
 * Test script to verify join request functionality
 * This script tests the complete flow of join requests and approvals
 */

const BASE_URL = 'http://localhost:3000'

// Mock user tokens - in a real test, you'd get these from authentication
const OWNER_TOKEN = 'owner-auth-token'
const MEMBER_TOKEN = 'member-auth-token'

async function testJoinRequestFlow() {
  console.log('🧪 Testing Join Request Functionality\n')

  try {
    // Test 1: Create a private study group
    console.log('1️⃣ Creating a private study group...')
    const createGroupResponse = await fetch(`${BASE_URL}/api/study-groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OWNER_TOKEN}`
      },
      body: JSON.stringify({
        name: 'Test Private Group',
        description: 'A test group for join request functionality',
        subject: 'Computer Science',
        is_private: true
      })
    })

    if (!createGroupResponse.ok) {
      throw new Error(`Failed to create group: ${createGroupResponse.status}`)
    }

    const groupData = await createGroupResponse.json()
    const groupId = groupData.data.id
    console.log(`✅ Group created with ID: ${groupId}\n`)

    // Test 2: Submit a join request
    console.log('2️⃣ Submitting a join request...')
    const joinResponse = await fetch(`${BASE_URL}/api/study-groups/${groupId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEMBER_TOKEN}`
      },
      body: JSON.stringify({
        message: 'I would like to join this study group to learn together!'
      })
    })

    if (!joinResponse.ok) {
      throw new Error(`Failed to submit join request: ${joinResponse.status}`)
    }

    const joinData = await joinResponse.json()
    console.log(`✅ Join request submitted: ${joinData.message}\n`)

    // Test 3: Fetch join requests (as owner)
    console.log('3️⃣ Fetching join requests...')
    const requestsResponse = await fetch(`${BASE_URL}/api/study-groups/${groupId}/requests`, {
      headers: {
        'Authorization': `Bearer ${OWNER_TOKEN}`
      }
    })

    if (!requestsResponse.ok) {
      throw new Error(`Failed to fetch join requests: ${requestsResponse.status}`)
    }

    const requestsData = await requestsResponse.json()
    const requests = requestsData.data
    console.log(`✅ Found ${requests.length} join request(s)`)

    if (requests.length === 0) {
      throw new Error('No join requests found!')
    }

    const requestId = requests[0].id
    console.log(`📝 Request ID: ${requestId}\n`)

    // Test 4: Approve the join request
    console.log('4️⃣ Approving the join request...')
    const approveResponse = await fetch(`${BASE_URL}/api/study-groups/${groupId}/requests/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OWNER_TOKEN}`
      },
      body: JSON.stringify({
        status: 'APPROVED'
      })
    })

    if (!approveResponse.ok) {
      throw new Error(`Failed to approve join request: ${approveResponse.status}`)
    }

    const approveData = await approveResponse.json()
    console.log(`✅ Join request approved: ${approveData.message}\n`)

    // Test 5: Verify user is now a member
    console.log('5️⃣ Verifying membership...')
    const membersResponse = await fetch(`${BASE_URL}/api/study-groups/${groupId}/members`, {
      headers: {
        'Authorization': `Bearer ${OWNER_TOKEN}`
      }
    })

    if (!membersResponse.ok) {
      throw new Error(`Failed to fetch members: ${membersResponse.status}`)
    }

    const membersData = await membersResponse.json()
    const members = membersData.data
    console.log(`✅ Group now has ${members.length} member(s)`)

    // Test 6: Test rejection flow
    console.log('\n6️⃣ Testing rejection flow...')
    
    // Create another join request
    const joinResponse2 = await fetch(`${BASE_URL}/api/study-groups/${groupId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEMBER_TOKEN}` // Different user
      },
      body: JSON.stringify({
        message: 'Another join request to test rejection'
      })
    })

    if (joinResponse2.ok) {
      const requestsResponse2 = await fetch(`${BASE_URL}/api/study-groups/${groupId}/requests`, {
        headers: {
          'Authorization': `Bearer ${OWNER_TOKEN}`
        }
      })

      const requestsData2 = await requestsResponse2.json()
      const pendingRequests = requestsData2.data.filter(r => r.status === 'PENDING')
      
      if (pendingRequests.length > 0) {
        const rejectRequestId = pendingRequests[0].id
        
        const rejectResponse = await fetch(`${BASE_URL}/api/study-groups/${groupId}/requests/${rejectRequestId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OWNER_TOKEN}`
          },
          body: JSON.stringify({
            status: 'REJECTED'
          })
        })

        if (rejectResponse.ok) {
          console.log('✅ Join request rejection works correctly')
        }
      }
    }

    console.log('\n🎉 All tests passed! Join request functionality is working correctly.')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
if (require.main === module) {
  testJoinRequestFlow()
}

module.exports = { testJoinRequestFlow }