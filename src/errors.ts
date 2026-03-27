/**
 * Error handling framework for Veracode Create Teams Action
 */

/**
 * Error categories for different failure scenarios
 */
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  API_ERROR = 'api_error',
  NETWORK = 'network',
  CONFIGURATION = 'configuration',
  NOT_FOUND = 'not_found'
}

/**
 * Custom error class with category and retry information
 */
export class VeracodeActionError extends Error {
  constructor(
    message: string,
    public readonly category: ErrorCategory,
    public readonly retryable: boolean = false,
    public readonly statusCode?: number,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'VeracodeActionError'
    Object.setPrototypeOf(this, VeracodeActionError.prototype)
  }
}

/**
 * HTTP status code to error category mapping
 */
const STATUS_CODE_MAP: Record<number, ErrorCategory> = {
  400: ErrorCategory.VALIDATION,
  401: ErrorCategory.AUTHENTICATION,
  403: ErrorCategory.AUTHORIZATION,
  404: ErrorCategory.NOT_FOUND
}

/**
 * Network error codes
 */
const NETWORK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ENETUNREACH'
])

/**
 * Retryable HTTP status codes
 */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504])

/**
 * Categorizes an error based on its properties
 */
export function categorizeError(error: Error | unknown): ErrorCategory {
  if (error instanceof VeracodeActionError) {
    return error.category
  }

  const err = error as {
    response?: { status?: number }
    code?: string
  }

  // Check HTTP status codes
  if (err.response?.status) {
    const status = err.response.status
    if (STATUS_CODE_MAP[status]) {
      return STATUS_CODE_MAP[status]
    }
    if (status >= 500) {
      return ErrorCategory.API_ERROR
    }
  }

  // Check network errors
  if (err.code && NETWORK_ERROR_CODES.has(err.code)) {
    return ErrorCategory.NETWORK
  }

  return ErrorCategory.CONFIGURATION
}

/**
 * Determines if an error is retryable based on category and status code
 */
export function isRetryable(
  category: ErrorCategory,
  statusCode?: number
): boolean {
  if (statusCode && RETRYABLE_STATUS_CODES.has(statusCode)) {
    return true
  }

  return category === ErrorCategory.NETWORK
}

/**
 * Error category to user-friendly message prefix mapping
 */
const ERROR_MESSAGE_PREFIXES: Record<ErrorCategory, string> = {
  [ErrorCategory.AUTHENTICATION]:
    'Authentication failed. Please check your Veracode API credentials.',
  [ErrorCategory.AUTHORIZATION]:
    'Authorization failed. Ensure your API user has Team Admin permissions.',
  [ErrorCategory.VALIDATION]:
    'Validation error. Check your input parameters and configuration.',
  [ErrorCategory.API_ERROR]:
    'Veracode API error. The service may be temporarily unavailable.',
  [ErrorCategory.NETWORK]:
    'Network error. Please check your connection and try again.',
  [ErrorCategory.CONFIGURATION]:
    'Configuration error. Please check your team-mapping.yaml file.',
  [ErrorCategory.NOT_FOUND]: 'Resource not found.'
}

/**
 * Creates a user-friendly error message based on error category
 */
export function getUserFriendlyMessage(
  category: ErrorCategory,
  originalMessage: string
): string {
  const prefix = ERROR_MESSAGE_PREFIXES[category] || ''
  return prefix ? `${prefix} ${originalMessage}` : originalMessage
}
