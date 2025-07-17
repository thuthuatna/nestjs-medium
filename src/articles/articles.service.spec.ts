import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesService } from './articles.service';
import { DrizzleService } from '../database/drizzle.service';

// Mock DrizzleService
const mockDrizzleService = {
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ArticlesService', () => {
  let service: ArticlesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: DrizzleService,
          useValue: mockDrizzleService,
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
