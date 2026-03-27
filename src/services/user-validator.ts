/**
 * User Validator Service
 *
 * CRITICAL: The Veracode API will fail if you attempt to add users that don't
 * exist in the platform. This service validates all users before team operations.
 */

import * as core from '@actions/core'
import { VeracodeClient } from '../veracode/client.js'
import type {
  TeamMember,
  UserValidationResult,
  InvalidMember,
  VeracodeUser
} from '../types.js'
import { normalizeEmail } from '../utils.js'

/**
 * Validates team members against Veracode platform
 */
export class UserValidator {
  private userCache = new Map<string, VeracodeUser | null>()

  constructor(private veracodeClient: VeracodeClient) {}

  /**
   * Validates all team members against Veracode platform
   */
  async validateTeamMembers(
    members: TeamMember[]
  ): Promise<UserValidationResult> {
    core.info(
      `Validating ${members.length} team members against Veracode platform...`
    )

    const validMembers: TeamMember[] = []
    const invalidMembers: InvalidMember[] = []

    for (const member of members) {
      const result = await this.validateUser(member.user)

      if (result.valid) {
        validMembers.push({
          user: result.veracodeUser!.user_name,
          relationship: this.determineRelationship(
            member.relationship,
            result.veracodeUser!
          )
        })
        core.debug(`✓ Validated user: ${member.user}`)
      } else {
        invalidMembers.push({ user: member.user, reason: result.reason })
        core.warning(`✗ Invalid user: ${member.user} - ${result.reason}`)
      }
    }

    this.logValidationSummary(validMembers.length, invalidMembers)
    return { validMembers, invalidMembers }
  }

  /**
   * Determines the appropriate relationship for a user
   */
  private determineRelationship(
    requestedRelationship: 'ADMIN' | 'MEMBER',
    user: VeracodeUser
  ): 'ADMIN' | 'MEMBER' {
    if (requestedRelationship === 'ADMIN' && !this.hasTeamAdminRole(user)) {
      core.warning(
        `User ${user.user_name} does not have the 'Team Admin' role. ` +
          `Downgrading relationship from ADMIN to MEMBER.`
      )
      return 'MEMBER'
    }
    return requestedRelationship
  }

  /**
   * Logs validation summary
   */
  private logValidationSummary(
    validCount: number,
    invalidMembers: InvalidMember[]
  ): void {
    core.info('Validation complete:')
    core.info(`  ✓ Valid members: ${validCount}`)
    core.info(`  ✗ Invalid members: ${invalidMembers.length}`)

    if (invalidMembers.length > 0) {
      core.warning(`${invalidMembers.length} users will be skipped:`)
      invalidMembers.forEach((invalid) => {
        core.warning(`  - ${invalid.user}: ${invalid.reason}`)
      })
    }
  }

  /**
   * Validates a single user
   */
  private async validateUser(emailOrUsername: string): Promise<{
    valid: boolean
    reason: string
    veracodeUser?: VeracodeUser
  }> {
    const normalizedKey = normalizeEmail(emailOrUsername)

    // Check cache first
    const cached = this.userCache.get(normalizedKey)
    if (cached !== undefined) {
      if (cached === null) {
        return {
          valid: false,
          reason: 'User does not exist in Veracode platform'
        }
      }
      if (!cached.active) {
        return { valid: false, reason: 'User account is inactive' }
      }
      return { valid: true, reason: '', veracodeUser: cached }
    }

    // Search for user in Veracode
    try {
      core.debug(`Checking if user exists in Veracode: ${emailOrUsername}`)

      const response = await this.veracodeClient.getUsers({
        search_term: emailOrUsername,
        pageable: { page: 0, size: 50 }
      })

      const user = response.users.find(
        (u) =>
          normalizeEmail(u.email_address) === normalizedKey ||
          normalizeEmail(u.user_name) === normalizedKey
      )

      if (!user) {
        core.debug(`User not found in Veracode: ${emailOrUsername}`)
        this.userCache.set(normalizedKey, null)
        return {
          valid: false,
          reason: 'User does not exist in Veracode platform'
        }
      }

      this.userCache.set(normalizedKey, user)

      if (!user.active) {
        core.debug(`User is inactive: ${emailOrUsername}`)
        return { valid: false, reason: 'User account is inactive' }
      }

      core.debug(`Found user in Veracode: ${user.user_name} (${user.user_id})`)
      return { valid: true, reason: '', veracodeUser: user }
    } catch (error) {
      core.warning(`Error checking user existence: ${(error as Error).message}`)
      return {
        valid: false,
        reason: `Failed to validate user: ${(error as Error).message}`
      }
    }
  }

  /**
   * Checks if a user has the Team Admin role
   */
  private hasTeamAdminRole(user: VeracodeUser): boolean {
    return (
      user.roles?.some(
        (role) => role.role_name?.toLowerCase() === 'teamadmin'
      ) ?? false
    )
  }

  /**
   * Clears the user cache
   */
  clearCache(): void {
    this.userCache.clear()
  }

  /**
   * Gets the size of the user cache
   */
  getCacheSize(): number {
    return this.userCache.size
  }
}
