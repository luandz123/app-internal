import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { User, UserRole, UserStatus } from '../user/entities/user.entity';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService - Dịch vụ Xác thực', () => {
  let dichVuXacThuc: AuthService;
  let dichVuNguoiDung: jest.Mocked<UserService>;
  let dichVuJwt: jest.Mocked<JwtService>;

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
    usedLeaveDays: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Tạo mock cho các dependency
    const mockUserService = {
      taoNguoiDung: jest.fn(),
      timTheoEmail: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue(3600),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    dichVuXacThuc = module.get<AuthService>(AuthService);
    dichVuNguoiDung = module.get(UserService);
    dichVuJwt = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('dangKy - Đăng ký tài khoản', () => {
    it('nên tạo tài khoản mới và trả về token', async () => {
      // Arrange - Chuẩn bị dữ liệu
      const duLieuDangKy = {
        firstName: 'Nguyễn',
        lastName: 'Văn A',
        email: 'nguyenvana@example.com',
        password: 'matkhau123',
      };

      dichVuNguoiDung.taoNguoiDung.mockResolvedValue(nguoiDungMau);
      dichVuJwt.signAsync.mockResolvedValue('jwt-token-test');

      // Act - Thực hiện
      const ketQua = await dichVuXacThuc.dangKy(duLieuDangKy);

      // Assert - Kiểm tra kết quả
      expect(dichVuNguoiDung.taoNguoiDung).toHaveBeenCalledWith({
        ...duLieuDangKy,
        role: UserRole.STAFF,
      });
      expect(ketQua.accessToken).toBe('jwt-token-test');
      expect(ketQua.user).toEqual(nguoiDungMau);
    });

    it('nên gọi alias signup đúng cách', async () => {
      // Arrange
      const duLieuDangKy = {
        firstName: 'Trần',
        lastName: 'Thị B',
        email: 'tranthib@example.com',
        password: 'matkhau456',
      };

      dichVuNguoiDung.taoNguoiDung.mockResolvedValue(nguoiDungMau);
      dichVuJwt.signAsync.mockResolvedValue('jwt-token-test');

      // Act
      const ketQua = await dichVuXacThuc.signup(duLieuDangKy);

      // Assert
      expect(ketQua.accessToken).toBeDefined();
    });
  });

  describe('dangNhap - Đăng nhập', () => {
    it('nên đăng nhập thành công với thông tin hợp lệ', async () => {
      // Arrange
      const duLieuDangNhap = {
        email: 'nguyenvana@example.com',
        password: 'matkhau123',
      };

      dichVuNguoiDung.timTheoEmail.mockResolvedValue(nguoiDungMau);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      dichVuJwt.signAsync.mockResolvedValue('jwt-token-test');

      // Act
      const ketQua = await dichVuXacThuc.dangNhap(duLieuDangNhap);

      // Assert
      expect(dichVuNguoiDung.timTheoEmail).toHaveBeenCalledWith(
        duLieuDangNhap.email,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        duLieuDangNhap.password,
        nguoiDungMau.passwordHash,
      );
      expect(ketQua.accessToken).toBe('jwt-token-test');
      expect(ketQua.user).toEqual(nguoiDungMau);
    });

    it('nên ném lỗi khi email không tồn tại', async () => {
      // Arrange
      const duLieuDangNhap = {
        email: 'khongtontai@example.com',
        password: 'matkhau123',
      };

      dichVuNguoiDung.timTheoEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(dichVuXacThuc.dangNhap(duLieuDangNhap)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(dichVuXacThuc.dangNhap(duLieuDangNhap)).rejects.toThrow(
        'Thông tin đăng nhập không hợp lệ',
      );
    });

    it('nên ném lỗi khi mật khẩu sai', async () => {
      // Arrange
      const duLieuDangNhap = {
        email: 'nguyenvana@example.com',
        password: 'matkhausai',
      };

      dichVuNguoiDung.timTheoEmail.mockResolvedValue(nguoiDungMau);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(dichVuXacThuc.dangNhap(duLieuDangNhap)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('nên gọi alias signin đúng cách', async () => {
      // Arrange
      const duLieuDangNhap = {
        email: 'nguyenvana@example.com',
        password: 'matkhau123',
      };

      dichVuNguoiDung.timTheoEmail.mockResolvedValue(nguoiDungMau);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      dichVuJwt.signAsync.mockResolvedValue('jwt-token-test');

      // Act
      const ketQua = await dichVuXacThuc.signin(duLieuDangNhap);

      // Assert
      expect(ketQua.accessToken).toBeDefined();
    });
  });

  describe('taoKetQuaXacThuc - Tạo kết quả xác thực', () => {
    it('nên tạo JWT token với payload đúng', async () => {
      // Arrange
      dichVuNguoiDung.taoNguoiDung.mockResolvedValue(nguoiDungMau);
      dichVuJwt.signAsync.mockResolvedValue('jwt-token-test');

      // Act
      await dichVuXacThuc.dangKy({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
      });

      // Assert
      expect(dichVuJwt.signAsync).toHaveBeenCalledWith(
        {
          sub: nguoiDungMau.id,
          email: nguoiDungMau.email,
          role: nguoiDungMau.role,
        },
        { expiresIn: '3600s' },
      );
    });
  });
});
