// IPC Communication Layer Test Suite
// This file tests the secure IPC communication between main and renderer processes

import { SecurityManager } from './security';
import { IPCResponse } from './types';

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class IPCTester {
  private securityManager: SecurityManager;
  private testResults: TestResult[] = [];

  constructor() {
    this.securityManager = SecurityManager.getInstance();
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('Starting IPC Communication Layer Tests...');
    
    const tests = [
      this.testPingHandler,
      this.testNotificationValidation,
      this.testFilePathValidation,
      this.testBoundsValidation,
      this.testInputSanitization,
      this.testErrorHandling,
      this.testSecurityValidation,
      this.testIPCResponseFormat
    ];

    for (const test of tests) {
      await this.runTest(test.bind(this));
    }

    this.printResults();
    return this.testResults;
  }

  private async runTest(testFn: () => Promise<void>): Promise<void> {
    const testName = testFn.name;
    const startTime = Date.now();
    
    try {
      await testFn();
      this.testResults.push({
        testName,
        passed: true,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
    }
  }

  private async testPingHandler(): Promise<void> {
    // Test basic IPC communication
    const mockEvent = {} as Electron.IpcMainInvokeEvent;
    
    // Simulate ping handler
    const pingResponse = await this.simulatePingHandler();
    
    if (!pingResponse.success || pingResponse.data !== 'pong') {
      throw new Error('Ping handler failed');
    }
    
    if (!pingResponse.timestamp || typeof pingResponse.timestamp !== 'number') {
      throw new Error('Ping response missing timestamp');
    }
  }

  private async testNotificationValidation(): Promise<void> {
    // Test notification parameter validation
    const validCases = [
      { title: 'Test', body: 'Message', options: undefined },
      { title: 'Test', body: 'Message', options: { silent: true } },
      { title: 'Test', body: 'Message', options: { urgency: 'critical' } }
    ];

    const invalidCases = [
      { title: '', body: 'Message' }, // Empty title
      { title: 'Test', body: '' }, // Empty body
      { title: 'A'.repeat(200), body: 'Message' }, // Title too long
      { title: 'Test', body: 'A'.repeat(500) }, // Body too long
      { title: 'Test', body: 'Message', options: { urgency: 'invalid' } } // Invalid urgency
    ];

    // Test valid cases
    for (const testCase of validCases) {
      const isValid = this.validateNotificationParams(testCase.title, testCase.body, testCase.options);
      if (!isValid) {
        throw new Error(`Valid notification case failed: ${JSON.stringify(testCase)}`);
      }
    }

    // Test invalid cases
    for (const testCase of invalidCases) {
      const isValid = this.validateNotificationParams(testCase.title, testCase.body, testCase.options);
      if (isValid) {
        throw new Error(`Invalid notification case passed: ${JSON.stringify(testCase)}`);
      }
    }
  }

  private async testFilePathValidation(): Promise<void> {
    const validPaths = [
      '/home/user/document.txt',
      'C:\\Users\\User\\Documents\\file.txt',
      './relative/path.txt',
      'simple-file.txt'
    ];

    const invalidPaths = [
      '../../../etc/passwd', // Directory traversal
      'C:\\Windows\\System32\\config', // System directory
      '/proc/version', // System directory
      'malicious.exe', // Executable file
      '', // Empty path
      'A'.repeat(600) // Path too long
    ];

    // Test valid paths
    for (const path of validPaths) {
      if (!this.securityManager.validateFilePath(path)) {
        throw new Error(`Valid file path rejected: ${path}`);
      }
    }

    // Test invalid paths
    for (const path of invalidPaths) {
      if (this.securityManager.validateFilePath(path)) {
        throw new Error(`Invalid file path accepted: ${path}`);
      }
    }
  }

  private async testBoundsValidation(): Promise<void> {
    const validBounds = [
      { width: 800, height: 600 },
      { width: 1200, height: 800, x: 100, y: 100 },
      { width: 400, height: 300, x: 0, y: 0 }
    ];

    const invalidBounds = [
      { width: 200, height: 600 }, // Width too small
      { width: 800, height: 200 }, // Height too small
      { width: 5000, height: 600 }, // Width too large
      { width: 800, height: 5000 }, // Height too large
      { width: 800, height: 600, x: -3000 }, // X too negative
      { width: 800, height: 600, y: 15000 }, // Y too large
      { width: '800', height: 600 }, // Invalid type
      null, // Null bounds
      undefined // Undefined bounds
    ];

    // Test valid bounds
    for (const bounds of validBounds) {
      if (!this.securityManager.validateBounds(bounds)) {
        throw new Error(`Valid bounds rejected: ${JSON.stringify(bounds)}`);
      }
    }

    // Test invalid bounds
    for (const bounds of invalidBounds) {
      if (this.securityManager.validateBounds(bounds)) {
        throw new Error(`Invalid bounds accepted: ${JSON.stringify(bounds)}`);
      }
    }
  }

  private async testInputSanitization(): Promise<void> {
    const testCases = [
      {
        input: '<script>alert("xss")</script>',
        expected: 'alert("xss")',
        description: 'HTML tags removed'
      },
      {
        input: 'javascript:alert("xss")',
        expected: 'alert("xss")',
        description: 'JavaScript protocol removed'
      },
      {
        input: 'data:text/html,<script>alert("xss")</script>',
        expected: 'text/html,alert("xss")',
        description: 'Data protocol removed'
      },
      {
        input: 'A'.repeat(1000),
        expected: 'A'.repeat(500),
        description: 'String truncated to max length'
      }
    ];

    for (const testCase of testCases) {
      const sanitized = this.securityManager.sanitizeString(testCase.input, 500);
      if (sanitized !== testCase.expected) {
        throw new Error(`Sanitization failed for ${testCase.description}: expected "${testCase.expected}", got "${sanitized}"`);
      }
    }
  }

  private async testErrorHandling(): Promise<void> {
    // Test error response format
    const errorResponse = this.securityManager.createIPCResponse(false, null, 'Test error');
    
    if (errorResponse.success !== false) {
      throw new Error('Error response should have success: false');
    }
    
    if (errorResponse.error !== 'Test error') {
      throw new Error('Error response should contain error message');
    }
    
    if (!errorResponse.timestamp || typeof errorResponse.timestamp !== 'number') {
      throw new Error('Error response should contain timestamp');
    }
  }

  private async testSecurityValidation(): Promise<void> {
    // Test IPC message validation
    const validMessages = [
      { type: 'notification', title: 'Test', body: 'Message' },
      { bounds: { width: 800, height: 600 } },
      'simple string'
    ];

    const invalidMessages = [
      { __proto__: { malicious: true } }, // Prototype pollution
      { constructor: { name: 'malicious' } }, // Constructor manipulation
      null, // Null message
      undefined // Undefined message
    ];

    // Test valid messages
    for (const message of validMessages) {
      if (!this.securityManager.validateIPCMessage(message)) {
        throw new Error(`Valid IPC message rejected: ${JSON.stringify(message)}`);
      }
    }

    // Test invalid messages
    for (const message of invalidMessages) {
      if (this.securityManager.validateIPCMessage(message)) {
        throw new Error(`Invalid IPC message accepted: ${JSON.stringify(message)}`);
      }
    }
  }

  private async testIPCResponseFormat(): Promise<void> {
    // Test success response format
    const successResponse = this.securityManager.createIPCResponse(true, 'test data');
    
    if (successResponse.success !== true) {
      throw new Error('Success response should have success: true');
    }
    
    if (successResponse.data !== 'test data') {
      throw new Error('Success response should contain data');
    }
    
    if (!successResponse.timestamp) {
      throw new Error('Success response should contain timestamp');
    }

    // Test error response format
    const errorResponse = this.securityManager.createIPCResponse(false, null, 'error message');
    
    if (errorResponse.success !== false) {
      throw new Error('Error response should have success: false');
    }
    
    if (errorResponse.error !== 'error message') {
      throw new Error('Error response should contain error message');
    }
  }

  private validateNotificationParams(title: string, body: string, options?: any): boolean {
    // Simulate the validation logic from preload script
    if (typeof title !== 'string' || title.length === 0 || title.length > 100) {
      return false;
    }
    
    if (typeof body !== 'string' || body.length === 0 || body.length > 300) {
      return false;
    }
    
    if (options) {
      return this.securityManager.validateNotificationOptions(options);
    }
    
    return true;
  }

  private async simulatePingHandler(): Promise<IPCResponse<string>> {
    // Simulate the ping handler from main process
    try {
      return {
        success: true,
        data: 'pong',
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        data: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  private printResults(): void {
    console.log('\n=== IPC Communication Layer Test Results ===');
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n=== Failed Tests ===');
      this.testResults
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`❌ ${result.testName}: ${result.error} (${result.duration}ms)`);
        });
    }
    
    console.log('\n=== Passed Tests ===');
    this.testResults
      .filter(r => r.passed)
      .forEach(result => {
        console.log(`✅ ${result.testName} (${result.duration}ms)`);
      });
  }
}

// Export for use in other test files
export { IPCTester };

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new IPCTester();
  tester.runAllTests().then(results => {
    const failed = results.filter(r => !r.passed).length;
    process.exit(failed > 0 ? 1 : 0);
  });
}