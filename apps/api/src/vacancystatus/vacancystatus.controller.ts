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
import { VacancyStatusService } from './vacancystatus.service';
import {
  CreateVacancyStatusDto,
  UpdateVacancyStatusDto,
  VacancyStatusQueryParams,
} from './vacancystatus.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '@workspace/shared/enums';
import { CurrentUserStore } from '../auth/auth.currentuser.store';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('VacancyStatuses')
@Controller('vacancyStatus')
export class VacancyStatusController {
  constructor(
    private readonly vacancyStatusService: VacancyStatusService,
    private readonly cls: ClsService<CurrentUserStore>,
  ) {}

  @ApiOkResponse()
  @Get()
  async findAll(@Query() query: VacancyStatusQueryParams) {
    return this.vacancyStatusService.findAll(query);
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.vacancyStatusService.findOne(+id);
  }

  @Roles(UserRole.ADMIN)
  @ApiCreatedResponse()
  @Post()
  async create(@Body() createVacancyStatusDto: CreateVacancyStatusDto) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) {
      throw new BadRequestException('Organization context required');
    }
    return this.vacancyStatusService.create({
      ...createVacancyStatusDto,
      organizationId,
    });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVacancyStatusDto: UpdateVacancyStatusDto,
  ) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) {
      throw new BadRequestException('Organization context required');
    }
    return this.vacancyStatusService.update(+id, {
      ...updateVacancyStatusDto,
      organizationId,
    });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.vacancyStatusService.remove(+id);
  }
}
