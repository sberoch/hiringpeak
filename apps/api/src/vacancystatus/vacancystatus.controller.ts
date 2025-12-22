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
import { VacancyStatusService } from './vacancystatus.service';
import {
  CreateVacancyStatusDto,
  UpdateVacancyStatusDto,
  VacancyStatusQueryParams,
} from './vacancystatus.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '@workspace/shared/enums';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('VacancyStatuses')
@Controller('vacancyStatus')
export class VacancyStatusController {
  constructor(private readonly vacancyStatusService: VacancyStatusService) {}

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
    return this.vacancyStatusService.create(createVacancyStatusDto);
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVacancyStatusDto: UpdateVacancyStatusDto,
  ) {
    return this.vacancyStatusService.update(+id, updateVacancyStatusDto);
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.vacancyStatusService.remove(+id);
  }
}
