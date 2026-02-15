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
import { InternalUserGuard } from '../auth/internal-user.guard';
import { PermissionQueryParams, UpdatePermissionDto } from './permission.dto';
import { PermissionService } from './permission.service';

@ApiBearerAuth()
@UseGuards(InternalUserGuard)
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
