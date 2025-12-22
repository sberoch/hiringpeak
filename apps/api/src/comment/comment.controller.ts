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

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('Comments')
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

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
    return this.commentService.create(createCommentDto);
  }

  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentService.update(+id, updateCommentDto);
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
