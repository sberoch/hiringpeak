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
import { CandidateSourceService } from './candidatesource.service';
import {
  CreateCandidateSourceDto,
  UpdateCandidateSourceDto,
  CandidateSourceQueryParams,
} from './candidatesource.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { UserRole } from '@workspace/shared/enums';
import { Roles } from '../auth/roles/roles.decorator';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(RolesGuard, OrganizationGuard)
@ApiTags('CandidateSources')
@Controller('candidateSource')
export class CandidateSourceController {
  constructor(
    private readonly candidateSourceService: CandidateSourceService,
  ) {}

  @ApiOkResponse()
  @Get()
  async findAll(
    @Query() query: CandidateSourceQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateSourceService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateSourceService.findOne(+id, organizationId);
  }

  @Roles(UserRole.ADMIN)
  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() createCandidateSourceDto: CreateCandidateSourceDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateSourceService.create({
      ...createCandidateSourceDto,
      organizationId,
    });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCandidateSourceDto: UpdateCandidateSourceDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateSourceService.update(+id, {
      ...updateCandidateSourceDto,
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
    return this.candidateSourceService.remove(+id, organizationId);
  }
}
