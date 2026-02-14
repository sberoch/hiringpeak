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
import { ClsService } from 'nestjs-cls';
import { OrganizationId } from 'src/auth/organization/organization.decorator';
import { CurrentUserStore } from '../auth/auth.currentuser.store';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import { AreaQueryParamsDto, CreateAreaDto, UpdateAreaDto } from './area.dto';
import { AreaService } from './area.service';

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
  async findAll(
    @Query() query: AreaQueryParamsDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.areaService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.areaService.findOne(+id, organizationId);
  }

  @Roles(UserRole.ADMIN)
  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() createAreaDto: CreateAreaDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.areaService.create(createAreaDto, organizationId);
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAreaDto: UpdateAreaDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.areaService.update(+id, updateAreaDto, organizationId);
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.areaService.remove(+id, organizationId);
  }
}
