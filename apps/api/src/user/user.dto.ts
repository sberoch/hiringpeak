import { ApiProperty, PartialType } from '@nestjs/swagger';
import { PaginationParams } from '../common/pagination/pagination.params';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { UserRole } from '@workspace/shared/enums';
import { Transform } from 'class-transformer';
import {
  UserQueryParams as UserQueryParamsType,
  UpdateUserDto as UpdateUserDtoType,
  CreateUserDto as CreateUserDtoType,
} from '@workspace/shared/models/user';

export class CreateUserDto implements CreateUserDtoType {
  @ApiProperty({ example: 'test@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '12345678' })
  password: string;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: UserRole })
  @IsOptional()
  @IsNotEmpty()
  role: UserRole;

  @ApiProperty({ example: true })
  @IsOptional()
  active?: boolean;
}

export class UpdateUserDto
  extends PartialType(CreateUserDto)
  implements UpdateUserDtoType
{
  lastLogin?: Date;
}

export class UserQueryParams
  extends PaginationParams
  implements UserQueryParamsType
{
  @ApiProperty({ required: false })
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ required: false, enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ required: false, enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  excludeRole?: UserRole;
}
