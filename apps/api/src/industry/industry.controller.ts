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
import { IndustryService } from './industry.service';
import {
  CreateIndustryDto,
  UpdateIndustryDto,
  IndustryQueryParams,
} from './industry.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '@workspace/shared/enums';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('Industries')
@Controller('industry')
export class IndustryController {
  constructor(private readonly industryService: IndustryService) {}

  @ApiOkResponse()
  @Get()
  async findAll(@Query() query: IndustryQueryParams) {
    return this.industryService.findAll(query);
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.industryService.findOne(+id);
  }

  @Roles(UserRole.ADMIN)
  @ApiCreatedResponse()
  @Post()
  async create(@Body() createIndustryDto: CreateIndustryDto) {
    return this.industryService.create(createIndustryDto);
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateIndustryDto: UpdateIndustryDto,
  ) {
    return this.industryService.update(+id, updateIndustryDto);
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.industryService.remove(+id);
  }
}
