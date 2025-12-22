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
import { CandidateVacancyService } from './candidatevacancy.service';
import {
  CreateCandidateVacancyDto,
  UpdateCandidateVacancyDto,
  CandidateVacancyQueryParams,
} from './candidatevacancy.dto';
import { RolesGuard } from '../auth/roles/roles.guard';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('CandidateVacancies')
@Controller('candidateVacancy')
export class CandidateVacancyController {
  constructor(
    private readonly candidateVacancyService: CandidateVacancyService,
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
    return this.candidateVacancyService.create(createCandidateVacancyDto);
  }

  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCandidateVacancyDto: UpdateCandidateVacancyDto,
  ) {
    return this.candidateVacancyService.update(+id, updateCandidateVacancyDto);
  }

  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.candidateVacancyService.remove(+id);
  }
}
