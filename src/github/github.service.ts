import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { CacheService } from '../cache/cache.service';
import { GitHubUser, GitHubContributor, AggregatedContributor } from './github.types';

@Injectable()
export class GithubService {
  private octokit: Octokit;
  private readonly ORG_NAME = 'angular';

  constructor(private cacheService: CacheService) {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  async getAllRepositories(): Promise<any[]> {
    const cacheKey = `repos:${this.ORG_NAME}`;
    const cached = await this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await this.octokit.repos.listForOrg({
        org: this.ORG_NAME,
        per_page: 100,
      });

      const repos = data as any[];
      await this.cacheService.set(cacheKey, repos, 3600); // Cache for 1 hour
      return repos;
    } catch (error) {
      this.handleRateLimit(error);
      throw new HttpException('Failed to fetch repositories', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getRepositoryContributors(repoName: string): Promise<GitHubContributor[]> {
    const cacheKey = `contributors:${this.ORG_NAME}:${repoName}`;
    const cached = await this.cacheService.get<GitHubContributor[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await this.octokit.repos.listContributors({
        owner: this.ORG_NAME,
        repo: repoName,
        per_page: 100,
      });

      const contributors = data as GitHubContributor[];
      await this.cacheService.set(cacheKey, contributors, 7200); // Cache for 2 hours
      return contributors;
    } catch (error) {
      this.handleRateLimit(error);
      return [];
    }
  }

  async getUserDetails(username: string): Promise<GitHubUser> {
    const cacheKey = `user:${username}`;
    const cached = await this.cacheService.get<GitHubUser>(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await this.octokit.users.getByUsername({ username });
      const user = data as GitHubUser;
      await this.cacheService.set(cacheKey, user, 3600);
      return user;
    } catch (error) {
      this.handleRateLimit(error);
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
  }

  async aggregateContributors(): Promise<AggregatedContributor[]> {
    const cacheKey = 'aggregated:contributors';
    const cached = await this.cacheService.get<AggregatedContributor[]>(cacheKey);
    if (cached) return cached;

    const repositories = await this.getAllRepositories();
    const contributorMap = new Map<string, AggregatedContributor>();

    // Fetch contributors from each repository
    for (const repo of repositories) {
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
    return result;
  }

  private handleRateLimit(error: any) {
    if (error.status === 403 && error.response?.headers['x-ratelimit-remaining'] === '0') {
      const resetTime = error.response.headers['x-ratelimit-reset'];
      throw new HttpException(
        `GitHub API rate limit exceeded. Resets at ${new Date(resetTime * 1000)}`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}