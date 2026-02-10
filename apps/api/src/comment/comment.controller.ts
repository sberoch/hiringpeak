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
import { CommentService } from './comment.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryParams,
  DeleteCommentDto,
} from './comment.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { CurrentUserStore } from '../auth/auth.currentuser.store';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('Comments')
@Controller('comment')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly cls: ClsService<CurrentUserStore>,
  ) {}

  @ApiOkResponse()
  @Get()
  async findAll(@Query() query: CommentQueryParams) {
    return this.commentService.findAll(query);
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.commentService.findOne(+id);
  }

  @ApiCreatedResponse()
  @Post()
  async create(@Body() createCommentDto: CreateCommentDto) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) throw new BadRequestException('Organization context required');
    return this.commentService.create({ ...createCommentDto, organizationId });
  }

  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) throw new BadRequestException('Organization context required');
    return this.commentService.update(+id, { ...updateCommentDto, organizationId });
  }

  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Body() deleteCommentDto: DeleteCommentDto,
  ) {
    return this.commentService.remove(+id, deleteCommentDto);
  }
}
