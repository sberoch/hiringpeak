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
import { CommentService } from './comment.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryParams,
  DeleteCommentDto,
} from './comment.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(RolesGuard, OrganizationGuard)
@ApiTags('Comments')
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @ApiOkResponse()
  @Get()
  async findAll(
    @Query() query: CommentQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.commentService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.commentService.findOne(+id, organizationId);
  }

  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.commentService.create({
      ...createCommentDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.commentService.update(+id, {
      ...updateCommentDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Body() deleteCommentDto: DeleteCommentDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.commentService.remove(+id, organizationId, deleteCommentDto);
  }
}
