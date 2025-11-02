import { Module } from '@nestjs/common';
import { ContributorsController } from './contributors.controller';
import { ContributorsService } from './contributors.service';
import { GithubModule } from '../github/github.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [GithubModule, CacheModule],
  controllers: [ContributorsController],
  providers: [ContributorsService],
})
export class ContributorsModule {}