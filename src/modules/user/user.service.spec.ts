import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { User, UserRole, UserStatus } from './entities/user.entity';

// Mock bcrypt
jest.mock('bcrypt');

describe('UserService - Dịch vụ Người dùng', () => {
  let dichVuNguoiDung: UserService;
  let khoNguoiDung: jest.Mocked<Repository<User>>;

  // Dữ liệu mẫu cho test
  const nguoiDungMau: User = {
    id: 'uuid-test-123',
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

  const danhSachNguoiDung: User[] = [
    nguoiDungMau,
    {
      ...nguoiDungMau,
      id: 'uuid-test-456',
      firstName: 'Trần',
      lastName: 'Thị B',
      email: 'tranthib@example.com',
    },
  ];

  beforeEach(async () => {
    // Tạo mock cho repository
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue(10),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    dichVuNguoiDung = module.get<UserService>(UserService);
    khoNguoiDung = module.get(getRepositoryToken(User));

    // Mock bcrypt.hash
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedpassword');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('taoNguoiDung - Tạo người dùng mới', () => {
    const duLieuTaoNguoiDung = {
      firstName: 'Nguyễn',
      lastName: 'Văn A',
      email: 'nguyenvana@example.com',
      password: 'matkhau123',
      position: 'Nhân viên',
    };

    it('nên tạo người dùng mới thành công', async () => {
      // Arrange
      khoNguoiDung.findOne.mockResolvedValue(null); // Email chưa tồn tại
      khoNguoiDung.create.mockReturnValue(nguoiDungMau);
      khoNguoiDung.save.mockResolvedValue(nguoiDungMau);

      // Act
      const ketQua = await dichVuNguoiDung.taoNguoiDung(duLieuTaoNguoiDung);

      // Assert
      expect(khoNguoiDung.create).toHaveBeenCalled();
      expect(khoNguoiDung.save).toHaveBeenCalled();
      expect(ketQua).toEqual(nguoiDungMau);
    });

    it('nên ném lỗi khi email đã tồn tại', async () => {
      // Arrange
      khoNguoiDung.findOne.mockResolvedValue(nguoiDungMau);

      // Act & Assert
      await expect(
        dichVuNguoiDung.taoNguoiDung(duLieuTaoNguoiDung),
      ).rejects.toThrow(ConflictException);
    });

    it('nên mã hóa mật khẩu trước khi lưu', async () => {
      // Arrange
      khoNguoiDung.findOne.mockResolvedValue(null);
      khoNguoiDung.create.mockReturnValue(nguoiDungMau);
      khoNguoiDung.save.mockResolvedValue(nguoiDungMau);

      // Act
      await dichVuNguoiDung.taoNguoiDung(duLieuTaoNguoiDung);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(duLieuTaoNguoiDung.password, 10);
    });

    it('nên đặt role mặc định là STAFF nếu không truyền', async () => {
      // Arrange
      khoNguoiDung.findOne.mockResolvedValue(null);
      khoNguoiDung.create.mockReturnValue(nguoiDungMau);
      khoNguoiDung.save.mockResolvedValue(nguoiDungMau);

      // Act
      await dichVuNguoiDung.taoNguoiDung(duLieuTaoNguoiDung);

      // Assert
      expect(khoNguoiDung.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.STAFF,
        }),
      );
    });
  });

  describe('layTatCa - Lấy tất cả người dùng', () => {
    it('nên trả về danh sách tất cả người dùng', async () => {
      // Arrange
      khoNguoiDung.find.mockResolvedValue(danhSachNguoiDung);

      // Act
      const ketQua = await dichVuNguoiDung.layTatCa();

      // Assert
      expect(khoNguoiDung.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(ketQua).toEqual(danhSachNguoiDung);
      expect(ketQua).toHaveLength(2);
    });

    it('nên trả về mảng rỗng nếu không có người dùng', async () => {
      // Arrange
      khoNguoiDung.find.mockResolvedValue([]);

      // Act
      const ketQua = await dichVuNguoiDung.layTatCa();

      // Assert
      expect(ketQua).toEqual([]);
    });
  });

  describe('layNguoiDungHoatDong - Lấy người dùng đang hoạt động', () => {
    it('nên chỉ trả về người dùng có status ACTIVE', async () => {
      // Arrange
      const nguoiDungHoatDong = danhSachNguoiDung.filter(
        (u) => u.status === UserStatus.ACTIVE,
      );
      khoNguoiDung.find.mockResolvedValue(nguoiDungHoatDong);

      // Act
      const ketQua = await dichVuNguoiDung.layNguoiDungHoatDong();

      // Assert
      expect(khoNguoiDung.find).toHaveBeenCalledWith({
        where: { status: UserStatus.ACTIVE },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('timTheoId - Tìm người dùng theo ID', () => {
    it('nên trả về người dùng khi tìm thấy', async () => {
      // Arrange
      khoNguoiDung.findOne.mockResolvedValue(nguoiDungMau);

      // Act
      const ketQua = await dichVuNguoiDung.timTheoId('uuid-test-123');

      // Assert
      expect(khoNguoiDung.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-test-123' },
      });
      expect(ketQua).toEqual(nguoiDungMau);
    });

    it('nên ném lỗi NotFoundException khi không tìm thấy', async () => {
      // Arrange
      khoNguoiDung.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        dichVuNguoiDung.timTheoId('uuid-khong-ton-tai'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        dichVuNguoiDung.timTheoId('uuid-khong-ton-tai'),
      ).rejects.toThrow('Không tìm thấy người dùng');
    });
  });

  describe('timTheoEmail - Tìm người dùng theo email', () => {
    it('nên trả về người dùng khi email tồn tại', async () => {
      // Arrange
      khoNguoiDung.findOne.mockResolvedValue(nguoiDungMau);

      // Act
      const ketQua = await dichVuNguoiDung.timTheoEmail(
        'nguyenvana@example.com',
      );

      // Assert
      expect(khoNguoiDung.findOne).toHaveBeenCalledWith({
        where: { email: 'nguyenvana@example.com' },
      });
      expect(ketQua).toEqual(nguoiDungMau);
    });

    it('nên trả về null khi email không tồn tại', async () => {
      // Arrange
      khoNguoiDung.findOne.mockResolvedValue(null);

      // Act
      const ketQua = await dichVuNguoiDung.timTheoEmail(
        'khongtontai@example.com',
      );

      // Assert
      expect(ketQua).toBeNull();
    });

    it('nên chuyển email sang chữ thường trước khi tìm', async () => {
      // Arrange
      khoNguoiDung.findOne.mockResolvedValue(null);

      // Act
      await dichVuNguoiDung.timTheoEmail('NGUYENVANA@EXAMPLE.COM');

      // Assert
      expect(khoNguoiDung.findOne).toHaveBeenCalledWith({
        where: { email: 'nguyenvana@example.com' },
      });
    });
  });

  describe('capNhatNguoiDung - Cập nhật thông tin người dùng', () => {
    it('nên cập nhật thông tin người dùng thành công', async () => {
      // Arrange
      const duLieuCapNhat = { firstName: 'Lê', lastName: 'Văn C' };
      const nguoiDungDaCapNhat = { ...nguoiDungMau, ...duLieuCapNhat };

      khoNguoiDung.findOne.mockResolvedValue(nguoiDungMau);
      khoNguoiDung.save.mockResolvedValue(nguoiDungDaCapNhat);

      // Act
      const ketQua = await dichVuNguoiDung.capNhatNguoiDung(
        'uuid-test-123',
        duLieuCapNhat,
      );

      // Assert
      expect(khoNguoiDung.save).toHaveBeenCalled();
      expect(ketQua.firstName).toBe('Lê');
    });

    it('nên kiểm tra email trùng lặp khi cập nhật email', async () => {
      // Arrange
      const duLieuCapNhat = { email: 'emailmoi@example.com' };
      const nguoiDungKhac = {
        ...nguoiDungMau,
        id: 'uuid-khac',
        email: 'emailmoi@example.com',
      };

      // Lần 1: tìm user hiện tại, lần 2: kiểm tra email trùng
      khoNguoiDung.findOne
        .mockResolvedValueOnce(nguoiDungMau)
        .mockResolvedValueOnce(nguoiDungKhac);

      // Act & Assert
      await expect(
        dichVuNguoiDung.capNhatNguoiDung('uuid-test-123', duLieuCapNhat),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('voHieuHoa - Vô hiệu hóa người dùng', () => {
    it('nên đặt status thành INACTIVE', async () => {
      // Arrange
      const nguoiDungBiVoHieuHoa = {
        ...nguoiDungMau,
        status: UserStatus.INACTIVE,
      };
      khoNguoiDung.findOne.mockResolvedValue(nguoiDungMau);
      khoNguoiDung.save.mockResolvedValue(nguoiDungBiVoHieuHoa);

      // Act
      const ketQua = await dichVuNguoiDung.voHieuHoa('uuid-test-123');

      // Assert
      expect(ketQua.status).toBe(UserStatus.INACTIVE);
    });
  });

  describe('kichHoat - Kích hoạt người dùng', () => {
    it('nên đặt status thành ACTIVE', async () => {
      // Arrange
      const nguoiDungBiVoHieuHoa = {
        ...nguoiDungMau,
        status: UserStatus.INACTIVE,
      };
      const nguoiDungDaKichHoat = {
        ...nguoiDungMau,
        status: UserStatus.ACTIVE,
      };

      khoNguoiDung.findOne.mockResolvedValue(nguoiDungBiVoHieuHoa);
      khoNguoiDung.save.mockResolvedValue(nguoiDungDaKichHoat);

      // Act
      const ketQua = await dichVuNguoiDung.kichHoat('uuid-test-123');

      // Assert
      expect(ketQua.status).toBe(UserStatus.ACTIVE);
    });
  });

  describe('xoaNguoiDung - Xóa người dùng', () => {
    it('nên xóa người dùng thành công', async () => {
      // Arrange
      khoNguoiDung.findOne.mockResolvedValue(nguoiDungMau);
      khoNguoiDung.remove.mockResolvedValue(nguoiDungMau);

      // Act
      const ketQua = await dichVuNguoiDung.xoaNguoiDung('uuid-test-123');

      // Assert
      expect(khoNguoiDung.remove).toHaveBeenCalledWith(nguoiDungMau);
      expect(ketQua).toEqual(nguoiDungMau);
    });

    it('nên ném lỗi khi người dùng không tồn tại', async () => {
      // Arrange
      khoNguoiDung.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        dichVuNguoiDung.xoaNguoiDung('uuid-khong-ton-tai'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('datLaiMatKhau - Đặt lại mật khẩu', () => {
    it('nên mã hóa và lưu mật khẩu mới', async () => {
      // Arrange
      khoNguoiDung.findOne.mockResolvedValue(nguoiDungMau);
      khoNguoiDung.save.mockResolvedValue({
        ...nguoiDungMau,
        passwordHash: '$2b$10$newhashedpassword',
      });

      // Act
      await dichVuNguoiDung.datLaiMatKhau('uuid-test-123', 'matkhaumoi123');

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('matkhaumoi123', 10);
      expect(khoNguoiDung.save).toHaveBeenCalled();
    });
  });

  describe('laySoDuNgayPhep - Lấy số dư ngày phép', () => {
    it('nên tính toán số ngày phép còn lại chính xác', async () => {
      // Arrange
      khoNguoiDung.findOne.mockResolvedValue(nguoiDungMau);

      // Act
      const ketQua = await dichVuNguoiDung.laySoDuNgayPhep('uuid-test-123');

      // Assert
      expect(ketQua.soNgayPhepNam).toBe(12);
      expect(ketQua.soNgayDaSuDung).toBe(2);
      expect(ketQua.soNgayConLai).toBe(10);
      expect(ketQua.remainingLeaveDays).toBe(10);
    });
  });
});
