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
import { IndustryService } from './industry.service';
import {
  CreateIndustryDto,
  UpdateIndustryDto,
  IndustryQueryParams,
} from './industry.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '@workspace/shared/enums';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(RolesGuard, OrganizationGuard)
@ApiTags('Industries')
@Controller('industry')
export class IndustryController {
  constructor(private readonly industryService: IndustryService) {}

  @ApiOkResponse()
  @Get()
  async findAll(
    @Query() query: IndustryQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.industryService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.industryService.findOne(+id, organizationId);
  }

  @Roles(UserRole.ADMIN)
  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() createIndustryDto: CreateIndustryDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.industryService.create({
      ...createIndustryDto,
      organizationId,
    });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateIndustryDto: UpdateIndustryDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.industryService.update(+id, {
      ...updateIndustryDto,
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
    return this.industryService.remove(+id, organizationId);
  }
}
