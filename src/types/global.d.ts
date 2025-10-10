// Global type declarations for desktop API
declare global {
  interface Window {
    desktopAPI?: {
      getFileStats?: (filePath: string) => Promise<{
        success: boolean
        data?: {
          size: number
          modified: number
        }
        error?: string
      }>
      readFile?: (filePath: string) => Promise<{
        success: boolean
        data?: string | Buffer
        error?: string
      }>
      // Add other desktop API methods as needed
    }
  }
}

export { }
