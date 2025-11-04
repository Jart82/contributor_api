import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { CacheService } from '../cache/cache.service';
import { GitHubUser, GitHubContributor, AggregatedContributor } from './github.types';

interface GitHubRepository {
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  language: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  open_issues_count: number;
  default_branch: string;
  size: number;
}

@Injectable()
export class GithubService {
  private octokit: Octokit;
  private readonly ORG_NAME = 'angular';
  private readonly logger = new Logger(GithubService.name);

  constructor(private cacheService: CacheService) {
    const token = process.env.GITHUB_TOKEN;
    
    if (!token) {
      this.logger.warn('⚠️  GITHUB_TOKEN not set - API rate limits will be very low (60 requests/hour)');
    } else {
      this.logger.log('✅ GitHub token configured');
    }

    this.octokit = new Octokit({
      auth: token,
      request: {
        timeout: 10000, // 10 second timeout
      },
    });
  }

  async getAllRepositories(): Promise<GitHubRepository[]> {
    const cacheKey = `repos:${this.ORG_NAME}`;
    const cached = await this.cacheService.get<GitHubRepository[]>(cacheKey);
    if (cached) {
      this.logger.debug('Repositories loaded from cache');
      return cached;
    }

    try {
      this.logger.log(`Fetching repositories for organization: ${this.ORG_NAME}`);
      
      const { data, headers } = await this.octokit.repos.listForOrg({
        org: this.ORG_NAME,
        per_page: 100,
        type: 'public',
      });

      // Log rate limit info
      this.logger.log(`Rate limit remaining: ${headers['x-ratelimit-remaining']}/${headers['x-ratelimit-limit']}`);
      
      if (!data || data.length === 0) {
        throw new HttpException('No repositories found', HttpStatus.NOT_FOUND);
      }

      const repositories = data as unknown as GitHubRepository[];
      await this.cacheService.set(cacheKey, repositories, 3600); // Cache for 1 hour
      this.logger.log(`Successfully fetched ${repositories.length} repositories`);
      return repositories;
    } catch (error) {
      this.logger.error('Failed to fetch repositories:', error);
      
      // Check for specific error types
      if (error.status === 401) {
        throw new HttpException(
          'GitHub authentication failed. Please check GITHUB_TOKEN',
          HttpStatus.UNAUTHORIZED,
        );
      }
      
      if (error.status === 403) {
        this.handleRateLimit(error);
      }
      
      if (error.status === 404) {
        throw new HttpException(
          `Organization '${this.ORG_NAME}' not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        throw new HttpException(
          'GitHub API request timed out. Please try again.',
          HttpStatus.REQUEST_TIMEOUT,
        );
      }

      // Generic error
      throw new HttpException(
        error.message || 'Failed to fetch repositories from GitHub',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getRepositoryContributors(repoName: string): Promise<GitHubContributor[]> {
    const cacheKey = `contributors:${this.ORG_NAME}:${repoName}`;
    const cached = await this.cacheService.get<GitHubContributor[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data, headers } = await this.octokit.repos.listContributors({
        owner: this.ORG_NAME,
        repo: repoName,
        per_page: 100,
      });

      this.logger.debug(`Fetched ${data.length} contributors for ${repoName}. Rate limit: ${headers['x-ratelimit-remaining']}`);

      const contributors = data as unknown as GitHubContributor[];
      await this.cacheService.set(cacheKey, contributors, 7200); // Cache for 2 hours
      return contributors;
    } catch (error) {
      this.logger.warn(`Failed to fetch contributors for ${repoName}: ${error.message}`);
      this.handleRateLimit(error);
      return []; // Return empty array instead of throwing
    }
  }

  async getUserDetails(username: string): Promise<GitHubUser> {
    const cacheKey = `user:${username}`;
    const cached = await this.cacheService.get<GitHubUser>(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await this.octokit.users.getByUsername({ username });
      const user = data as unknown as GitHubUser;
      await this.cacheService.set(cacheKey, user, 3600);
      return user;
    } catch (error) {
      this.logger.warn(`Failed to fetch user ${username}: ${error.message}`);
      this.handleRateLimit(error);
      
      if (error.status === 404) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException(
        'Failed to fetch user details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async aggregateContributors(): Promise<AggregatedContributor[]> {
    const cacheKey = 'aggregated:contributors';
    const cached = await this.cacheService.get<AggregatedContributor[]>(cacheKey);
    if (cached) {
      this.logger.debug('Aggregated contributors loaded from cache');
      return cached;
    }

    this.logger.log('Aggregating contributors from all repositories...');
    const repositories = await this.getAllRepositories();
    const contributorMap = new Map<string, AggregatedContributor>();

    // Fetch contributors from each repository (limit to avoid rate limits)
    const reposToFetch = repositories.slice(0, 20); // Now TypeScript knows repositories is an array
    this.logger.log(`Processing ${reposToFetch.length} repositories...`);

    for (const repo of reposToFetch) {
      const contributors = await this.getRepositoryContributors(repo.name);
      
      for (const contributor of contributors) {
        if (!contributorMap.has(contributor.login)) {
          contributorMap.set(contributor.login, {
            login: contributor.login,
            avatar_url: contributor.avatar_url,
            contributions: 0,
            repositories: [],
          });
        }

        const existing = contributorMap.get(contributor.login)!;
        existing.contributions += contributor.contributions;
        existing.repositories.push({
          name: repo.name,
          contributions: contributor.contributions,
        });
      }
    }

    const result = Array.from(contributorMap.values());
    await this.cacheService.set(cacheKey, result, 1800); // Cache for 30 minutes
    this.logger.log(`Aggregated ${result.length} unique contributors`);
    return result;
  }

  private handleRateLimit(error: any): void {
    if (error.status === 403) {
      const rateLimitRemaining = error.response?.headers['x-ratelimit-remaining'];
      const rateLimitReset = error.response?.headers['x-ratelimit-reset'];
      
      if (rateLimitRemaining === '0' || rateLimitRemaining === 0) {
        const resetDate = rateLimitReset 
          ? new Date(parseInt(rateLimitReset) * 1000)
          : new Date(Date.now() + 3600000);
          
        throw new HttpException(
          `GitHub API rate limit exceeded. Resets at ${resetDate.toLocaleString()}. Please add GITHUB_TOKEN to .env for higher limits.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  // Helper method to check rate limit status
  async getRateLimitStatus(): Promise<{ core: any; search: any } | null> {
    try {
      const { data } = await this.octokit.rateLimit.get();
      return {
        core: data.resources.core,
        search: data.resources.search,
      };
    } catch (error) {
      this.logger.error('Failed to get rate limit status:', error);
      return null;
    }
  }
}