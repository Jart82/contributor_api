import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GithubService } from '../github/github.service';

@Injectable()
export class RepositoriesService {
  constructor(private githubService: GithubService) {}

  async getRepositories() {
    try {
      const repos = await this.githubService.getAllRepositories();
      
      return repos.map((repo) => ({
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.watchers_count,
        language: repo.language,
        url: repo.html_url,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        open_issues: repo.open_issues_count,
        default_branch: repo.default_branch,
      }));
    } catch (error) {
      throw new HttpException(
        'Failed to fetch repositories',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getRepositoryDetails(repoName: string) {
    try {
      const repos = await this.githubService.getAllRepositories();
      const repo = repos.find((r) => r.name === repoName);
      
      if (!repo) {
        throw new HttpException(
          `Repository '${repoName}' not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      const contributors = await this.githubService.getRepositoryContributors(repoName);

      return {
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.watchers_count,
        language: repo.language,
        url: repo.html_url,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        open_issues: repo.open_issues_count,
        default_branch: repo.default_branch,
        size: repo.size,
        contributors: contributors.map((c) => ({
          login: c.login,
          avatar_url: c.avatar_url,
          contributions: c.contributions,
          profile_url: c.html_url,
        })),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch repository details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}