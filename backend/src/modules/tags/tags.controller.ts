import { Controller, Get, Post, Body, Delete, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/tag.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}
  @Post() @ApiOperation({ summary: 'Create tag' }) create(@Body() dto: CreateTagDto) { return this.tagsService.create(dto); }
  @Get() @ApiOperation({ summary: 'List all tags' }) findAll() { return this.tagsService.findAll(); }
  @Delete(':id') @ApiOperation({ summary: 'Delete tag' }) remove(@Param('id', ParseIntPipe) id: number) { return this.tagsService.remove(id); }
}
