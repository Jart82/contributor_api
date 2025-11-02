import { Injectable } from '@nestjs/common';
import { GithubService } from '../github/github.service';
import { CacheService } from '../cache/cache.service';
import { ContributorQueryDto, SortBy } from './dtos/contributor-query.dto';
import {
  ContributorResponseDto,
  PaginatedContributorsResponseDto,
  ContributorDetailResponseDto,
} from './dtos/contributor-response.dto';

@Injectable()
export class ContributorsService {
  constructor(
    private githubService: GithubService,
    private cacheService: CacheService,
  ) {}

  async getContributors(
    query: ContributorQueryDto,
  ): Promise<PaginatedContributorsResponseDto> {
    // Get aggregated contributors
    const aggregatedContributors =
      await this.githubService.aggregateContributors();

    // Fetch additional details for each contributor
    const enrichedContributors: ContributorResponseDto[] = await Promise.all(
      aggregatedContributors.map(async (c) => {
        const details = await this.githubService.getUserDetails(c.login);
        return {
          login: c.login,
          avatar_url: c.avatar_url,
          contributions: c.contributions,
          repositories: c.repositories,
          followers: details.followers,
          public_repos: details.public_repos,
          public_gists: details.public_gists,
          name: details.name,
          bio: details.bio,
          location: details.location,
          company: details.company,
        };
      }),
    );

    // Apply search filter
    let contributors: ContributorResponseDto[];
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      contributors = enrichedContributors.filter(
        (c) =>
          c.login.toLowerCase().includes(searchLower) ||
          c.name?.toLowerCase().includes(searchLower),
      );
    } else {
      contributors = enrichedContributors;
    }

    // Apply sorting
    contributors.sort((a, b) => {
      const field = query.sortBy || SortBy.CONTRIBUTIONS;
      const order = query.sortOrder === 'asc' ? 1 : -1;

      // Handle null/undefined values
      const aValue = a[field] ?? 0;
      const bValue = b[field] ?? 0;

      return (aValue - bValue) * order;
    });

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContributors = contributors.slice(startIndex, endIndex);

    return {
      data: paginatedContributors,
      pagination: {
        page,
        limit,
        total: contributors.length,
        totalPages: Math.ceil(contributors.length / limit),
      },
    };
  }

  async getContributorDetails(
    username: string,
  ): Promise<ContributorDetailResponseDto> {
    const userDetails = await this.githubService.getUserDetails(username);
    const contributors = await this.githubService.aggregateContributors();
    const contributor = contributors.find((c) => c.login === username);

    return {
      ...userDetails,
      contributionStats: contributor || { contributions: 0, repositories: [] },
    };
  }

  async toggleLike(contributorUsername: string, userUsername: string) {
    const cacheKey = `likes:${userUsername}`;
    let likes: string[] =
      (await this.cacheService.get<string[]>(cacheKey)) || [];

    if (likes.includes(contributorUsername)) {
      likes = likes.filter((u) => u !== contributorUsername);
    } else {
      likes.push(contributorUsername);
    }

    await this.cacheService.set(cacheKey, likes, 86400 * 30); // 30 days
    return { liked: likes.includes(contributorUsername), likes };
  }

  async getUserLikes(username: string): Promise<string[]> {
    const cacheKey = `likes:${username}`;
    return (await this.cacheService.get<string[]>(cacheKey)) || [];
  }
}