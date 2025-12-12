import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RegistrationPeriodService } from './registration-period.service';
import {
  RegistrationPeriod,
  RegistrationPeriodStatus,
  PeriodType,
} from './entities/registration-period.entity';

describe('RegistrationPeriodService - Dịch vụ Kỳ đăng ký', () => {
  let dichVu: RegistrationPeriodService;
  let khoKy: jest.Mocked<Repository<RegistrationPeriod>>;

  // Dữ liệu mẫu
  const kyDangKyMau: Partial<RegistrationPeriod> = {
    id: 'uuid-ky-123',
    name: 'Tháng 1/2025',
    description: 'Kỳ đăng ký lịch làm việc tháng 1',
    type: PeriodType.MONTHLY,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
    registrationDeadline: new Date('2024-12-25'),
    status: RegistrationPeriodStatus.OPEN,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationPeriodService,
        {
          provide: getRepositoryToken(RegistrationPeriod),
          useValue: { ...mockRepository },
        },
      ],
    }).compile();

    dichVu = module.get<RegistrationPeriodService>(RegistrationPeriodService);
    khoKy = module.get(getRepositoryToken(RegistrationPeriod));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create - Tạo kỳ đăng ký', () => {
    it('nên tạo kỳ đăng ký mới thành công', async () => {
      // Arrange
      const duLieuTao = {
        name: 'Tháng 2/2025',
        type: PeriodType.MONTHLY,
        startDate: '2025-02-01',
        endDate: '2025-02-28',
        registrationDeadline: '2025-01-25',
      };
      khoKy.create.mockReturnValue(kyDangKyMau as RegistrationPeriod);
      khoKy.save.mockResolvedValue(kyDangKyMau as RegistrationPeriod);

      // Act
      const ketQua = await dichVu.create(duLieuTao);

      // Assert
      expect(khoKy.create).toHaveBeenCalled();
      expect(khoKy.save).toHaveBeenCalled();
      expect(ketQua.status).toBe(RegistrationPeriodStatus.OPEN);
    });

    it('nên ném lỗi nếu ngày bắt đầu >= ngày kết thúc', async () => {
      // Arrange
      const duLieuSai = {
        name: 'Kỳ sai',
        type: PeriodType.MONTHLY,
        startDate: '2025-02-28',
        endDate: '2025-02-01',
        registrationDeadline: '2025-01-25',
      };

      // Act & Assert
      await expect(dichVu.create(duLieuSai)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('nên ném lỗi nếu hạn đăng ký >= ngày bắt đầu', async () => {
      // Arrange
      const duLieuSai = {
        name: 'Kỳ sai',
        type: PeriodType.MONTHLY,
        startDate: '2025-02-01',
        endDate: '2025-02-28',
        registrationDeadline: '2025-02-05', // Hạn sau ngày bắt đầu
      };

      // Act & Assert
      await expect(dichVu.create(duLieuSai)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll - Tìm tất cả kỳ', () => {
    it('nên trả về danh sách tất cả kỳ đăng ký', async () => {
      // Arrange
      khoKy.find.mockResolvedValue([kyDangKyMau as RegistrationPeriod]);

      // Act
      const ketQua = await dichVu.findAll();

      // Assert
      expect(ketQua).toHaveLength(1);
      expect(khoKy.find).toHaveBeenCalled();
    });
  });

  describe('findOne - Tìm một kỳ', () => {
    it('nên trả về kỳ đăng ký nếu tồn tại', async () => {
      // Arrange
      khoKy.findOne.mockResolvedValue(kyDangKyMau as RegistrationPeriod);

      // Act
      const ketQua = await dichVu.findOne('uuid-ky-123');

      // Assert
      expect(ketQua).toEqual(kyDangKyMau);
    });

    it('nên ném lỗi nếu không tìm thấy', async () => {
      // Arrange
      khoKy.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(dichVu.findOne('uuid-khong-ton-tai')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findActive - Tìm kỳ đang mở', () => {
    it('nên trả về danh sách kỳ có trạng thái OPEN', async () => {
      // Arrange
      khoKy.find.mockResolvedValue([kyDangKyMau as RegistrationPeriod]);

      // Act
      const ketQua = await dichVu.findActive();

      // Assert
      expect(ketQua).toHaveLength(1);
      expect(ketQua[0]?.status).toBe(RegistrationPeriodStatus.OPEN);
    });
  });

  describe('update - Cập nhật kỳ', () => {
    it('nên cập nhật kỳ đăng ký thành công', async () => {
      // Arrange
      khoKy.findOne.mockResolvedValue(kyDangKyMau as RegistrationPeriod);
      const kyCapNhat = { ...kyDangKyMau, name: 'Tên mới' };
      khoKy.save.mockResolvedValue(kyCapNhat as RegistrationPeriod);

      // Act
      const ketQua = await dichVu.update('uuid-ky-123', { name: 'Tên mới' });

      // Assert
      expect(ketQua.name).toBe('Tên mới');
    });
  });
});
