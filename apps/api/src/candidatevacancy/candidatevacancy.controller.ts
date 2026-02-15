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
import { AuditAction } from '../audit-log/audit-action.decorator';
import { CandidateVacancyService } from './candidatevacancy.service';
import {
  CreateCandidateVacancyDto,
  UpdateCandidateVacancyDto,
  CandidateVacancyQueryParams,
} from './candidatevacancy.dto';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(OrganizationGuard)
@ApiTags('CandidateVacancies')
@Controller('candidateVacancy')
export class CandidateVacancyController {
  constructor(
    private readonly candidateVacancyService: CandidateVacancyService,
  ) {}

  @ApiOkResponse()
  @Get()
  async findAll(
    @Query() query: CandidateVacancyQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateVacancyService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateVacancyService.findOne(+id, organizationId);
  }

  @ApiCreatedResponse()
  @AuditAction({ eventType: 'create_candidate_vacancy', entityType: 'candidate_vacancy' })
  @Post()
  async create(
    @Body() createCandidateVacancyDto: CreateCandidateVacancyDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateVacancyService.create({
      ...createCandidateVacancyDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @AuditAction({ eventType: 'update_candidate_vacancy', entityType: 'candidate_vacancy' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCandidateVacancyDto: UpdateCandidateVacancyDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateVacancyService.update(+id, {
      ...updateCandidateVacancyDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @AuditAction({ eventType: 'delete_candidate_vacancy', entityType: 'candidate_vacancy' })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateVacancyService.remove(+id, organizationId);
  }
}
