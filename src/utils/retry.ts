/**
 * Retry utility with exponential backoff
 */

import * as core from '@actions/core'
import { sleep } from '../utils.js'
import { VeracodeActionError, isRetryable } from '../errors.js'

/**
 * Executes a function with exponential backoff retry logic
 * @param operation Function to execute
 * @param operationName Name of the operation for logging
 * @param maxAttempts Maximum total number of attempts (1 initial + N retries)
 * @returns Result of the operation
 * @throws Error if all attempts are exhausted
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxAttempts: number = 3
): Promise<T> {
  // Start at 1: maxAttempts=3 means 1 initial + 2 retries = 3 total attempts
  let attempt = 1

  while (attempt <= maxAttempts) {
    try {
      return await operation()
    } catch (error) {
      const err = error as VeracodeActionError
      const shouldRetry =
        err.retryable || isRetryable(err.category, err.statusCode)

      if (!shouldRetry || attempt >= maxAttempts) {
        core.error(
          `Operation failed after ${attempt} attempts: ${operationName}`
        )
        throw error
      }

      // Exponential backoff: 1s, 2s, 4s, 8s...
      const backoffDelay = Math.pow(2, attempt) * 1000
      core.warning(
        `${operationName} failed (attempt ${attempt}/${maxAttempts}). ` +
          `Retrying in ${backoffDelay}ms... Error: ${err.message}`
      )

      await sleep(backoffDelay)
      attempt++
    }
  }

  throw new Error(
    `Operation failed after ${maxAttempts} attempts: ${operationName}`
  )
}
