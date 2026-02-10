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
import { CandidateFileService } from './candidatefile.service';
import {
  CreateCandidateFileDto,
  UpdateCandidateFileDto,
  CandidateFileQueryParams,
} from './candidatefile.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { CurrentUserStore } from '../auth/auth.currentuser.store';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('CandidateFiles')
@Controller('candidatefile')
export class CandidateFileController {
  constructor(
    private readonly candidateFileService: CandidateFileService,
    private readonly cls: ClsService<CurrentUserStore>,
  ) {}

  @ApiOkResponse()
  @Get()
  async findAll(@Query() query: CandidateFileQueryParams) {
    return this.candidateFileService.findAll(query);
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.candidateFileService.findOne(+id);
  }

  @ApiCreatedResponse()
  @Post()
  async create(@Body() createCandidateFileDto: CreateCandidateFileDto) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) throw new BadRequestException('Organization context required');
    return this.candidateFileService.create({ ...createCandidateFileDto, organizationId });
  }

  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCandidateFileDto: UpdateCandidateFileDto,
  ) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) throw new BadRequestException('Organization context required');
    return this.candidateFileService.update(+id, { ...updateCandidateFileDto, organizationId });
  }

  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.candidateFileService.remove(+id);
  }
}
