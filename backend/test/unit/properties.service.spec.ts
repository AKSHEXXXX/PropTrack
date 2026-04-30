import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PropertiesService } from '../../src/modules/properties/properties.service';
import {
  Property,
  PropertyType,
} from '../../src/modules/properties/entities/property.entity';
import { PropertyImage } from '../../src/modules/properties/entities/property-image.entity';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// QueryBuilder chain used by PropertiesService.findAll
const mockPropertyQb = {
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
  getOne: jest.fn(),
};

const mockPropertyRepo = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockPropertyQb),
};

// PropertiesService also injects PropertyImage repo (addImage / removeImage)
const mockImageRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
};

// ---------------------------------------------------------------------------

describe('PropertiesService', () => {
  let service: PropertiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: getRepositoryToken(Property), useValue: mockPropertyRepo },
        // Required by constructor – PropertyImage repo for addImage / removeImage
        { provide: getRepositoryToken(PropertyImage), useValue: mockImageRepo },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);

    jest.clearAllMocks();
    // Restore chainable QB after clearAllMocks wipes mockReturnThis()
    mockPropertyRepo.createQueryBuilder.mockReturnValue(mockPropertyQb);
    mockPropertyQb.select.mockReturnThis();
    mockPropertyQb.addSelect.mockReturnThis();
    mockPropertyQb.where.mockReturnThis();
    mockPropertyQb.leftJoinAndSelect.mockReturnThis();
    mockPropertyQb.andWhere.mockReturnThis();
    mockPropertyQb.orderBy.mockReturnThis();
    mockPropertyQb.skip.mockReturnThis();
    mockPropertyQb.take.mockReturnThis();
  });

  // -------------------------------------------------------------------------

  it('should create a property successfully', async () => {
    const dto = {
      agentId: 1,
      title: 'Test Property',
      location: 'Dubai Marina',
      city: 'Dubai',
      price: 1_500_000,
      propertyType: PropertyType.APARTMENT,
    };

    mockPropertyRepo.create.mockReturnValue({ property_id: 1, ...dto });
    mockPropertyRepo.save.mockResolvedValue({ property_id: 1, ...dto });

    const result = await service.create(dto);

    expect(result.data.property_id).toBe(1);
    expect(result.message).toBe('Property created successfully');
  });

  it('should throw NotFoundException for non-existent property', async () => {
    mockPropertyRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
