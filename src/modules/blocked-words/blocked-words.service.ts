import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BlockedWord } from './entities/blocked-word.entity';
import { Repository, DataSource } from 'typeorm';
import { WordRelationships } from './entities/word-relationship.entity';
import { HttpResponse, QueryString } from 'src/common/types/api.types';
import ApiFeatures from 'src/common/utils/ApiFeatures';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class BlockedWordsService {
  private readonly i18nNamespace = 'messages.blockedWords';

  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(BlockedWord)
    private readonly blockedWordRepository: Repository<BlockedWord>,
    @InjectRepository(WordRelationships)
    private readonly wordRelationshipsRepository: Repository<WordRelationships>,
    private readonly dataSource: DataSource
  ) {}

  async block(accountId: number, word: string): Promise<HttpResponse> {
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
      message: this.i18n.t(`${this.i18nNamespace}.blockedSuccessfully`, {
        args: { word },
      }),
      data: blockedWord,
    };
  }

  async unblock(
    accountId: number,
    blockedWordId: number
  ): Promise<HttpResponse> {
    const relationship = await this.wordRelationshipsRepository.findOne({
      where: { blockedWordId, accountId },
      relations: ['blockedWord'],
    });
    if (!relationship)
      throw new NotFoundException(
        this.i18n.t(`${this.i18nNamespace}.notBlocked`)
      );

    await this.wordRelationshipsRepository.remove(relationship);

    return {
      message: this.i18n.t(`${this.i18nNamespace}.unblockedSuccessfully`, {
        args: { word: relationship.blockedWord.text },
      }),
    };
  }

  async getCurrentAccountBlockedWords(
    accountId: number,
    q: QueryString
  ): Promise<HttpResponse> {
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
