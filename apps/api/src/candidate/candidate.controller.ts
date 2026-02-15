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
import { CandidateService } from './candidate.service';
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  CandidateQueryParams,
  BlacklistCandidateDto,
} from './candidate.dto';
import { CurrentUser } from '../auth/auth.decorators';
import type { User } from '@workspace/shared/schemas';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { PermissionCode } from '@workspace/shared/enums';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';

@ApiBearerAuth()
@UseGuards(OrganizationGuard, PermissionsGuard)
@ApiTags('Candidates')
@Controller('candidate')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @ApiOkResponse()
  @Get()
  @Permissions(PermissionCode.CANDIDATE_READ)
  async findAll(
    @Query() query: CandidateQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get('exists')
  @Permissions(PermissionCode.CANDIDATE_READ)
  async exists(
    @Query('name') name: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateService.existsByName(name, organizationId);
  }

  @ApiOkResponse()
  @Get(':id')
  @Permissions(PermissionCode.CANDIDATE_READ)
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateService.findOne(+id, organizationId);
  }

  @ApiCreatedResponse()
  @AuditAction({ eventType: 'create_candidate', entityType: 'candidate' })
  @Post()
  @Permissions(PermissionCode.CANDIDATE_MANAGE)
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
  @AuditAction({ eventType: 'blacklist_candidate', entityType: 'candidate' })
  @Post(':id/blacklist')
  @Permissions(PermissionCode.CANDIDATE_MANAGE)
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
  @AuditAction({ eventType: 'update_candidate', entityType: 'candidate' })
  @Patch(':id')
  @Permissions(PermissionCode.CANDIDATE_MANAGE)
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
  @AuditAction({ eventType: 'delete_candidate', entityType: 'candidate' })
  @Delete(':id')
  @Permissions(PermissionCode.CANDIDATE_MANAGE)
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateService.remove(+id, organizationId);
  }
}
