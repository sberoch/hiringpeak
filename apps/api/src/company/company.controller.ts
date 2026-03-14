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
import { AuditAction } from '../audit-log/audit-action.decorator';
import { CompanyService } from './company.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanyQueryParams,
} from './company.dto';
import { PermissionCode } from '@workspace/shared/enums';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { CurrentUserStore } from '../auth/auth.currentuser.store';

@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
@ApiTags('Companies')
@Controller('company')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly cls: ClsService<CurrentUserStore>,
  ) {}

  @ApiOkResponse()
  @Permissions(PermissionCode.COMPANY_READ)
  @Get()
  async findAll(@Query() query: CompanyQueryParams) {
    return this.companyService.findAll(query);
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.COMPANY_READ)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.companyService.findOne(+id);
  }

  @ApiCreatedResponse()
  @AuditAction({ eventType: 'create_company', entityType: 'company' })
  @Permissions(PermissionCode.COMPANY_MANAGE)
  @Post()
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null)
      throw new BadRequestException('Organization context required');
    return this.companyService.create({
      ...createCompanyDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @AuditAction({ eventType: 'update_company', entityType: 'company' })
  @Permissions(PermissionCode.COMPANY_MANAGE)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null)
      throw new BadRequestException('Organization context required');
    return this.companyService.update(+id, {
      ...updateCompanyDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @AuditAction({ eventType: 'delete_company', entityType: 'company' })
  @Permissions(PermissionCode.COMPANY_MANAGE)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.companyService.remove(+id);
  }
}
