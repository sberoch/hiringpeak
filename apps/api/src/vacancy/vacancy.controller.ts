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
import { VacancyService } from './vacancy.service';
import {
  CreateVacancyDto,
  UpdateVacancyDto,
  VacancyQueryParams,
} from './vacancy.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { CurrentUserStore } from '../auth/auth.currentuser.store';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('Vacancies')
@Controller('vacancy')
export class VacancyController {
  constructor(
    private readonly vacancyService: VacancyService,
    private readonly cls: ClsService<CurrentUserStore>,
  ) {}

  @ApiOkResponse()
  @Get()
  async findAll(@Query() query: VacancyQueryParams) {
    return this.vacancyService.findAll(query);
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.vacancyService.findOne(+id);
  }

  @ApiCreatedResponse()
  @Post()
  async create(@Body() createVacancyDto: CreateVacancyDto) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) {
      throw new BadRequestException('Organization context required');
    }
    return this.vacancyService.create({
      ...createVacancyDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVacancyDto: UpdateVacancyDto,
  ) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) {
      throw new BadRequestException('Organization context required');
    }
    return this.vacancyService.update(+id, {
      ...updateVacancyDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.vacancyService.remove(+id);
  }
}
