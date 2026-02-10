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
import { CurrentUserStore } from '../auth/auth.currentuser.store';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('Candidates')
@Controller('candidate')
export class CandidateController {
  constructor(
    private readonly candidateService: CandidateService,
    private readonly cls: ClsService<CurrentUserStore>,
  ) {}

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
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) throw new BadRequestException('Organization context required');
    return this.candidateService.create({ ...createCandidateDto, organizationId });
  }

  @ApiCreatedResponse()
  @Post(':id/blacklist')
  async blacklist(
    @Param('id') id: string,
    @Body() blacklistCandidateDto: BlacklistCandidateDto,
    @CurrentUser() user: User,
  ) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) throw new BadRequestException('Organization context required');
    return this.candidateService.blacklist(blacklistCandidateDto, user, +id, organizationId);
  }

  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCandidateDto: UpdateCandidateDto,
  ) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) throw new BadRequestException('Organization context required');
    return this.candidateService.update(+id, { ...updateCandidateDto, organizationId });
  }

  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.candidateService.remove(+id);
  }
}
