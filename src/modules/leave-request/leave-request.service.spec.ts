import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import {
  LeaveRequest,
  LeaveRequestStatus,
  LeaveRequestType,
} from './entities/leave-request.entity';
import { User, UserRole, UserStatus } from '../user/entities/user.entity';

describe('LeaveRequestService - Dịch vụ Đơn nghỉ phép', () => {
  let dichVu: LeaveRequestService;
  let khoLuuDon: jest.Mocked<Repository<LeaveRequest>>;
  let khoLuuNguoiDung: jest.Mocked<Repository<User>>;

  // Dữ liệu mẫu
  const nguoiDungMau: User = {
    id: 'uuid-user-123',
    firstName: 'Nguyễn',
    lastName: 'Văn A',
    email: 'nguyenvana@example.com',
    passwordHash: '$2b$10$hashedpassword',
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    position: 'Nhân viên',
    phone: '0123456789',
    address: 'Hà Nội',
    avatar: null,
    baseSalary: 10000000,
    annualLeaveDays: 12,
    usedLeaveDays: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const donNghiPhepMau: Partial<LeaveRequest> = {
    id: 'uuid-don-123',
    userId: nguoiDungMau.id,
    type: LeaveRequestType.ANNUAL_LEAVE,
    status: LeaveRequestStatus.PENDING,
    startDate: new Date('2025-01-20'),
    endDate: new Date('2025-01-21'),
    startTime: null,
    endTime: null,
    totalDays: 2,
    reason: 'Nghỉ phép cá nhân',
    attachments: null,
    approvedById: null,
    approvedBy: null,
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveRequestService,
        {
          provide: getRepositoryToken(LeaveRequest),
          useValue: { ...mockRepository },
        },
        { provide: getRepositoryToken(User), useValue: { ...mockRepository } },
      ],
    }).compile();

    dichVu = module.get<LeaveRequestService>(LeaveRequestService);
    khoLuuDon = module.get(getRepositoryToken(LeaveRequest));
    khoLuuNguoiDung = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create - Tạo đơn nghỉ phép', () => {
    it('nên tạo đơn nghỉ phép thành công', async () => {
      // Arrange
      const duLieuTao = {
        type: LeaveRequestType.ANNUAL_LEAVE,
        startDate: '2025-01-20',
        endDate: '2025-01-21',
        reason: 'Nghỉ phép cá nhân',
      };
      khoLuuDon.create.mockReturnValue(donNghiPhepMau as LeaveRequest);
      khoLuuDon.save.mockResolvedValue(donNghiPhepMau as LeaveRequest);

      // Act
      const ketQua = await dichVu.create(nguoiDungMau.id, duLieuTao);

      // Assert
      expect(khoLuuDon.create).toHaveBeenCalled();
      expect(khoLuuDon.save).toHaveBeenCalled();
      expect(ketQua.status).toBe(LeaveRequestStatus.PENDING);
    });

    it('nên ném lỗi nếu ngày bắt đầu lớn hơn ngày kết thúc', async () => {
      // Arrange
      const duLieuSai = {
        type: LeaveRequestType.ANNUAL_LEAVE,
        startDate: '2025-01-25',
        endDate: '2025-01-20',
        reason: 'Nghỉ phép cá nhân',
      };

      // Act & Assert
      await expect(dichVu.create(nguoiDungMau.id, duLieuSai)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('nên tính số ngày nghỉ tự động nếu không truyền', async () => {
      // Arrange
      const duLieuTao = {
        type: LeaveRequestType.ANNUAL_LEAVE,
        startDate: '2025-01-20',
        endDate: '2025-01-22',
        reason: 'Nghỉ phép cá nhân',
      };
      khoLuuDon.create.mockReturnValue({
        ...donNghiPhepMau,
        totalDays: 3,
      } as LeaveRequest);
      khoLuuDon.save.mockResolvedValue({
        ...donNghiPhepMau,
        totalDays: 3,
      } as LeaveRequest);

      // Act
      const ketQua = await dichVu.create(nguoiDungMau.id, duLieuTao);

      // Assert
      expect(ketQua.totalDays).toBe(3);
    });
  });

  describe('findAll - Tìm tất cả đơn', () => {
    it('nên trả về danh sách đơn theo điều kiện', async () => {
      // Arrange
      khoLuuDon.find.mockResolvedValue([donNghiPhepMau as LeaveRequest]);

      // Act
      const ketQua = await dichVu.findAll({
        status: LeaveRequestStatus.PENDING,
      });

      // Assert
      expect(khoLuuDon.find).toHaveBeenCalled();
      expect(ketQua).toHaveLength(1);
    });

    it('nên lọc theo userId nếu được cung cấp', async () => {
      // Arrange
      khoLuuDon.find.mockResolvedValue([donNghiPhepMau as LeaveRequest]);

      // Act
      await dichVu.findAll({ userId: nguoiDungMau.id });

      // Assert
      expect(khoLuuDon.find).toHaveBeenCalled();
    });
  });

  describe('findByUser - Tìm đơn theo người dùng', () => {
    it('nên trả về danh sách đơn của người dùng', async () => {
      // Arrange
      khoLuuDon.find.mockResolvedValue([donNghiPhepMau as LeaveRequest]);

      // Act
      const ketQua = await dichVu.findByUser(nguoiDungMau.id);

      // Assert
      expect(ketQua).toHaveLength(1);
      expect(ketQua[0]?.userId).toBe(nguoiDungMau.id);
    });
  });

  describe('findPending - Tìm đơn chờ duyệt', () => {
    it('nên trả về danh sách đơn đang chờ duyệt', async () => {
      // Arrange
      khoLuuDon.find.mockResolvedValue([donNghiPhepMau as LeaveRequest]);

      // Act
      const ketQua = await dichVu.findPending();

      // Assert
      expect(ketQua).toHaveLength(1);
      expect(ketQua[0]?.status).toBe(LeaveRequestStatus.PENDING);
    });
  });

  describe('findOne - Tìm một đơn', () => {
    it('nên trả về đơn nếu tồn tại', async () => {
      // Arrange
      khoLuuDon.findOne.mockResolvedValue(donNghiPhepMau as LeaveRequest);

      // Act
      const ketQua = await dichVu.findOne('uuid-don-123');

      // Assert
      expect(ketQua).toEqual(donNghiPhepMau);
    });

    it('nên ném lỗi nếu đơn không tồn tại', async () => {
      // Arrange
      khoLuuDon.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(dichVu.findOne('uuid-khong-ton-tai')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update - Cập nhật đơn', () => {
    it('nên cập nhật đơn thành công', async () => {
      // Arrange
      khoLuuDon.findOne.mockResolvedValue(donNghiPhepMau as LeaveRequest);
      const donCapNhat = { ...donNghiPhepMau, reason: 'Lý do mới' };
      khoLuuDon.save.mockResolvedValue(donCapNhat as LeaveRequest);

      // Act
      const ketQua = await dichVu.update('uuid-don-123', nguoiDungMau.id, {
        reason: 'Lý do mới',
      });

      // Assert
      expect(ketQua.reason).toBe('Lý do mới');
    });

    it('nên ném lỗi nếu đơn không thuộc về người dùng', async () => {
      // Arrange
      khoLuuDon.findOne.mockResolvedValue(donNghiPhepMau as LeaveRequest);

      // Act & Assert
      await expect(
        dichVu.update('uuid-don-123', 'uuid-khac', { reason: 'Lý do mới' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('nên ném lỗi nếu đơn không ở trạng thái chờ duyệt', async () => {
      // Arrange
      const donDaDuyet = {
        ...donNghiPhepMau,
        status: LeaveRequestStatus.APPROVED,
      };
      khoLuuDon.findOne.mockResolvedValue(donDaDuyet as LeaveRequest);

      // Act & Assert
      await expect(
        dichVu.update('uuid-don-123', nguoiDungMau.id, { reason: 'Lý do mới' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
