import { ApiProperty } from "@nestjs/swagger";
import { RepositoryContributorDto } from "./repository-contributor.dto";
import { RepositoryDto } from "./repository.dto";

export class RepositoryDetailDto extends RepositoryDto {
  @ApiProperty({ type: [RepositoryContributorDto] })
  contributors: RepositoryContributorDto[];

  @ApiProperty()
  size: number;
}