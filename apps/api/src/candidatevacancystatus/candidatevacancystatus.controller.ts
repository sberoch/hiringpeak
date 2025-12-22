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
import { CandidateVacancyStatusService } from './candidatevacancystatus.service';
import {
  CreateCandidateVacancyStatusDto,
  UpdateCandidateVacancyStatusDto,
  CandidateVacancyStatusQueryParams,
} from './candidatevacancystatus.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '@workspace/shared/enums';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('CandidateVacancyStatuses')
@Controller('candidateVacancyStatus')
export class CandidateVacancyStatusController {
  constructor(
    private readonly candidateVacancyStatusService: CandidateVacancyStatusService,
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
    return this.candidateVacancyStatusService.create(
      createCandidateVacancyStatusDto,
    );
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCandidateVacancyStatusDto: UpdateCandidateVacancyStatusDto,
  ) {
    return this.candidateVacancyStatusService.update(
      +id,
      updateCandidateVacancyStatusDto,
    );
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.candidateVacancyStatusService.remove(+id);
  }
}
