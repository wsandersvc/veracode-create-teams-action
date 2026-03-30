/**
 * Utility functions for Veracode Create Teams Action
 */

/**
 * Normalizes an email address to lowercase
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Delays execution for a specified number of milliseconds
 * @param ms - Number of milliseconds to sleep
 * @returns Promise that resolves after the specified delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Interpolates template variables in a string
 * @example interpolateTemplate("{repository_name} Team", {repository_name: "my-app"}) => "my-app Team"
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] || match
  })
}
