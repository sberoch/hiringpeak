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
} from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { SeniorityService } from './seniority.service';
import {
  CreateSeniorityDto,
  UpdateSeniorityDto,
  SeniorityQueryParams,
} from './seniority.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '@workspace/shared/enums';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(RolesGuard, OrganizationGuard)
@ApiTags('Seniorities')
@Controller('seniority')
export class SeniorityController {
  constructor(private readonly seniorityService: SeniorityService) {}

  @ApiOkResponse()
  @Get()
  async findAll(
    @Query() query: SeniorityQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.seniorityService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.seniorityService.findOne(+id, organizationId);
  }

  @Roles(UserRole.ADMIN)
  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() createSeniorityDto: CreateSeniorityDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.seniorityService.create({
      ...createSeniorityDto,
      organizationId,
    });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSeniorityDto: UpdateSeniorityDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.seniorityService.update(+id, {
      ...updateSeniorityDto,
      organizationId,
    });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.seniorityService.remove(+id, organizationId);
  }
}
