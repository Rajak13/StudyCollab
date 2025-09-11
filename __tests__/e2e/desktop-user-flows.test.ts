/**
 * End-to-End Tests for Desktop User Flows
 * Tests complete user journeys from landing page to main application
 */

import { ElectronApplication, expect, Page, test } from '@playwright/test'
import path from 'path'
import { _electron as electron } from 'playwright'

let electronApp: ElectronApplication
let page: Page

test.describe('Desktop Application E2E Tests', () => {
  test.beforeAll(async () => {
    // Launch Electron app
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../electron/main.js')],
      env: {
        NODE_ENV: 'test',
        ELECTRON_IS_DEV: '1'
      }
    })
    
    // Get the first window
    page = await electronApp.firstWindow()
    
    // Wait for app to be ready
    await page.waitForLoadState('domcontentloaded')
  })

  test.afterAll(async () => {
    await electronApp.close()
  })

  test.describe('Landing Page to Authentication Flow', () => {
    test('should complete full onboarding flow from landing to login', async () => {
      // Should start on landing page
      await expect(page.locator('[data-testid="landing-hero"]')).toBeVisible()
      await expect(page.locator('h1')).toContainText('StudyCollab')
      
      // Navigate through landing sections
      await page.click('[data-testid="next-section-btn"]')
      await expect(page.locator('[data-testid="features-section"]')).toBeVisible()
      
      await page.click('[data-testid="next-section-btn"]')
      await expect(page.locator('[data-testid="benefits-section"]')).toBeVisible()
      
      // Click Get Started to go to authentication
      await page.click('[data-testid="get-started-btn"]')
      
      // Should navigate to login page
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
      await expect(page.locator('h2')).toContainText('Sign In')
    })

    test('should allow skipping landing page tour', async () => {
      // Reload to start fresh
      await page.reload()
      await page.waitForLoadState('domcontentloaded')
      
      // Skip tour directly
      await page.click('[data-testid="skip-tour-btn"]')
      
      // Should navigate to login page
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
    })

    test('should handle landing page navigation controls', async () => {
      // Reload to start fresh
      await page.reload()
      await page.waitForLoadState('domcontentloaded')
      
      // Test section navigation
      await page.click('[data-testid="section-nav-features"]')
      await expect(page.locator('[data-testid="features-section"]')).toBeVisible()
      
      await page.click('[data-testid="section-nav-benefits"]')
      await expect(page.locator('[data-testid="benefits-section"]')).toBeVisible()
      
      // Test previous button
      await page.click('[data-testid="previous-section-btn"]')
      await expect(page.locator('[data-testid="features-section"]')).toBeVisible()
    })
  })
})  t
est.describe('Authentication Flow', () => {
    test('should handle desktop login flow', async () => {
      // Navigate to login
      await page.goto('http://localhost:3000/login')
      await page.waitForLoadState('domcontentloaded')
      
      // Fill login form
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'testpassword123')
      
      // Submit form
      await page.click('[data-testid="login-btn"]')
      
      // Should show loading state
      await expect(page.locator('[data-testid="login-loading"]')).toBeVisible()
      
      // Wait for navigation (mock successful login)
      await page.waitForURL('**/dashboard', { timeout: 10000 })
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
    })

    test('should handle desktop signup flow', async () => {
      // Navigate to signup
      await page.goto('http://localhost:3000/signup')
      await page.waitForLoadState('domcontentloaded')
      
      // Fill signup form
      await page.fill('[data-testid="name-input"]', 'Test User')
      await page.fill('[data-testid="email-input"]', 'newuser@example.com')
      await page.fill('[data-testid="password-input"]', 'newpassword123')
      await page.fill('[data-testid="confirm-password-input"]', 'newpassword123')
      
      // Submit form
      await page.click('[data-testid="signup-btn"]')
      
      // Should show success message or navigate to verification
      await expect(page.locator('[data-testid="signup-success"]')).toBeVisible()
    })

    test('should handle authentication errors gracefully', async () => {
      // Navigate to login
      await page.goto('http://localhost:3000/login')
      await page.waitForLoadState('domcontentloaded')
      
      // Fill with invalid credentials
      await page.fill('[data-testid="email-input"]', 'invalid@example.com')
      await page.fill('[data-testid="password-input"]', 'wrongpassword')
      
      // Submit form
      await page.click('[data-testid="login-btn"]')
      
      // Should show error message
      await expect(page.locator('[data-testid="login-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid credentials')
    })
  })

  test.describe('Main Application Features', () => {
    test.beforeEach(async () => {
      // Mock authentication state
      await page.goto('http://localhost:3000/dashboard')
      await page.waitForLoadState('domcontentloaded')
    })

    test('should navigate between main application sections', async () => {
      // Test navigation to tasks
      await page.click('[data-testid="nav-tasks"]')
      await expect(page.locator('[data-testid="tasks-page"]')).toBeVisible()
      
      // Test navigation to notes
      await page.click('[data-testid="nav-notes"]')
      await expect(page.locator('[data-testid="notes-page"]')).toBeVisible()
      
      // Test navigation to study groups
      await page.click('[data-testid="nav-groups"]')
      await expect(page.locator('[data-testid="groups-page"]')).toBeVisible()
      
      // Test navigation to files
      await page.click('[data-testid="nav-files"]')
      await expect(page.locator('[data-testid="files-page"]')).toBeVisible()
    })

    test('should create and manage tasks', async () => {
      // Navigate to tasks
      await page.click('[data-testid="nav-tasks"]')
      await page.waitForLoadState('domcontentloaded')
      
      // Create new task
      await page.click('[data-testid="create-task-btn"]')
      await page.fill('[data-testid="task-title-input"]', 'Test Task')
      await page.fill('[data-testid="task-description-input"]', 'This is a test task')
      await page.selectOption('[data-testid="task-priority-select"]', 'high')
      
      // Save task
      await page.click('[data-testid="save-task-btn"]')
      
      // Should appear in task list
      await expect(page.locator('[data-testid="task-item"]')).toContainText('Test Task')
    })

    test('should create and edit notes', async () => {
      // Navigate to notes
      await page.click('[data-testid="nav-notes"]')
      await page.waitForLoadState('domcontentloaded')
      
      // Create new note
      await page.click('[data-testid="create-note-btn"]')
      await page.fill('[data-testid="note-title-input"]', 'Test Note')
      
      // Use TipTap editor
      await page.click('[data-testid="note-editor"]')
      await page.type('[data-testid="note-editor"]', 'This is a test note with some content.')
      
      // Save note
      await page.click('[data-testid="save-note-btn"]')
      
      // Should appear in notes list
      await expect(page.locator('[data-testid="note-item"]')).toContainText('Test Note')
    })

    test('should handle file uploads and management', async () => {
      // Navigate to files
      await page.click('[data-testid="nav-files"]')
      await page.waitForLoadState('domcontentloaded')
      
      // Test file upload (mock file)
      const fileInput = page.locator('[data-testid="file-upload-input"]')
      await fileInput.setInputFiles({
        name: 'test-document.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mock PDF content')
      })
      
      // Should show upload progress
      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible()
      
      // Should appear in files list after upload
      await expect(page.locator('[data-testid="file-item"]')).toContainText('test-document.pdf')
    })
  })

  test.describe('Desktop-Specific Features', () => {
    test('should handle desktop notifications', async () => {
      // Navigate to settings
      await page.goto('http://localhost:3000/settings')
      await page.waitForLoadState('domcontentloaded')
      
      // Enable notifications
      await page.check('[data-testid="enable-notifications-checkbox"]')
      
      // Test notification trigger
      await page.click('[data-testid="test-notification-btn"]')
      
      // Should trigger desktop notification (we can't directly test the OS notification,
      // but we can verify the IPC call was made)
      await expect(page.locator('[data-testid="notification-sent"]')).toBeVisible()
    })

    test('should handle window controls', async () => {
      // Test minimize functionality
      await page.click('[data-testid="minimize-btn"]')
      
      // Test maximize functionality
      await page.click('[data-testid="maximize-btn"]')
      
      // Test fullscreen toggle
      await page.keyboard.press('F11')
      
      // Should handle fullscreen state
      await expect(page.locator('[data-testid="fullscreen-indicator"]')).toBeVisible()
    })

    test('should handle keyboard shortcuts', async () => {
      // Test global shortcuts
      await page.keyboard.press('Control+Shift+N') // New note
      await expect(page.locator('[data-testid="note-editor"]')).toBeVisible()
      
      await page.keyboard.press('Control+Shift+T') // New task
      await expect(page.locator('[data-testid="task-form"]')).toBeVisible()
      
      await page.keyboard.press('Control+Shift+S') // Search
      await expect(page.locator('[data-testid="search-dialog"]')).toBeVisible()
    })

    test('should handle drag and drop file operations', async () => {
      // Navigate to files page
      await page.goto('http://localhost:3000/files')
      await page.waitForLoadState('domcontentloaded')
      
      // Simulate drag and drop
      const dropZone = page.locator('[data-testid="drag-drop-zone"]')
      
      // Create a mock file for drag and drop
      const dataTransfer = await page.evaluateHandle(() => new DataTransfer())
      
      // Trigger drag enter
      await dropZone.dispatchEvent('dragenter', { dataTransfer })
      await expect(dropZone).toHaveClass(/drag-over/)
      
      // Trigger drop
      await dropZone.dispatchEvent('drop', { dataTransfer })
      
      // Should show upload processing
      await expect(page.locator('[data-testid="processing-upload"]')).toBeVisible()
    })
  })

  test.describe('Error Handling and Recovery', () => {
    test('should handle network connectivity issues', async () => {
      // Simulate offline mode
      await page.context().setOffline(true)
      
      // Try to perform an action that requires network
      await page.click('[data-testid="sync-data-btn"]')
      
      // Should show offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
      
      // Restore connectivity
      await page.context().setOffline(false)
      
      // Should automatically retry and hide offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible()
    })

    test('should handle application crashes gracefully', async () => {
      // Simulate a renderer crash (this is a mock scenario)
      await page.evaluate(() => {
        // Trigger an error that would normally crash the renderer
        throw new Error('Simulated renderer crash')
      })
      
      // The error boundary should catch this and show recovery UI
      await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible()
      await expect(page.locator('[data-testid="reload-app-btn"]')).toBeVisible()
      
      // Test recovery
      await page.click('[data-testid="reload-app-btn"]')
      await page.waitForLoadState('domcontentloaded')
      
      // Should return to normal state
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
    })

    test('should handle update notifications', async () => {
      // Mock update available
      await page.evaluate(() => {
        window.electronAPI?.onUpdateAvailable?.({
          version: '1.1.0',
          releaseNotes: 'Bug fixes and improvements'
        })
      })
      
      // Should show update notification
      await expect(page.locator('[data-testid="update-notification"]')).toBeVisible()
      await expect(page.locator('[data-testid="update-version"]')).toContainText('1.1.0')
      
      // Test update actions
      await page.click('[data-testid="download-update-btn"]')
      await expect(page.locator('[data-testid="update-progress"]')).toBeVisible()
    })
  })

  test.describe('Performance and Responsiveness', () => {
    test('should load main application within acceptable time', async () => {
      const startTime = Date.now()
      
      await page.goto('http://localhost:3000/dashboard')
      await page.waitForLoadState('domcontentloaded')
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
      
      const loadTime = Date.now() - startTime
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000)
    })

    test('should handle large datasets efficiently', async () => {
      // Navigate to tasks with large dataset
      await page.goto('http://localhost:3000/tasks')
      await page.waitForLoadState('domcontentloaded')
      
      // Mock large number of tasks
      await page.evaluate(() => {
        const mockTasks = Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          title: `Task ${i}`,
          description: `Description for task ${i}`,
          completed: i % 3 === 0
        }))
        
        // Simulate loading large dataset
        window.mockLargeDataset = mockTasks
      })
      
      // Should still be responsive
      const startTime = Date.now()
      await page.click('[data-testid="filter-completed-tasks"]')
      const filterTime = Date.now() - startTime
      
      // Filtering should be fast even with large dataset
      expect(filterTime).toBeLessThan(1000)
    })

    test('should maintain smooth animations and transitions', async () => {
      // Test landing page transitions
      await page.goto('http://localhost:3000/desktop-landing')
      await page.waitForLoadState('domcontentloaded')
      
      // Measure transition performance
      const startTime = Date.now()
      await page.click('[data-testid="next-section-btn"]')
      
      // Wait for transition to complete
      await page.waitForFunction(() => {
        const section = document.querySelector('[data-testid="features-section"]')
        return section && getComputedStyle(section).opacity === '1'
      })
      
      const transitionTime = Date.now() - startTime
      
      // Transition should be smooth (under 500ms)
      expect(transitionTime).toBeLessThan(500)
    })
  })
})