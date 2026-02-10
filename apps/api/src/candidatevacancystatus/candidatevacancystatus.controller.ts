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
import { CandidateVacancyStatusService } from './candidatevacancystatus.service';
import {
  CreateCandidateVacancyStatusDto,
  UpdateCandidateVacancyStatusDto,
  CandidateVacancyStatusQueryParams,
} from './candidatevacancystatus.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '@workspace/shared/enums';
import { CurrentUserStore } from '../auth/auth.currentuser.store';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('CandidateVacancyStatuses')
@Controller('candidateVacancyStatus')
export class CandidateVacancyStatusController {
  constructor(
    private readonly candidateVacancyStatusService: CandidateVacancyStatusService,
    private readonly cls: ClsService<CurrentUserStore>,
  ) {}

  @ApiOkResponse()
  @Get()
  async findAll(@Query() query: CandidateVacancyStatusQueryParams) {
    return this.candidateVacancyStatusService.findAll(query);
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.candidateVacancyStatusService.findOne(+id);
  }

  @Roles(UserRole.ADMIN)
  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() createCandidateVacancyStatusDto: CreateCandidateVacancyStatusDto,
  ) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) throw new BadRequestException('Organization context required');
    return this.candidateVacancyStatusService.create({
      ...createCandidateVacancyStatusDto,
      organizationId,
    });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCandidateVacancyStatusDto: UpdateCandidateVacancyStatusDto,
  ) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) throw new BadRequestException('Organization context required');
    return this.candidateVacancyStatusService.update(+id, {
      ...updateCandidateVacancyStatusDto,
      organizationId,
    });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.candidateVacancyStatusService.remove(+id);
  }
}
