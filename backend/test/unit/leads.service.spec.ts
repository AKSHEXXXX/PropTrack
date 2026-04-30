import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LeadsService } from '../../src/modules/leads/leads.service';
import { Lead } from '../../src/modules/leads/entities/lead.entity';
import { Tag } from '../../src/modules/tags/entities/tag.entity';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// QueryBuilder chain used by LeadsService.getPipeline
const mockLeadQb = {
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(),
  getOne: jest.fn(),
};

const mockLeadRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockLeadQb),
};

// LeadsService also injects Tag repo (addTag / removeTag methods)
const mockTagRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
};

// LeadsService.autoAssign calls dataSource.query (stored procedure)
const mockDataSource = {
  query: jest.fn(),
};

// ---------------------------------------------------------------------------

describe('LeadsService', () => {
  let service: LeadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: getRepositoryToken(Lead), useValue: mockLeadRepo },
        // Required by constructor – Tag repo for addTag / removeTag
        { provide: getRepositoryToken(Tag), useValue: mockTagRepo },
        // Required by constructor – DataSource for autoAssign stored-procedure call
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);

    jest.clearAllMocks();
    // Restore chainable QB after clearAllMocks wipes mockReturnThis()
    mockLeadRepo.createQueryBuilder.mockReturnValue(mockLeadQb);
    mockLeadQb.select.mockReturnThis();
    mockLeadQb.addSelect.mockReturnThis();
    mockLeadQb.where.mockReturnThis();
    mockLeadQb.groupBy.mockReturnThis();
  });

  // -------------------------------------------------------------------------
  describe('create', () => {
    it('should throw ConflictException for duplicate active lead', async () => {
      // An existing lead with an active (non-terminal) status triggers the conflict
      mockLeadRepo.findOne.mockResolvedValue({ lead_id: 1, status: 'new' });

      await expect(
        service.create({
          clientId: 1,
          propertyId: 1,
          agentId: 1,
          budget: 1_000_000,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a lead successfully', async () => {
      // No existing active lead → creation proceeds
      mockLeadRepo.findOne.mockResolvedValue(null);
      mockLeadRepo.create.mockReturnValue({ lead_id: 1, status: 'new' });
      mockLeadRepo.save.mockResolvedValue({
        lead_id: 1,
        status: 'new',
        clientId: 1,
      });

      const result = await service.create({
        clientId: 1,
        propertyId: 2,
        agentId: 1,
        budget: 2_000_000,
      });

      expect(result.data.lead_id).toBe(1);
      expect(result.message).toBe('Lead created successfully');
    });
  });

  // -------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return a lead by ID', async () => {
      mockLeadRepo.findOne.mockResolvedValue({
        lead_id: 5,
        status: 'contacted',
      });

      const result = await service.findOne(5);

      expect(result.data.lead_id).toBe(5);
      expect(result.message).toBe('Lead fetched successfully');
    });

    it('should throw NotFoundException for non-existent lead', async () => {
      mockLeadRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
