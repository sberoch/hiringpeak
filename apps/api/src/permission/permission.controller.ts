import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@workspace/shared/enums';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import { PermissionQueryParams, UpdatePermissionDto } from './permission.dto';
import { PermissionService } from './permission.service';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.SYSTEM_ADMIN)
@ApiTags('Permissions')
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @ApiOkResponse()
  @Get()
  async findAll(@Query() query: PermissionQueryParams) {
    return this.permissionService.findAll(query);
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.permissionService.findOne(+id);
  }

  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(+id, updatePermissionDto);
  }
}
