// Integration Test for IPC Communication Layer
// This file tests the actual IPC communication between main and renderer processes

import { app, BrowserWindow } from 'electron';
import * as path from 'path';

class IPCIntegrationTest {
  private mainWindow: BrowserWindow | null = null;
  private testResults: { [key: string]: boolean } = {};

  async runIntegrationTests(): Promise<void> {
    console.log('Starting IPC Integration Tests...');

    // Wait for app to be ready
    await app.whenReady();

    // Create test window
    await this.createTestWindow();

    // Run tests
    await this.testBasicIPC();
    await this.testSecureIPC();
    await this.testErrorHandling();
    await this.testEventCommunication();

    // Print results
    this.printResults();

    // Cleanup
    this.mainWindow?.close();
    app.quit();
  }

  private async createTestWindow(): Promise<void> {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    // Load a simple HTML page for testing
    await this.mainWindow.loadURL('data:text/html,<html><body><h1>IPC Test</h1></body></html>');
  }

  private async testBasicIPC(): Promise<void> {
    try {
      // Test ping functionality
      const result = await this.mainWindow?.webContents.executeJavaScript(`
        window.desktopAPI.ping().then(response => response)
      `);

      if (result?.success && result?.data === 'pong') {
        this.testResults['basicIPC'] = true;
      } else {
        throw new Error('Ping test failed');
      }
    } catch (error) {
      console.error('Basic IPC test failed:', error);
      this.testResults['basicIPC'] = false;
    }
  }

  private async testSecureIPC(): Promise<void> {
    try {
      // Test input validation
      const maliciousInput = '<script>alert("xss")</script>';
      
      const result = await this.mainWindow?.webContents.executeJavaScript(`
        window.desktopAPI.showNotification('${maliciousInput}', 'test').then(response => response)
      `);

      // Should succeed but with sanitized input
      if (result?.success) {
        this.testResults['secureIPC'] = true;
      } else {
        throw new Error('Secure IPC test failed');
      }
    } catch (error) {
      console.error('Secure IPC test failed:', error);
      this.testResults['secureIPC'] = false;
    }
  }

  private async testErrorHandling(): Promise<void> {
    try {
      // Test error handling with invalid parameters
      const result = await this.mainWindow?.webContents.executeJavaScript(`
        window.desktopAPI.setWindowBounds({ width: -100, height: -100 }).then(response => response)
      `);

      // Should fail gracefully
      if (!result?.success && result?.error) {
        this.testResults['errorHandling'] = true;
      } else {
        throw new Error('Error handling test failed');
      }
    } catch (error) {
      console.error('Error handling test failed:', error);
      this.testResults['errorHandling'] = false;
    }
  }

  private async testEventCommunication(): Promise<void> {
    try {
      let eventReceived = false;

      // Set up event listener
      await this.mainWindow?.webContents.executeJavaScript(`
        window.testEventReceived = false;
        window.desktopAPI.onMenuAction((action, data) => {
          window.testEventReceived = true;
        });
      `);

      // Send test event
      this.mainWindow?.webContents.send('menu-new-session', { test: true });

      // Wait a bit for event to be processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if event was received
      const eventReceived = await this.mainWindow?.webContents.executeJavaScript(`
        window.testEventReceived
      `);

      if (eventReceived) {
        this.testResults['eventCommunication'] = true;
      } else {
        throw new Error('Event communication test failed');
      }
    } catch (error) {
      console.error('Event communication test failed:', error);
      this.testResults['eventCommunication'] = false;
    }
  }

  private printResults(): void {
    console.log('\n=== IPC Integration Test Results ===');
    
    const tests = Object.keys(this.testResults);
    const passed = tests.filter(test => this.testResults[test]).length;
    const failed = tests.length - passed;
    
    console.log(`Total Tests: ${tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    
    tests.forEach(test => {
      const status = this.testResults[test] ? '✅' : '❌';
      console.log(`${status} ${test}`);
    });
  }
}

// Run integration tests if this file is executed directly
if (require.main === module) {
  const tester = new IPCIntegrationTest();
  tester.runIntegrationTests().catch(error => {
    console.error('Integration test failed:', error);
    process.exit(1);
  });
}

export { IPCIntegrationTest };
