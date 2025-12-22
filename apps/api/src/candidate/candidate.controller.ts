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

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('Candidates')
@Controller('candidate')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @ApiOkResponse()
  @Get()
  async findAll(@Query() query: CandidateQueryParams) {
    return this.candidateService.findAll(query);
  }

  @ApiOkResponse()
  @Get('exists')
  async exists(@Query('name') name: string) {
    return this.candidateService.existsByName(name);
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.candidateService.findOne(+id);
  }

  @ApiCreatedResponse()
  @Post()
  async create(@Body() createCandidateDto: CreateCandidateDto) {
    return this.candidateService.create(createCandidateDto);
  }

  @ApiCreatedResponse()
  @Post(':id/blacklist')
  async blacklist(
    @Param('id') id: string,
    @Body() blacklistCandidateDto: BlacklistCandidateDto,
    @CurrentUser() user: User,
  ) {
    return this.candidateService.blacklist(blacklistCandidateDto, user, +id);
  }

  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCandidateDto: UpdateCandidateDto,
  ) {
    return this.candidateService.update(+id, updateCandidateDto);
  }

  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.candidateService.remove(+id);
  }
}
