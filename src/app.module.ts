import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { ContributorsModule } from './contributors/contributors.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { GithubModule } from './github/github.module';
import { CacheModule } from './cache/cache.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Throttler expects either an array of throttler configs or an object with a
    // `throttlers` array. Keep the array form to match the installed package types.
    ThrottlerModule.forRoot([
      {
        ttl: 60, // 60 seconds
        limit: 100, // 100 requests per minute
      },
    ]),
    CacheModule,
    GithubModule,
    AuthModule,
    ContributorsModule,
    RepositoriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}