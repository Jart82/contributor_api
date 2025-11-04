export interface GitHubRepository {
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