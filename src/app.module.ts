import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ContributorsModule } from './contributors/contributors.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { CacheModule } from './cache/cache.module';
import { GithubModule } from './github/github.module';

@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true,
    }),AuthModule, ContributorsModule, RepositoriesModule, CacheModule, GithubModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
