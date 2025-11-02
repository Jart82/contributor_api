import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class RepositoryContributorDto {
  @ApiProperty()
  @IsString()
  login: string;

  @ApiProperty()
  @IsString()
  avatar_url: string;

  @ApiProperty()
  @IsInt()
  contributions: number;

  @ApiProperty()
  @IsString()
  profile_url: string;
}



