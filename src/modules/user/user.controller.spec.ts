import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserRole, UserStatus } from './entities/user.entity';

describe('UserController - Controller Người dùng', () => {
  let controller: UserController;
  let dichVuNguoiDung: jest.Mocked<UserService>;

  // Dữ liệu mẫu
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

  const danhSachNguoiDung = [nguoiDungMau];

  beforeEach(async () => {
    const mockUserService = {
      taoNguoiDung: jest.fn(),
      layTatCa: jest.fn(),
      layNguoiDungHoatDong: jest.fn(),
      timTheoId: jest.fn(),
      capNhatNguoiDung: jest.fn(),
      datLaiMatKhau: jest.fn(),
      kichHoat: jest.fn(),
      voHieuHoa: jest.fn(),
      xoaNguoiDung: jest.fn(),
      laySoDuNgayPhep: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
    dichVuNguoiDung = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('taoMoi - Tạo người dùng mới', () => {
    it('nên gọi service tạo người dùng', async () => {
      // Arrange
      const duLieuTao = {
        firstName: 'Nguyễn',
        lastName: 'Văn A',
        email: 'nguyenvana@example.com',
        password: 'matkhau123',
      };
      dichVuNguoiDung.taoNguoiDung.mockResolvedValue(nguoiDungMau);

      // Act
      const ketQua = await controller.taoMoi(duLieuTao);

      // Assert
      expect(dichVuNguoiDung.taoNguoiDung).toHaveBeenCalledWith(duLieuTao);
      expect(ketQua).toEqual(nguoiDungMau);
    });
  });

  describe('layTatCa - Lấy tất cả người dùng', () => {
    it('nên trả về danh sách người dùng', async () => {
      // Arrange
      dichVuNguoiDung.layTatCa.mockResolvedValue(danhSachNguoiDung);

      // Act
      const ketQua = await controller.layTatCa();

      // Assert
      expect(dichVuNguoiDung.layTatCa).toHaveBeenCalled();
      expect(ketQua).toEqual(danhSachNguoiDung);
    });
  });

  describe('layNguoiDungHoatDong - Lấy người dùng đang hoạt động', () => {
    it('nên trả về danh sách người dùng hoạt động', async () => {
      // Arrange
      dichVuNguoiDung.layNguoiDungHoatDong.mockResolvedValue(danhSachNguoiDung);

      // Act
      const ketQua = await controller.layNguoiDungHoatDong();

      // Assert
      expect(dichVuNguoiDung.layNguoiDungHoatDong).toHaveBeenCalled();
      expect(ketQua).toEqual(danhSachNguoiDung);
    });
  });

  describe('layHoSoCaNhan - Lấy hồ sơ cá nhân', () => {
    it('nên trả về thông tin người dùng hiện tại', async () => {
      // Arrange
      dichVuNguoiDung.timTheoId.mockResolvedValue(nguoiDungMau);

      // Act
      const ketQua = await controller.layHoSoCaNhan(nguoiDungMau);

      // Assert
      expect(dichVuNguoiDung.timTheoId).toHaveBeenCalledWith(nguoiDungMau.id);
      expect(ketQua).toEqual(nguoiDungMau);
    });
  });

  describe('timTheoId - Tìm người dùng theo ID', () => {
    it('nên trả về người dùng khi tìm thấy', async () => {
      // Arrange
      dichVuNguoiDung.timTheoId.mockResolvedValue(nguoiDungMau);

      // Act
      const ketQua = await controller.timTheoId('uuid-test-123');

      // Assert
      expect(dichVuNguoiDung.timTheoId).toHaveBeenCalledWith('uuid-test-123');
      expect(ketQua).toEqual(nguoiDungMau);
    });
  });

  describe('capNhatHoSoCaNhan - Cập nhật hồ sơ cá nhân', () => {
    it('nên cập nhật thông tin người dùng hiện tại', async () => {
      // Arrange
      const duLieuCapNhat = { firstName: 'Lê' };
      const nguoiDungDaCapNhat = { ...nguoiDungMau, firstName: 'Lê' };
      dichVuNguoiDung.capNhatNguoiDung.mockResolvedValue(nguoiDungDaCapNhat);

      // Act
      const ketQua = await controller.capNhatHoSoCaNhan(
        nguoiDungMau,
        duLieuCapNhat,
      );

      // Assert
      expect(dichVuNguoiDung.capNhatNguoiDung).toHaveBeenCalledWith(
        nguoiDungMau.id,
        duLieuCapNhat,
      );
      expect(ketQua.firstName).toBe('Lê');
    });
  });

  describe('capNhatNhanVien - Cập nhật thông tin nhân viên', () => {
    it('nên cập nhật thông tin nhân viên theo ID', async () => {
      // Arrange
      const duLieuCapNhat = { position: 'Quản lý' };
      const nguoiDungDaCapNhat = { ...nguoiDungMau, position: 'Quản lý' };
      dichVuNguoiDung.capNhatNguoiDung.mockResolvedValue(nguoiDungDaCapNhat);

      // Act
      const ketQua = await controller.capNhatNhanVien(
        'uuid-test-123',
        duLieuCapNhat,
      );

      // Assert
      expect(dichVuNguoiDung.capNhatNguoiDung).toHaveBeenCalledWith(
        'uuid-test-123',
        duLieuCapNhat,
      );
      expect(ketQua.position).toBe('Quản lý');
    });
  });

  describe('datLaiMatKhau - Đặt lại mật khẩu', () => {
    it('nên đặt lại mật khẩu cho nhân viên', async () => {
      // Arrange
      dichVuNguoiDung.datLaiMatKhau.mockResolvedValue(nguoiDungMau);

      // Act
      const ketQua = await controller.datLaiMatKhau('uuid-test-123', {
        newPassword: 'matkhaumoi123',
      });

      // Assert
      expect(dichVuNguoiDung.datLaiMatKhau).toHaveBeenCalledWith(
        'uuid-test-123',
        'matkhaumoi123',
      );
      expect(ketQua).toEqual(nguoiDungMau);
    });
  });

  describe('kichHoat - Kích hoạt tài khoản', () => {
    it('nên kích hoạt tài khoản nhân viên', async () => {
      // Arrange
      const nguoiDungDaKichHoat = {
        ...nguoiDungMau,
        status: UserStatus.ACTIVE,
      };
      dichVuNguoiDung.kichHoat.mockResolvedValue(nguoiDungDaKichHoat);

      // Act
      const ketQua = await controller.kichHoat('uuid-test-123');

      // Assert
      expect(dichVuNguoiDung.kichHoat).toHaveBeenCalledWith('uuid-test-123');
      expect(ketQua.status).toBe(UserStatus.ACTIVE);
    });
  });

  describe('voHieuHoa - Vô hiệu hóa tài khoản', () => {
    it('nên vô hiệu hóa tài khoản nhân viên', async () => {
      // Arrange
      const nguoiDungBiVoHieuHoa = {
        ...nguoiDungMau,
        status: UserStatus.INACTIVE,
      };
      dichVuNguoiDung.voHieuHoa.mockResolvedValue(nguoiDungBiVoHieuHoa);

      // Act
      const ketQua = await controller.voHieuHoa('uuid-test-123');

      // Assert
      expect(dichVuNguoiDung.voHieuHoa).toHaveBeenCalledWith('uuid-test-123');
      expect(ketQua.status).toBe(UserStatus.INACTIVE);
    });
  });

  describe('xoaNhanVien - Xóa nhân viên', () => {
    it('nên xóa nhân viên theo ID', async () => {
      // Arrange
      dichVuNguoiDung.xoaNguoiDung.mockResolvedValue(nguoiDungMau);

      // Act
      const ketQua = await controller.xoaNhanVien('uuid-test-123');

      // Assert
      expect(dichVuNguoiDung.xoaNguoiDung).toHaveBeenCalledWith(
        'uuid-test-123',
      );
      expect(ketQua).toEqual(nguoiDungMau);
    });
  });

  describe('laySoDuNgayPhepCaNhan - Lấy số dư ngày phép cá nhân', () => {
    it('nên trả về số ngày phép của người dùng hiện tại', async () => {
      // Arrange
      const soDuNgayPhep = {
        soNgayPhepNam: 12,
        soNgayDaSuDung: 2,
        soNgayConLai: 10,
        annualLeaveDays: 12,
        usedLeaveDays: 2,
        remainingLeaveDays: 10,
      };
      dichVuNguoiDung.laySoDuNgayPhep.mockResolvedValue(soDuNgayPhep);

      // Act
      const ketQua = await controller.laySoDuNgayPhepCaNhan(nguoiDungMau);

      // Assert
      expect(dichVuNguoiDung.laySoDuNgayPhep).toHaveBeenCalledWith(
        nguoiDungMau.id,
      );
      expect(ketQua.soNgayConLai).toBe(10);
    });
  });
});
