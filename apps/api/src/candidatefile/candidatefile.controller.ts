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
import { CandidateFileService } from './candidatefile.service';
import {
  CreateCandidateFileDto,
  UpdateCandidateFileDto,
  CandidateFileQueryParams,
} from './candidatefile.dto';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(OrganizationGuard)
@ApiTags('CandidateFiles')
@Controller('candidatefile')
export class CandidateFileController {
  constructor(private readonly candidateFileService: CandidateFileService) {}

  @ApiOkResponse()
  @Get()
  async findAll(
    @Query() query: CandidateFileQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateFileService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateFileService.findOne(+id, organizationId);
  }

  @ApiCreatedResponse()
  @AuditAction({ eventType: 'create_candidate_file', entityType: 'candidate_file' })
  @Post()
  async create(
    @Body() createCandidateFileDto: CreateCandidateFileDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateFileService.create({
      ...createCandidateFileDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @AuditAction({ eventType: 'update_candidate_file', entityType: 'candidate_file' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCandidateFileDto: UpdateCandidateFileDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateFileService.update(+id, {
      ...updateCandidateFileDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @AuditAction({ eventType: 'delete_candidate_file', entityType: 'candidate_file' })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateFileService.remove(+id, organizationId);
  }
}
