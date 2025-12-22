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

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('CandidateSources')
@Controller('candidateSource')
export class CandidateSourceController {
  constructor(
    private readonly candidateSourceService: CandidateSourceService,
  ) {}

  @ApiOkResponse()
  @Get()
  async findAll(@Query() query: CandidateSourceQueryParams) {
    return this.candidateSourceService.findAll(query);
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.candidateSourceService.findOne(+id);
  }

  @Roles(UserRole.ADMIN)
  @ApiCreatedResponse()
  @Post()
  async create(@Body() createCandidateSourceDto: CreateCandidateSourceDto) {
    return this.candidateSourceService.create(createCandidateSourceDto);
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCandidateSourceDto: UpdateCandidateSourceDto,
  ) {
    return this.candidateSourceService.update(+id, updateCandidateSourceDto);
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.candidateSourceService.remove(+id);
  }
}
