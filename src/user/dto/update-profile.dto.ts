import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  // Only the avatar URL may be self-updated. Any other field (role,
  // passwordHash, email, …) is stripped by the global whitelist ValidationPipe.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  avatar?: string;
}
