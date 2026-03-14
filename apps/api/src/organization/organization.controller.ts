import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InternalUserGuard } from '../auth/internal-user.guard';
import {
  CreateOrganizationDto,
  OrganizationQueryParams,
} from './organization.dto';
import { OrganizationService } from './organization.service';

@ApiBearerAuth()
@UseGuards(InternalUserGuard)
@ApiTags('Organizations')
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @ApiOkResponse()
  @Get()
  async findAll(@Query() query: OrganizationQueryParams) {
    return this.organizationService.findAll(query);
  }

  @ApiOkResponse()
  @Get(':id/detail')
  async findOneWithUsers(@Param('id') id: string) {
    return this.organizationService.findOneWithUsers(+id);
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.organizationService.findOne(+id);
  }

  @ApiCreatedResponse()
  @Post()
  async create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationService.create(createOrganizationDto);
  }
}
