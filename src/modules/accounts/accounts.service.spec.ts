import { Test } from '@nestjs/testing';
import { AccountsService } from './accounts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { AccountRelationships } from './entities/account-relationship.entity';
import { DataSource, Not } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { RelationshipType } from './accounts.enums';

describe('AccountsService', () => {
  let service: AccountsService;

  const mockEntityManager = {
    getRepository: jest.fn(),
  };
  const mockDataSourse = {
    transaction: jest.fn((callback) => callback(mockEntityManager)),
  };
  const mockAuthService = {};
  const mockAccountsRepository = {
    findOne: jest.fn(),
  };
  const mockAccountRelationshipsRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: getRepositoryToken(Account),
          useValue: mockAccountsRepository,
        },
        {
          provide: getRepositoryToken(AccountRelationships),
          useValue: mockAccountRelationshipsRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSourse,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = moduleRef.get(AccountsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('block', () => {
    const accountId = 1;
    const targetAccountId = 2;
    const mockTargetAccount = {
      username: 'targetuser',
      isPrivate: false,
    };
    const mockRelationshipRepo = {
      create: jest.fn().mockReturnValue({
        actorId: accountId,
        targetId: targetAccountId,
        relationshipType: RelationshipType.BLOCK,
      }),
      save: jest.fn(),
      delete: jest.fn(),
    };

    it('should throw BadRequestException when trying to block yourself', async () => {
      await expect(service.block(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when target account does not exist', async () => {
      mockAccountsRepository.findOne.mockResolvedValue(null);
      await expect(service.block(accountId, targetAccountId)).rejects.toThrow(
        NotFoundException
      );

      expect(mockAccountsRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: targetAccountId,
        },
        select: ['username', 'isPrivate'],
      });
    });

    it('should throw ConflictException when the target account is already blocked', async () => {
      const existingBlockRelationship = {
        actorId: accountId,
        targetId: targetAccountId,
        relationshipType: RelationshipType.BLOCK,
      };

      mockAccountsRepository.findOne.mockResolvedValue(mockTargetAccount);
      mockAccountRelationshipsRepository.findOne.mockResolvedValue(
        existingBlockRelationship
      );

      await expect(service.block(accountId, targetAccountId)).rejects.toThrow(
        ConflictException
      );
    });

    it('should create new block relationship when no existing relationship', async () => {
      mockAccountsRepository.findOne.mockResolvedValue(mockTargetAccount);
      mockAccountRelationshipsRepository.findOne.mockResolvedValue(null);
      mockEntityManager.getRepository.mockReturnValue(mockRelationshipRepo);

      const result = await service.block(accountId, targetAccountId);

      expect(mockAccountsRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: targetAccountId,
        },
        select: ['username', 'isPrivate'],
      });

      expect(mockAccountRelationshipsRepository.findOne).toHaveBeenCalledWith({
        where: {
          actorId: accountId,
          targetId: targetAccountId,
        },
      });

      expect(mockRelationshipRepo.create).toHaveBeenCalledWith({
        actorId: accountId,
        targetId: targetAccountId,
        relationshipType: RelationshipType.BLOCK,
      });

      expect(mockRelationshipRepo.save).toHaveBeenCalled();

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('blocked successfully');
    });

    it('should update existing non block relationship to block', async () => {
      const existingFollowRelationship = {
        accountId,
        targetAccountId,
        relationshipType: RelationshipType.FOLLOW,
      };

      mockAccountsRepository.findOne.mockResolvedValue(mockTargetAccount);
      mockAccountRelationshipsRepository.findOne.mockResolvedValue(
        existingFollowRelationship
      );
      mockEntityManager.getRepository.mockReturnValue(mockRelationshipRepo);

      const result = await service.block(accountId, targetAccountId);

      expect(existingFollowRelationship.relationshipType).toBe(
        RelationshipType.BLOCK
      );

      expect(mockRelationshipRepo.save).toHaveBeenCalledWith(
        existingFollowRelationship
      );

      expect(mockRelationshipRepo.delete).toHaveBeenCalledWith({
        actorId: targetAccountId,
        targetId: accountId,
        relationshipType: Not(RelationshipType.BLOCK),
      });

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('blocked successfully');
    });

    it('should delete opposite direction relationships (except blocks)', async () => {
      const mockRelationshipRepo = {
        create: jest.fn().mockReturnValue({}),
        save: jest.fn(),
        delete: jest.fn(),
      };

      mockAccountsRepository.findOne.mockResolvedValue(mockTargetAccount);
      mockAccountRelationshipsRepository.findOne.mockResolvedValue(null);
      mockEntityManager.getRepository.mockReturnValue(mockRelationshipRepo);

      await service.block(accountId, targetAccountId);

      expect(mockRelationshipRepo.delete).toHaveBeenCalledWith({
        actorId: targetAccountId,
        targetId: accountId,
        relationshipType: Not(RelationshipType.BLOCK),
      });
    });
  });
});
