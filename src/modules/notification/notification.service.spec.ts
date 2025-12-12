import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification, NotificationType } from './entities/notification.entity';
import { User, UserRole, UserStatus } from '../user/entities/user.entity';

describe('NotificationService - Dịch vụ Thông báo', () => {
  let dichVu: NotificationService;
  let khoThongBao: jest.Mocked<Repository<Notification>>;
  let khoNguoiDung: jest.Mocked<Repository<User>>;

  // Dữ liệu mẫu
  const nguoiDungMau: Partial<User> = {
    id: 'uuid-user-123',
    firstName: 'Nguyễn',
    lastName: 'Văn A',
    email: 'nguyenvana@example.com',
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
  };

  const thongBaoMau: Partial<Notification> = {
    id: 'uuid-thongbao-123',
    userId: 'uuid-user-123',
    type: NotificationType.SYSTEM,
    title: 'Thông báo hệ thống',
    message: 'Nội dung thông báo',
    isRead: false,
    relatedId: null,
    relatedType: null,
    link: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: { ...mockRepository },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { ...mockRepository },
        },
      ],
    }).compile();

    dichVu = module.get<NotificationService>(NotificationService);
    khoThongBao = module.get(getRepositoryToken(Notification));
    khoNguoiDung = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create - Tạo thông báo', () => {
    it('nên tạo thông báo mới thành công', async () => {
      // Arrange
      const duLieuTao = {
        userId: 'uuid-user-123',
        title: 'Thông báo mới',
        message: 'Nội dung thông báo',
      };
      khoThongBao.create.mockReturnValue(thongBaoMau as Notification);
      khoThongBao.save.mockResolvedValue(thongBaoMau as Notification);

      // Act
      const ketQua = await dichVu.create(duLieuTao);

      // Assert
      expect(khoThongBao.create).toHaveBeenCalled();
      expect(khoThongBao.save).toHaveBeenCalled();
      expect(ketQua.userId).toBe('uuid-user-123');
    });

    it('nên sử dụng loại SYSTEM mặc định', async () => {
      // Arrange
      const duLieuTao = {
        userId: 'uuid-user-123',
        title: 'Thông báo',
        message: 'Nội dung',
      };
      khoThongBao.create.mockReturnValue(thongBaoMau as Notification);
      khoThongBao.save.mockResolvedValue(thongBaoMau as Notification);

      // Act
      await dichVu.create(duLieuTao);

      // Assert
      expect(khoThongBao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.SYSTEM,
        }),
      );
    });
  });

  describe('broadcast - Gửi thông báo hàng loạt', () => {
    it('nên gửi thông báo đến tất cả người dùng', async () => {
      // Arrange
      const nguoiDungDanhSach = [
        { ...nguoiDungMau, id: 'uuid-1' },
        { ...nguoiDungMau, id: 'uuid-2' },
        { ...nguoiDungMau, id: 'uuid-3' },
      ];
      khoNguoiDung.find.mockResolvedValue(nguoiDungDanhSach as User[]);
      khoThongBao.create.mockReturnValue(thongBaoMau as Notification);
      khoThongBao.save.mockResolvedValue([thongBaoMau] as Notification[]);

      // Act
      const soLuong = await dichVu.broadcast({
        title: 'Thông báo chung',
        message: 'Nội dung chung',
      });

      // Assert
      expect(soLuong).toBe(3);
    });

    it('nên chỉ gửi đến danh sách người dùng được chỉ định', async () => {
      // Arrange
      const nguoiDungDanhSach = [
        { ...nguoiDungMau, id: 'uuid-1' },
        { ...nguoiDungMau, id: 'uuid-2' },
      ];
      khoNguoiDung.find.mockResolvedValue(nguoiDungDanhSach as User[]);
      khoThongBao.create.mockReturnValue(thongBaoMau as Notification);
      khoThongBao.save.mockResolvedValue([thongBaoMau] as Notification[]);

      // Act
      const soLuong = await dichVu.broadcast({
        title: 'Thông báo',
        message: 'Nội dung',
        userIds: ['uuid-1', 'uuid-2'],
      });

      // Assert
      expect(soLuong).toBe(2);
    });
  });

  describe('findByUser - Tìm thông báo theo người dùng', () => {
    it('nên trả về danh sách thông báo', async () => {
      // Arrange
      khoThongBao.find.mockResolvedValue([thongBaoMau as Notification]);

      // Act
      const ketQua = await dichVu.findByUser('uuid-user-123');

      // Assert
      expect(ketQua).toHaveLength(1);
    });

    it('nên chỉ trả về thông báo chưa đọc nếu có tham số', async () => {
      // Arrange
      khoThongBao.find.mockResolvedValue([thongBaoMau as Notification]);

      // Act
      await dichVu.findByUser('uuid-user-123', true);

      // Assert
      expect(khoThongBao.find).toHaveBeenCalled();
    });
  });

  describe('findOne - Tìm một thông báo', () => {
    it('nên trả về thông báo nếu tồn tại', async () => {
      // Arrange
      khoThongBao.findOne.mockResolvedValue(thongBaoMau as Notification);

      // Act
      const ketQua = await dichVu.findOne('uuid-thongbao-123');

      // Assert
      expect(ketQua).toEqual(thongBaoMau);
    });

    it('nên ném lỗi nếu không tìm thấy', async () => {
      // Arrange
      khoThongBao.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(dichVu.findOne('uuid-khong-ton-tai')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
