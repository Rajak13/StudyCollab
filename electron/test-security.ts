// Test script to verify security functionality
import { SecurityManager } from './security';

async function testSecurity() {
  console.log('Testing SecurityManager...');
  
  const securityManager = SecurityManager.getInstance();
  
  // Test input validation
  console.log('Testing input validation...');
  const validData = { test: 'value' };
  const invalidData = { __proto__: 'dangerous' };
  
  console.log('Valid data:', securityManager.validateIPCMessage(validData));
  console.log('Invalid data:', securityManager.validateIPCMessage(invalidData));
  
  // Test string sanitization
  console.log('Testing string sanitization...');
  const dangerousString = '<script>alert("xss")</script>Hello World';
  const sanitized = securityManager.sanitizeString(dangerousString);
  console.log('Original:', dangerousString);
  console.log('Sanitized:', sanitized);
  
  // Test bounds validation
  console.log('Testing bounds validation...');
  const validBounds = { width: 800, height: 600, x: 100, y: 100 };
  const invalidBounds = { width: 50, height: 50 }; // Too small
  
  console.log('Valid bounds:', securityManager.validateBounds(validBounds));
  console.log('Invalid bounds:', securityManager.validateBounds(invalidBounds));
  
  console.log('Security tests completed successfully!');
}

testSecurity().catch(console.error);