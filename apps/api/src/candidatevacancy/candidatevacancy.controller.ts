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
import { CandidateVacancyService } from './candidatevacancy.service';
import {
  CreateCandidateVacancyDto,
  UpdateCandidateVacancyDto,
  CandidateVacancyQueryParams,
} from './candidatevacancy.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { CurrentUserStore } from '../auth/auth.currentuser.store';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('CandidateVacancies')
@Controller('candidateVacancy')
export class CandidateVacancyController {
  constructor(
    private readonly candidateVacancyService: CandidateVacancyService,
    private readonly cls: ClsService<CurrentUserStore>,
  ) {}

  @ApiOkResponse()
  @Get()
  async findAll(@Query() query: CandidateVacancyQueryParams) {
    return this.candidateVacancyService.findAll(query);
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.candidateVacancyService.findOne(+id);
  }

  @ApiCreatedResponse()
  @Post()
  async create(@Body() createCandidateVacancyDto: CreateCandidateVacancyDto) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) throw new BadRequestException('Organization context required');
    return this.candidateVacancyService.create({ ...createCandidateVacancyDto, organizationId });
  }

  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCandidateVacancyDto: UpdateCandidateVacancyDto,
  ) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) throw new BadRequestException('Organization context required');
    return this.candidateVacancyService.update(+id, { ...updateCandidateVacancyDto, organizationId });
  }

  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.candidateVacancyService.remove(+id);
  }
}
