export class ContributorResponseDto {
  login: string;
  avatar_url: string;
  contributions: number;
  repositories: { name: string; contributions: number }[];
  followers: number;
  public_repos: number;
  public_gists: number;
  name: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
}

export class PaginatedContributorsResponseDto {
  data: ContributorResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ContributorDetailResponseDto {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  contributionStats: {
    contributions: number;
    repositories: { name: string; contributions: number }[];
  };
}