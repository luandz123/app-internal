import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { Salary, SalaryStatus } from './entities/salary.entity';
import { UserService } from '../user/user.service';
import { User, UserRole, UserStatus } from '../user/entities/user.entity';

describe('SalaryService - Dịch vụ Bảng lương', () => {
  let dichVu: SalaryService;
  let khoLuong: jest.Mocked<Repository<Salary>>;
  let dichVuNguoiDung: jest.Mocked<UserService>;

  // Dữ liệu mẫu
  const nguoiDungMau: Partial<User> = {
    id: 'uuid-user-123',
    firstName: 'Nguyễn',
    lastName: 'Văn A',
    email: 'nguyenvana@example.com',
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    baseSalary: 10000000,
  };

  const luongMau: Partial<Salary> = {
    id: 'uuid-luong-123',
    userId: 'uuid-user-123',
    year: 2025,
    month: 1,
    baseSalary: 10000000,
    allowance: 1000000,
    bonus: 500000,
    overtimePay: 300000,
    deduction: 0,
    penalty: 0,
    insurance: 500000,
    tax: 300000,
    netSalary: 11000000,
    workDays: 22,
    actualWorkDays: 20,
    leaveDays: 2,
    overtimeHours: 8,
    status: SalaryStatus.DRAFT,
    note: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    const mockUserService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalaryService,
        {
          provide: getRepositoryToken(Salary),
          useValue: { ...mockRepository },
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    dichVu = module.get<SalaryService>(SalaryService);
    khoLuong = module.get(getRepositoryToken(Salary));
    dichVuNguoiDung = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create - Tạo bảng lương', () => {
    it('nên tạo bảng lương mới thành công', async () => {
      // Arrange
      const duLieuTao = {
        userId: 'uuid-user-123',
        year: 2025,
        month: 1,
        workDays: 22,
        actualWorkDays: 20,
      };
      khoLuong.findOne.mockResolvedValue(null); // Chưa có bảng lương
      dichVuNguoiDung.findOne.mockResolvedValue(nguoiDungMau as User);
      khoLuong.create.mockReturnValue(luongMau as Salary);
      khoLuong.save.mockResolvedValue(luongMau as Salary);

      // Act
      const ketQua = await dichVu.create(duLieuTao);

      // Assert
      expect(khoLuong.create).toHaveBeenCalled();
      expect(khoLuong.save).toHaveBeenCalled();
      expect(ketQua.userId).toBe('uuid-user-123');
    });

    it('nên ném lỗi nếu đã có bảng lương cho kỳ này', async () => {
      // Arrange
      const duLieuTao = {
        userId: 'uuid-user-123',
        year: 2025,
        month: 1,
      };
      khoLuong.findOne.mockResolvedValue(luongMau as Salary);

      // Act & Assert
      await expect(dichVu.create(duLieuTao)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll - Tìm tất cả bảng lương', () => {
    it('nên trả về danh sách bảng lương', async () => {
      // Arrange
      khoLuong.find.mockResolvedValue([luongMau as Salary]);

      // Act
      const ketQua = await dichVu.findAll(2025, 1);

      // Assert
      expect(ketQua).toHaveLength(1);
    });

    it('nên lọc theo năm và tháng', async () => {
      // Arrange
      khoLuong.find.mockResolvedValue([]);

      // Act
      await dichVu.findAll(2025, 6);

      // Assert
      expect(khoLuong.find).toHaveBeenCalled();
    });
  });

  describe('findByUser - Tìm bảng lương theo người dùng', () => {
    it('nên trả về danh sách bảng lương của người dùng', async () => {
      // Arrange
      khoLuong.find.mockResolvedValue([luongMau as Salary]);

      // Act
      const ketQua = await dichVu.findByUser('uuid-user-123');

      // Assert
      expect(ketQua).toHaveLength(1);
    });
  });

  describe('findOne - Tìm một bảng lương', () => {
    it('nên trả về bảng lương nếu tồn tại', async () => {
      // Arrange
      khoLuong.findOne.mockResolvedValue(luongMau as Salary);

      // Act
      const ketQua = await dichVu.findOne('uuid-luong-123');

      // Assert
      expect(ketQua).toEqual(luongMau);
    });

    it('nên ném lỗi nếu không tìm thấy', async () => {
      // Arrange
      khoLuong.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(dichVu.findOne('uuid-khong-ton-tai')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUserAndPeriod - Tìm theo người dùng và kỳ', () => {
    it('nên trả về bảng lương của kỳ cụ thể', async () => {
      // Arrange
      khoLuong.findOne.mockResolvedValue(luongMau as Salary);

      // Act
      const ketQua = await dichVu.findByUserAndPeriod('uuid-user-123', 2025, 1);

      // Assert
      expect(ketQua).toEqual(luongMau);
    });

    it('nên trả về null nếu không có bảng lương', async () => {
      // Arrange
      khoLuong.findOne.mockResolvedValue(null);

      // Act
      const ketQua = await dichVu.findByUserAndPeriod('uuid-user-123', 2025, 6);

      // Assert
      expect(ketQua).toBeNull();
    });
  });
});
