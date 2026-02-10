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
import { IndustryService } from './industry.service';
import {
  CreateIndustryDto,
  UpdateIndustryDto,
  IndustryQueryParams,
} from './industry.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '@workspace/shared/enums';
import { CurrentUserStore } from '../auth/auth.currentuser.store';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('Industries')
@Controller('industry')
export class IndustryController {
  constructor(
    private readonly industryService: IndustryService,
    private readonly cls: ClsService<CurrentUserStore>,
  ) {}

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
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null)
      throw new BadRequestException('Organization context required');
    return this.industryService.create({
      ...createIndustryDto,
      organizationId,
    });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateIndustryDto: UpdateIndustryDto,
  ) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null)
      throw new BadRequestException('Organization context required');
    return this.industryService.update(+id, {
      ...updateIndustryDto,
      organizationId,
    });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.industryService.remove(+id);
  }
}
