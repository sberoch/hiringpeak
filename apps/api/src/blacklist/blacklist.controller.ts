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

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('Blacklists')
@Controller('blacklist')
export class BlacklistController {
  constructor(private readonly blacklistService: BlacklistService) {}

  @ApiOkResponse()
  @Get()
  async findAll(@Query() query: BlacklistQueryParams) {
    return this.blacklistService.findAll(query);
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.blacklistService.findOne(+id);
  }

  @ApiCreatedResponse()
  @Post()
  async create(@Body() createBlacklistDto: CreateBlacklistDto) {
    return this.blacklistService.create(createBlacklistDto);
  }

  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBlacklistDto: UpdateBlacklistDto,
  ) {
    return this.blacklistService.update(+id, updateBlacklistDto);
  }

  @ApiOkResponse()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.blacklistService.remove(+id);
  }

  @ApiOkResponse()
  @Delete('candidate/:id')
  async removeByCandidateId(@Param('id') id: string) {
    return this.blacklistService.removeByCandidateId(+id);
  }
}
