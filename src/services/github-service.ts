/**
 * GitHub Service
 *
 * Handles GitHub API interactions for fetching repository collaborators
 * and merging them with configured team members.
 */

import * as core from '@actions/core'
import type { getOctokit } from '@actions/github'
import type { TeamMember } from '../types.js'
import { normalizeEmail } from '../utils.js'

type GitHubClient = ReturnType<typeof getOctokit>
type PermissionLevel = 'admin' | 'write' | 'read'

/**
 * Service for interacting with GitHub API
 */
export class GitHubService {
  constructor(private octokit: GitHubClient) {}

  /**
   * Fetches collaborators from a GitHub repository with optional permission filtering
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param filter - Optional array of permission levels to filter by ('admin', 'write', 'read')
   * @returns Array of team members with their emails and roles
   */
  async fetchCollaborators(
    owner: string,
    repo: string,
    filter?: PermissionLevel[]
  ): Promise<TeamMember[]> {
    core.info(`Fetching collaborators for ${owner}/${repo}`)

    try {
      const { data: collaborators } =
        await this.octokit.rest.repos.listCollaborators({
          owner,
          repo,
          affiliation: 'direct'
        })

      core.info(`Found ${collaborators.length} collaborators`)

      const members: TeamMember[] = []

      for (const collab of collaborators) {
        const member = await this.processCollaborator(collab, filter)
        if (member) {
          members.push(member)
          core.debug(
            `Added collaborator: ${member.user} (${member.relationship})`
          )
        }
      }

      core.info(`Processed ${members.length} collaborators`)
      return members
    } catch (error) {
      const message = `Failed to fetch collaborators: ${(error as Error).message}`
      core.error(message)
      throw error
    }
  }

  /**
   * Processes a single collaborator, fetching their email and determining their role
   * @param collab - Collaborator object from GitHub API
   * @param owner - Repository owner
   * @param repo - Repository name
   * @returns Team member object or null if email cannot be retrieved
   */
  private async processCollaborator(
    collab: {
      login: string
      permissions?: { admin?: boolean; push?: boolean; pull?: boolean }
    },
    filter?: PermissionLevel[]
  ): Promise<TeamMember | null> {
    const permission = this.getPermissionLevel(collab.permissions)

    if (filter && !filter.includes(permission)) {
      core.debug(`Skipping ${collab.login} (permission: ${permission})`)
      return null
    }

    const email = await this.getUserEmail(collab.login)
    if (!email) {
      core.warning(`Could not find email for user: ${collab.login}`)
      return null
    }

    return {
      user: email,
      relationship: permission === 'admin' ? 'ADMIN' : 'MEMBER'
    }
  }

  /**
   * Determines the permission level from GitHub permissions object
   * @param permissions - GitHub permissions object
   * @returns Permission level string ('admin', 'write', or 'read')
   */
  private getPermissionLevel(permissions?: {
    admin?: boolean
    push?: boolean
    pull?: boolean
  }): PermissionLevel {
    if (permissions?.admin) return 'admin'
    if (permissions?.push) return 'write'
    return 'read'
  }

  /**
   * Fetches the email address for a GitHub user
   * @param username - GitHub username
   * @returns Email address or null if not found/public
   */
  private async getUserEmail(username: string): Promise<string | null> {
    try {
      const { data: user } = await this.octokit.rest.users.getByUsername({
        username
      })
      return user.email
    } catch (error) {
      core.debug(
        `Failed to fetch email for ${username}: ${(error as Error).message}`
      )
      return null
    }
  }

  /**
   * Merges configured members with GitHub collaborators
   * Configured members take precedence
   */
  static mergeMembers(
    configMembers: TeamMember[],
    githubMembers: TeamMember[]
  ): TeamMember[] {
    const memberMap = new Map<string, TeamMember>()

    // Add configured members first (they take precedence)
    configMembers.forEach((member) => {
      memberMap.set(normalizeEmail(member.user), member)
    })

    // Add GitHub members if not already present
    githubMembers.forEach((member) => {
      const normalizedEmail = normalizeEmail(member.user)
      if (!memberMap.has(normalizedEmail)) {
        memberMap.set(normalizedEmail, member)
      }
    })

    return Array.from(memberMap.values())
  }
}
