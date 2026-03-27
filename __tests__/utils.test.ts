/**
 * Unit tests for utility functions (src/utils.ts)
 */

import { describe, expect, it } from '@jest/globals'
import { normalizeEmail, sleep, interpolateTemplate } from '../src/utils.js'

describe('utils.ts', () => {
  describe('normalizeEmail', () => {
    it('should convert email to lowercase', () => {
      expect(normalizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com')
    })

    it('should trim whitespace', () => {
      expect(normalizeEmail('  user@example.com  ')).toBe('user@example.com')
    })

    it('should handle already normalized email', () => {
      expect(normalizeEmail('user@example.com')).toBe('user@example.com')
    })

    it('should handle mixed case', () => {
      expect(normalizeEmail('UsEr@ExAmPlE.CoM')).toBe('user@example.com')
    })
  })

  describe('sleep', () => {
    it('should resolve after specified duration', async () => {
      const start = Date.now()
      await sleep(100)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(95) // Allow small variance
      expect(elapsed).toBeLessThan(200)
    })

    it('should resolve immediately for zero duration', async () => {
      const start = Date.now()
      await sleep(0)
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(50)
    })
  })

  describe('interpolateTemplate', () => {
    it('should replace single variable', () => {
      const result = interpolateTemplate('{name} Team', { name: 'MyApp' })
      expect(result).toBe('MyApp Team')
    })

    it('should replace multiple variables', () => {
      const result = interpolateTemplate('{org}/{repo}', {
        org: 'myorg',
        repo: 'myrepo'
      })
      expect(result).toBe('myorg/myrepo')
    })

    it('should leave undefined variables unchanged', () => {
      const result = interpolateTemplate('{name} {other}', { name: 'Test' })
      expect(result).toBe('Test {other}')
    })

    it('should handle no variables', () => {
      const result = interpolateTemplate('No variables here', {})
      expect(result).toBe('No variables here')
    })

    it('should handle empty template', () => {
      const result = interpolateTemplate('', { name: 'Test' })
      expect(result).toBe('')
    })

    it('should handle duplicate variables', () => {
      const result = interpolateTemplate('{name}-{name}', { name: 'Test' })
      expect(result).toBe('Test-Test')
    })
  })
})
