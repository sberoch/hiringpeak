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
import { SeniorityService } from './seniority.service';
import {
  CreateSeniorityDto,
  UpdateSeniorityDto,
  SeniorityQueryParams,
} from './seniority.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '@workspace/shared/enums';
import { CurrentUserStore } from '../auth/auth.currentuser.store';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('Seniorities')
@Controller('seniority')
export class SeniorityController {
  constructor(
    private readonly seniorityService: SeniorityService,
    private readonly cls: ClsService<CurrentUserStore>,
  ) {}

  @ApiOkResponse()
  @Get()
  async findAll(@Query() query: SeniorityQueryParams) {
    return this.seniorityService.findAll(query);
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.seniorityService.findOne(+id);
  }

  @Roles(UserRole.ADMIN)
  @ApiCreatedResponse()
  @Post()
  async create(@Body() createSeniorityDto: CreateSeniorityDto) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null)
      throw new BadRequestException('Organization context required');
    return this.seniorityService.create({
      ...createSeniorityDto,
      organizationId,
    });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSeniorityDto: UpdateSeniorityDto,
  ) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null)
      throw new BadRequestException('Organization context required');
    return this.seniorityService.update(+id, {
      ...updateSeniorityDto,
      organizationId,
    });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.seniorityService.remove(+id);
  }
}
