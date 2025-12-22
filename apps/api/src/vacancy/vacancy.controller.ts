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
import { VacancyService } from './vacancy.service';
import {
  CreateVacancyDto,
  UpdateVacancyDto,
  VacancyQueryParams,
} from './vacancy.dto';
import { RolesGuard } from '../auth/roles/roles.guard';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('Vacancies')
@Controller('vacancy')
export class VacancyController {
  constructor(private readonly vacancyService: VacancyService) {}

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
    return this.vacancyService.create(createVacancyDto);
  }

  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVacancyDto: UpdateVacancyDto,
  ) {
    return this.vacancyService.update(+id, updateVacancyDto);
  }

  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.vacancyService.remove(+id);
  }
}
