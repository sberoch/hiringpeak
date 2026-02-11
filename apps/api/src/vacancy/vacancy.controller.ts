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
import { VacancyService } from './vacancy.service';
import {
  CreateVacancyDto,
  UpdateVacancyDto,
  VacancyQueryParams,
} from './vacancy.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(RolesGuard, OrganizationGuard)
@ApiTags('Vacancies')
@Controller('vacancy')
export class VacancyController {
  constructor(private readonly vacancyService: VacancyService) {}

  @ApiOkResponse()
  @Get()
  async findAll(
    @Query() query: VacancyQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyService.findOne(+id, organizationId);
  }

  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() createVacancyDto: CreateVacancyDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyService.create({
      ...createVacancyDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVacancyDto: UpdateVacancyDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyService.update(+id, {
      ...updateVacancyDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyService.remove(+id, organizationId);
  }
}
