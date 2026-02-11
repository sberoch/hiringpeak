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
import { BlacklistService } from './blacklist.service';
import {
  CreateBlacklistDto,
  UpdateBlacklistDto,
  BlacklistQueryParams,
} from './blacklist.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(RolesGuard, OrganizationGuard)
@ApiTags('Blacklists')
@Controller('blacklist')
export class BlacklistController {
  constructor(private readonly blacklistService: BlacklistService) {}

  @ApiOkResponse()
  @Get()
  async findAll(
    @Query() query: BlacklistQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.blacklistService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.blacklistService.findOne(+id, organizationId);
  }

  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() createBlacklistDto: CreateBlacklistDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.blacklistService.create({
      ...createBlacklistDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBlacklistDto: UpdateBlacklistDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.blacklistService.update(+id, {
      ...updateBlacklistDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.blacklistService.remove(+id, organizationId);
  }

  @ApiOkResponse()
  @Delete('candidate/:id')
  async removeByCandidateId(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.blacklistService.removeByCandidateId(+id, organizationId);
  }
}
