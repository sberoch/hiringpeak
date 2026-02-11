import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@workspace/shared/enums';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { CreateUserDto, UpdateUserDto, UserQueryParams } from './user.dto';
import { UserService } from './user.service';

@ApiBearerAuth()
@UseGuards(RolesGuard, OrganizationGuard)
@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOkResponse()
  @Roles(UserRole.ADMIN)
  @Get()
  async findAll(
    @Query() query: UserQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.userService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.userService.findOne(+id, organizationId);
  }

  @ApiCreatedResponse()
  @Roles(UserRole.ADMIN)
  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.userService.create(createUserDto, organizationId);
  }

  @ApiOkResponse()
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.userService.update(+id, updateUserDto, organizationId);
  }

  @ApiOkResponse()
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.userService.remove(+id, organizationId);
  }
}
