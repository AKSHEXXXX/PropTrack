import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/auth/auth.service';
import { User } from '../../src/auth/entities/user.entity';
import * as bcrypt from 'bcrypt';

// Mock bcrypt so hashing is instant and fully deterministic in unit tests
jest.mock('bcrypt');

// ---------------------------------------------------------------------------
// Query-builder chain used by AuthService.login (createQueryBuilder path)
// ---------------------------------------------------------------------------
const mockQb = {
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
};

// ---------------------------------------------------------------------------
// Repository mock – includes createQueryBuilder for the login path
// ---------------------------------------------------------------------------
const mockUserRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQb),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

// ---------------------------------------------------------------------------

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Reset all mocks between tests, then restore stable defaults
    jest.clearAllMocks();
    mockUserRepo.createQueryBuilder.mockReturnValue(mockQb);
    mockQb.addSelect.mockReturnThis();
    mockQb.where.mockReturnThis();
    mockJwtService.sign.mockReturnValue('mock.jwt.token');
  });

  // -------------------------------------------------------------------------
  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue({
        id: 1,
        email: 'test@test.com',
        role: 'agent',
      });
      // save returns a user row that still carries the hashed password column
      mockUserRepo.save.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        role: 'agent',
        password: 'hashed',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await service.register({
        email: 'test@test.com',
        password: 'Test1234!',
        role: 'agent',
      });

      expect(result.data).toBeDefined();
      expect(result.data.email).toBe('test@test.com');
      // password must be stripped from the returned payload
      expect((result.data as any).password).toBeUndefined();
      expect(result.message).toBe('Registration successful');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 1, email: 'test@test.com' });

      await expect(
        service.register({
          email: 'test@test.com',
          password: 'Test1234!',
          role: 'agent',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // -------------------------------------------------------------------------
  describe('login', () => {
    it('should return JWT token on valid credentials', async () => {
      // bcrypt.hash is mocked; value is arbitrary – compare is also mocked
      const hashedPassword = await bcrypt.hash('Test1234!', 10);
      mockQb.getOne.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        password: hashedPassword,
        role: 'agent',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'test@test.com',
        password: 'Test1234!',
      });

      expect(result.data.accessToken).toBe('mock.jwt.token');
      expect(result.data.role).toBe('agent');
      expect(result.message).toBe('Login successful');
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPass!', 10);
      mockQb.getOne.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        password: hashedPassword,
        role: 'agent',
      });
      // Simulate a password mismatch
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@test.com', password: 'WrongPass!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockQb.getOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@test.com', password: 'Test1234!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
