import {
  BadRequestException,
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
} from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { ClsService } from 'nestjs-cls';
import { AreaService } from './area.service';
import { CreateAreaDto, UpdateAreaDto, AreaQueryParams } from './area.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { UserRole } from '@workspace/shared/enums';
import { Roles } from '../auth/roles/roles.decorator';
import { CurrentUserStore } from '../auth/auth.currentuser.store';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('Areas')
@Controller('area')
export class AreaController {
  constructor(
    private readonly areaService: AreaService,
    private readonly cls: ClsService<CurrentUserStore>,
  ) {}

  @ApiOkResponse()
  @Get()
  async findAll(@Query() query: AreaQueryParams) {
    return this.areaService.findAll(query);
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.areaService.findOne(+id);
  }

  @Roles(UserRole.ADMIN)
  @ApiCreatedResponse()
  @Post()
  async create(@Body() createAreaDto: CreateAreaDto) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) throw new BadRequestException('Organization context required');
    return this.areaService.create({ ...createAreaDto, organizationId });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateAreaDto: UpdateAreaDto) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) throw new BadRequestException('Organization context required');
    return this.areaService.update(+id, { ...updateAreaDto, organizationId });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.areaService.remove(+id);
  }
}
