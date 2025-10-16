import { Injectable } from '@nestjs/common';
import { CreateBlockedWordDto } from './dto/create-blocked-word.dto';
import { UpdateBlockedWordDto } from './dto/update-blocked-word.dto';

@Injectable()
export class BlockedWordsService {
  create(createBlockedWordDto: CreateBlockedWordDto) {
    return 'This action adds a new blockedWord';
  }

  findAll() {
    return `This action returns all blockedWords`;
  }

  findOne(id: number) {
    return `This action returns a #${id} blockedWord`;
  }

  update(id: number, updateBlockedWordDto: UpdateBlockedWordDto) {
    return `This action updates a #${id} blockedWord`;
  }

  remove(id: number) {
    return `This action removes a #${id} blockedWord`;
  }
}
