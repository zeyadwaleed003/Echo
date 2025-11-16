import { Test } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { AuthGuard } from '../auth/auth.guard';

describe('AccountsController', () => {
  let controller: AccountsController;

  const mockAccountsService = {
    create: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        {
          provide: AccountsService,
          useValue: mockAccountsService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = moduleRef.get<AccountsController>(AccountsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new account', async () => {
      const createAccountDto = {
        name: 'John Doe',
        email: 'john@doe.com',
        usename: 'johndoe',
      };

      const expectedResponse = {
        data: {
          id: 1,
          name: 'John Doe',
          email: 'john@doe.com',
          usename: 'johndoe',
        },
      };

      mockAccountsService.create.mockResolvedValue(expectedResponse);

      const result = await controller.create(createAccountDto as any);
      expect(result).toEqual(expectedResponse);
      expect(mockAccountsService.create).toHaveBeenCalledWith(createAccountDto);
    });
  });
});
