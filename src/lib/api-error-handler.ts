/**
 * API Error Handler Utility
 * Provides consistent error handling for API calls
 */

export interface ApiErrorResponse {
  error: string
  details?: any
  status?: number
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Handle API response errors consistently
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiErrorResponse
    
    try {
      errorData = await response.json()
    } catch {
      errorData = {
        error: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status
      }
    }

    // Create user-friendly error messages based on status codes
    let userMessage = errorData.error

    switch (response.status) {
      case 401:
        userMessage = 'Please log in to continue'
        break
      case 403:
        userMessage = errorData.error || 'You do not have permission to perform this action'
        break
      case 404:
        userMessage = 'The requested resource was not found'
        break
      case 500:
        userMessage = 'Server error. Please try again later'
        break
      default:
        userMessage = errorData.error || 'An unexpected error occurred'
    }

    throw new ApiError(userMessage, response.status, errorData.details)
  }

  return response.json()
}

/**
 * Make an API request with consistent error handling
 */
export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    return handleApiResponse<T>(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error. Please check your connection.', 0)
    }

    // Handle other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0
    )
  }
}