import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString } from "class-validator";

export class RepositoryDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  full_name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsInt()
  stars: number;

  @ApiProperty()
  @IsInt()
  forks: number;

  @ApiProperty()
  @IsInt()
  watchers: number;

  @ApiProperty()
  @IsString()
  language: string;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty()
  @IsString()
  created_at: string;

  @ApiProperty()
  @IsString()
  updated_at: string;

  @ApiProperty()
  @IsInt()
  open_issues: number;

  @ApiProperty()
  @IsInt()
  default_branch: string;
}