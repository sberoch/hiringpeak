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
import { UserRole } from '@workspace/shared/enums';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import {
  CreateOrganizationDto,
  OrganizationQueryParams,
} from './organization.dto';
import { OrganizationService } from './organization.service';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('Organizations')
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiOkResponse()
  @Get()
  async findAll(@Query() query: OrganizationQueryParams) {
    return this.organizationService.findAll(query);
  }

  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiOkResponse()
  @Get(':id/detail')
  async findOneWithUsers(@Param('id') id: string) {
    return this.organizationService.findOneWithUsers(+id);
  }

  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiOkResponse()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.organizationService.findOne(+id);
  }

  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiCreatedResponse()
  @Post()
  async create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationService.create(createOrganizationDto);
  }
}
