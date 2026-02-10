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
import { CandidateSourceService } from './candidatesource.service';
import {
  CreateCandidateSourceDto,
  UpdateCandidateSourceDto,
  CandidateSourceQueryParams,
} from './candidatesource.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { UserRole } from '@workspace/shared/enums';
import { Roles } from '../auth/roles/roles.decorator';
import { CurrentUserStore } from '../auth/auth.currentuser.store';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('CandidateSources')
@Controller('candidateSource')
export class CandidateSourceController {
  constructor(
    private readonly candidateSourceService: CandidateSourceService,
    private readonly cls: ClsService<CurrentUserStore>,
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
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null)
      throw new BadRequestException('Organization context required');
    return this.candidateSourceService.create({
      ...createCandidateSourceDto,
      organizationId,
    });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCandidateSourceDto: UpdateCandidateSourceDto,
  ) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null)
      throw new BadRequestException('Organization context required');
    return this.candidateSourceService.update(+id, {
      ...updateCandidateSourceDto,
      organizationId,
    });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.candidateSourceService.remove(+id);
  }
}
