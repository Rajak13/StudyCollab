#!/usr/bin/env node

/**
 * Test script for the download API endpoint
 * This script tests the download API functionality without requiring a full build
 */

const http = require('http');
const https = require('https');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  endpoints: [
    '/api/download',
    '/api/download?platform=windows',
    '/api/download?platform=mac', 
    '/api/download?platform=linux',
    '/api/releases/latest'
  ],
  userAgents: {
    windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    linux: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
};

async function testEndpoint(endpoint, userAgent = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: 'GET',
      headers: {}
    };

    if (userAgent) {
      options.headers['User-Agent'] = userAgent;
    }

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          endpoint,
          statusCode: res.statusCode,
          headers: res.headers,
          data: data.length > 0 ? data : null,
          userAgent: userAgent ? 'custom' : 'default'
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        endpoint,
        error: error.message,
        userAgent: userAgent ? 'custom' : 'default'
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        endpoint,
        error: 'Timeout',
        userAgent: userAgent ? 'custom' : 'default'
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing StudyCollab Download API');
  console.log('=====================================\n');

  // Test basic endpoints
  console.log('📡 Testing basic endpoints...');
  for (const endpoint of TEST_CONFIG.endpoints) {
    const result = await testEndpoint(endpoint);
    
    if (result.error) {
      console.log(`❌ ${endpoint}: ERROR - ${result.error}`);
    } else {
      console.log(`✅ ${endpoint}: ${result.statusCode} ${getStatusText(result.statusCode)}`);
      
      if (result.headers.location) {
        console.log(`   📍 Redirects to: ${result.headers.location}`);
      }
      
      if (result.headers['x-download-platform']) {
        console.log(`   🖥️  Platform: ${result.headers['x-download-platform']}`);
      }
    }
  }

  console.log('\n🌐 Testing platform-specific user agents...');
  
  // Test with different user agents
  for (const [platform, userAgent] of Object.entries(TEST_CONFIG.userAgents)) {
    const result = await testEndpoint('/api/download', userAgent);
    
    if (result.error) {
      console.log(`❌ ${platform}: ERROR - ${result.error}`);
    } else {
      console.log(`✅ ${platform}: ${result.statusCode} ${getStatusText(result.statusCode)}`);
      
      if (result.headers.location) {
        console.log(`   📍 Redirects to: ${result.headers.location}`);
      }
      
      if (result.headers['x-download-platform']) {
        console.log(`   🖥️  Detected platform: ${result.headers['x-download-platform']}`);
      }
    }
  }

  console.log('\n📊 Testing analytics endpoint...');
  
  // Test POST endpoint for analytics
  const analyticsResult = await testAnalyticsEndpoint();
  if (analyticsResult.error) {
    console.log(`❌ Analytics: ERROR - ${analyticsResult.error}`);
  } else {
    console.log(`✅ Analytics: ${analyticsResult.statusCode} ${getStatusText(analyticsResult.statusCode)}`);
  }

  console.log('\n🎉 Test completed!');
  console.log('\n💡 Tips:');
  console.log('   - Make sure your Next.js server is running on localhost:3000');
  console.log('   - Check that GitHub API is accessible for release data');
  console.log('   - Verify environment variables are set correctly');
}

async function testAnalyticsEndpoint() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      platform: 'windows',
      userAgent: TEST_CONFIG.userAgents.windows,
      timestamp: new Date().toISOString()
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/download',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data.length > 0 ? data : null
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        error: 'Timeout'
      });
    });

    req.write(postData);
    req.end();
  });
}

function getStatusText(statusCode) {
  const statusTexts = {
    200: 'OK',
    302: 'Found (Redirect)',
    404: 'Not Found',
    500: 'Internal Server Error'
  };
  
  return statusTexts[statusCode] || 'Unknown';
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testEndpoint };