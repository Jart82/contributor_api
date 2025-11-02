import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [GithubService],
  exports: [GithubService], 
})
export class GithubModule {}