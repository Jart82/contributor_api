import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ContributorsService } from './contributors.service';
import { ContributorQueryDto } from './dtos/contributor-query.dto';
import {
  PaginatedContributorsResponseDto,
  ContributorDetailResponseDto,
} from './dtos/contributor-response.dto';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthenticatedGuard } from 'src/auth/gaurds/auth.gaurd';

@ApiTags('contributors')
@Controller('contributors')
export class ContributorsController {
  constructor(private readonly contributorsService: ContributorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all contributors with sorting and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated contributors',
    type: PaginatedContributorsResponseDto,
  })
  async getContributors(
    @Query() query: ContributorQueryDto,
  ): Promise<PaginatedContributorsResponseDto> {
    return await this.contributorsService.getContributors(query);
  }

  @Get(':username')
  @ApiOperation({ summary: 'Get contributor details' })
  @ApiResponse({
    status: 200,
    description: 'Returns contributor details',
    type: ContributorDetailResponseDto,
  })
  async getContributorDetails(
    @Param('username') username: string,
  ): Promise<ContributorDetailResponseDto> {
    return await this.contributorsService.getContributorDetails(username);
  }

  @Post(':username/like')
  @UseGuards(AuthenticatedGuard)
  @ApiOperation({ summary: 'Like/bookmark a contributor' })
  async likeContributor(@Param('username') username: string, @Req() req) {
    return await this.contributorsService.toggleLike(username, req.user.username);
  }

  @Get('user/likes')
  @UseGuards(AuthenticatedGuard)
  @ApiOperation({ summary: 'Get user liked contributors' })
  async getUserLikes(@Req() req): Promise<string[]> {
    return await this.contributorsService.getUserLikes(req.user.username);
  }
}