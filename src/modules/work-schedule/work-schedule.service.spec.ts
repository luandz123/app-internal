import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { DichVuLichLamViec } from './work-schedule.service';
import { WorkSchedule, WorkType } from './entities/work-schedule.entity';
import { RegistrationPeriodService } from '../registration-period/registration-period.service';
import {
  RegistrationPeriod,
  RegistrationPeriodStatus,
} from '../registration-period/entities/registration-period.entity';

describe('DichVuLichLamViec - Dịch vụ Lịch làm việc', () => {
  let dichVu: DichVuLichLamViec;
  let khoLich: jest.Mocked<Repository<WorkSchedule>>;
  let dichVuKy: jest.Mocked<RegistrationPeriodService>;

  // Dữ liệu mẫu
  const kyDangKyMau: Partial<RegistrationPeriod> = {
    id: 'uuid-ky-123',
    name: 'Tháng 1/2026',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    registrationDeadline: new Date('2025-12-25'),
    status: RegistrationPeriodStatus.OPEN,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const lichLamViecMau: Partial<WorkSchedule> = {
    id: 'uuid-lich-123',
    userId: 'uuid-user-123',
    periodId: 'uuid-ky-123',
    date: new Date('2026-01-15'),
    workType: WorkType.WFO,
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

    const mockDichVuKy = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DichVuLichLamViec,
        {
          provide: getRepositoryToken(WorkSchedule),
          useValue: { ...mockRepository },
        },
        {
          provide: RegistrationPeriodService,
          useValue: mockDichVuKy,
        },
      ],
    }).compile();

    dichVu = module.get<DichVuLichLamViec>(DichVuLichLamViec);
    khoLich = module.get(getRepositoryToken(WorkSchedule));
    dichVuKy = module.get(RegistrationPeriodService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('taoHangLoat - Tạo lịch hàng loạt', () => {
    it('nên tạo lịch làm việc thành công', async () => {
      // Arrange
      const duLieuTao = {
        periodId: 'uuid-ky-123',
        schedules: [
          { date: '2026-01-15', workType: WorkType.WFO },
          { date: '2026-01-16', workType: WorkType.REMOTE },
        ],
      };
      dichVuKy.findOne.mockResolvedValue(kyDangKyMau as RegistrationPeriod);
      khoLich.delete.mockResolvedValue({ affected: 0, raw: {} });
      khoLich.create.mockReturnValue(lichLamViecMau as WorkSchedule);
      khoLich.save.mockResolvedValue([lichLamViecMau] as WorkSchedule[]);

      // Act
      await dichVu.taoHangLoat('uuid-user-123', duLieuTao);

      // Assert
      expect(dichVuKy.findOne).toHaveBeenCalledWith('uuid-ky-123');
      expect(khoLich.delete).toHaveBeenCalled();
      expect(khoLich.save).toHaveBeenCalled();
    });

    it('nên ném lỗi nếu kỳ đăng ký chưa mở', async () => {
      // Arrange
      const kyDong = {
        ...kyDangKyMau,
        status: RegistrationPeriodStatus.CLOSED,
      };
      dichVuKy.findOne.mockResolvedValue(kyDong as RegistrationPeriod);

      const duLieuTao = {
        periodId: 'uuid-ky-123',
        schedules: [{ date: '2026-01-15', workType: WorkType.WFO }],
      };

      // Act & Assert
      await expect(
        dichVu.taoHangLoat('uuid-user-123', duLieuTao),
      ).rejects.toThrow(BadRequestException);
    });

    it('nên ném lỗi nếu đã quá hạn đăng ký', async () => {
      // Arrange
      const kyQuaHan = {
        ...kyDangKyMau,
        registrationDeadline: new Date('2020-01-01'),
      };
      dichVuKy.findOne.mockResolvedValue(kyQuaHan as RegistrationPeriod);

      const duLieuTao = {
        periodId: 'uuid-ky-123',
        schedules: [{ date: '2026-01-15', workType: WorkType.WFO }],
      };

      // Act & Assert
      await expect(
        dichVu.taoHangLoat('uuid-user-123', duLieuTao),
      ).rejects.toThrow(BadRequestException);
    });

    it('nên ném lỗi nếu ngày không nằm trong kỳ đăng ký', async () => {
      // Arrange
      dichVuKy.findOne.mockResolvedValue(kyDangKyMau as RegistrationPeriod);

      const duLieuTao = {
        periodId: 'uuid-ky-123',
        schedules: [{ date: '2026-03-15', workType: WorkType.WFO }], // Ngoài tháng 1
      };

      // Act & Assert
      await expect(
        dichVu.taoHangLoat('uuid-user-123', duLieuTao),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('timTheoNguoiDung - Tìm lịch theo người dùng', () => {
    it('nên trả về danh sách lịch của người dùng', async () => {
      // Arrange
      khoLich.find.mockResolvedValue([lichLamViecMau as WorkSchedule]);

      // Act
      const ketQua = await dichVu.timTheoNguoiDung('uuid-user-123');

      // Assert
      expect(ketQua).toHaveLength(1);
      expect(khoLich.find).toHaveBeenCalled();
    });
  });

  describe('timTheoNguoiDungVaKy - Tìm lịch theo người dùng và kỳ', () => {
    it('nên trả về danh sách lịch theo kỳ cụ thể', async () => {
      // Arrange
      khoLich.find.mockResolvedValue([lichLamViecMau as WorkSchedule]);

      // Act
      const ketQua = await dichVu.timTheoNguoiDungVaKy(
        'uuid-user-123',
        'uuid-ky-123',
      );

      // Assert
      expect(ketQua).toHaveLength(1);
    });
  });

  describe('timTheoKy - Tìm tất cả lịch của kỳ', () => {
    it('nên trả về danh sách lịch của tất cả người dùng trong kỳ', async () => {
      // Arrange
      khoLich.find.mockResolvedValue([lichLamViecMau as WorkSchedule]);

      // Act
      const ketQua = await dichVu.timTheoKy('uuid-ky-123');

      // Assert
      expect(ketQua).toHaveLength(1);
    });
  });
});
