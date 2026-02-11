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
import { CandidateService } from './candidate.service';
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  CandidateQueryParams,
  BlacklistCandidateDto,
} from './candidate.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { CurrentUser } from '../auth/auth.decorators';
import type { User } from '@workspace/shared/schemas';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(RolesGuard, OrganizationGuard)
@ApiTags('Candidates')
@Controller('candidate')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @ApiOkResponse()
  @Get()
  async findAll(
    @Query() query: CandidateQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get('exists')
  async exists(
    @Query('name') name: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateService.existsByName(name, organizationId);
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateService.findOne(+id, organizationId);
  }

  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() createCandidateDto: CreateCandidateDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateService.create({
      ...createCandidateDto,
      organizationId,
    });
  }

  @ApiCreatedResponse()
  @Post(':id/blacklist')
  async blacklist(
    @Param('id') id: string,
    @Body() blacklistCandidateDto: BlacklistCandidateDto,
    @CurrentUser() user: User,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateService.blacklist(
      blacklistCandidateDto,
      user,
      +id,
      organizationId,
    );
  }

  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCandidateDto: UpdateCandidateDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateService.update(+id, {
      ...updateCandidateDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateService.remove(+id, organizationId);
  }
}
