import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BlockedWord } from './entities/blocked-word.entity';
import { Repository, DataSource } from 'typeorm';
import { WordRelationships } from './entities/word-relationship.entity';
import { APIResponse, QueryString } from 'src/common/types/api.types';
import ApiFeatures from 'src/common/utils/ApiFeatures';

@Injectable()
export class BlockedWordsService {
  constructor(
    @InjectRepository(BlockedWord)
    private readonly blockedWordRepository: Repository<BlockedWord>,
    @InjectRepository(WordRelationships)
    private readonly wordRelationshipsRepository: Repository<WordRelationships>,
    private readonly dataSource: DataSource
  ) {}

  async block(accountId: number, word: string): Promise<APIResponse> {
    let blockedWord: BlockedWord;

    // Check if the word already existed
    const existedWord = await this.blockedWordRepository.findOneBy({
      text: word,
    });
    if (existedWord) {
      // Check if the user already blocked it
      const relationship = await this.wordRelationshipsRepository.findOneBy({
        accountId,
        blockedWordId: existedWord.id,
      });

      // If the user haven't blocked the word ... create the relationship
      if (!relationship) {
        const r = this.wordRelationshipsRepository.create({
          accountId,
          blockedWordId: existedWord.id,
        });

        await this.wordRelationshipsRepository.save(r);
      }

      blockedWord = existedWord;
    } else {
      // Word doesn't exist ... Need to create the word and the relationship
      const bw = await this.dataSource.transaction(async (manager) => {
        const rRepo = manager.getRepository(WordRelationships);
        const wRepo = manager.getRepository(BlockedWord);

        const bw = wRepo.create({ text: word });
        await wRepo.save(bw);

        const relationship = rRepo.create({ blockedWordId: bw.id, accountId });
        await rRepo.save(relationship);

        return bw;
      });

      blockedWord = bw;
    }

    return {
      message: `${word} has been blocked successfully`,
      data: blockedWord,
    };
  }

  async unblock(
    accountId: number,
    blockedWordId: number
  ): Promise<APIResponse> {
    const relationship = await this.wordRelationshipsRepository.findOne({
      where: { blockedWordId, accountId },
      relations: ['blockedWord'],
    });
    if (!relationship) throw new NotFoundException('This word is not blocked');

    await this.wordRelationshipsRepository.remove(relationship);

    return {
      message: `${relationship.blockedWord.text} has been unblocked successfully`,
    };
  }

  async getCurrentAccountBlockedWords(
    accountId: number,
    q: QueryString
  ): Promise<APIResponse> {
    const relationships = await new ApiFeatures(
      this.wordRelationshipsRepository,
      q,
      {
        where: { accountId },
        relations: ['blockedWord'],
      }
    )
      .paginate()
      .exec();

    const blockedWords = relationships.map((r) => r.blockedWord);
    return {
      size: blockedWords.length,
      data: blockedWords,
    };
  }
}
