import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { DrizzleService } from '../database/drizzle.service';

// Mock DrizzleService
const mockDrizzleService = {
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  },
};

describe('CommentsService', () => {
  let service: CommentsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: DrizzleService,
          useValue: mockDrizzleService,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
