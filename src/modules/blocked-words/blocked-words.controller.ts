import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BlockedWordsService } from './blocked-words.service';
import { CreateBlockedWordDto } from './dto/create-blocked-word.dto';
import { UpdateBlockedWordDto } from './dto/update-blocked-word.dto';

@Controller('blocked-words')
export class BlockedWordsController {
  constructor(private readonly blockedWordsService: BlockedWordsService) {}

  @Post()
  create(@Body() createBlockedWordDto: CreateBlockedWordDto) {
    return this.blockedWordsService.create(createBlockedWordDto);
  }

  @Get()
  findAll() {
    return this.blockedWordsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blockedWordsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBlockedWordDto: UpdateBlockedWordDto) {
    return this.blockedWordsService.update(+id, updateBlockedWordDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blockedWordsService.remove(+id);
  }
}
