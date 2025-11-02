import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { RepositoriesService } from './repositories.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RepositoryDto } from './dtos/repository.dto';
import { RepositoryDetailDto } from './dtos/repository-detail.dto';

@ApiTags('repositories')
@Controller('repositories')
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Angular repositories' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of all repositories',
    type: [RepositoryDto],
  })
  async getRepositories(): Promise<RepositoryDto[]> {
    return await this.repositoriesService.getRepositories();
  }

  @Get(':repoName')
  @ApiOperation({ summary: 'Get repository details with contributors' })
  @ApiParam({
    name: 'repoName',
    description: 'Repository name',
    example: 'angular',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns repository details with contributors',
    type: RepositoryDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Repository not found',
  })
  async getRepositoryDetails(
    @Param('repoName') repoName: string,
  ): Promise<RepositoryDetailDto> {
    try {
      return await this.repositoriesService.getRepositoryDetails(repoName);
    } catch (error) {
      throw new HttpException(
        error.message || 'Repository not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}