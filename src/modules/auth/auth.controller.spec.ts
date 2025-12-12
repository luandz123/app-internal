import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserRole, UserStatus } from '../user/entities/user.entity';

describe('AuthController - Controller Xác thực', () => {
  let controller: AuthController;
  let dichVuXacThuc: jest.Mocked<AuthService>;

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
    usedLeaveDays: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const ketQuaXacThuc = {
    accessToken: 'jwt-token-test',
    user: nguoiDungMau,
  };

  beforeEach(async () => {
    const mockAuthService = {
      dangKy: jest.fn(),
      dangNhap: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    dichVuXacThuc = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('dangKy - Đăng ký tài khoản', () => {
    it('nên gọi service đăng ký và trả về kết quả', async () => {
      // Arrange
      const duLieuDangKy = {
        firstName: 'Nguyễn',
        lastName: 'Văn A',
        email: 'nguyenvana@example.com',
        password: 'matkhau123',
      };
      dichVuXacThuc.dangKy.mockResolvedValue(ketQuaXacThuc);

      // Act
      const ketQua = await controller.dangKy(duLieuDangKy);

      // Assert
      expect(dichVuXacThuc.dangKy).toHaveBeenCalledWith(duLieuDangKy);
      expect(ketQua).toEqual(ketQuaXacThuc);
    });
  });

  describe('dangNhap - Đăng nhập', () => {
    it('nên gọi service đăng nhập và trả về kết quả', async () => {
      // Arrange
      const duLieuDangNhap = {
        email: 'nguyenvana@example.com',
        password: 'matkhau123',
      };
      dichVuXacThuc.dangNhap.mockResolvedValue(ketQuaXacThuc);

      // Act
      const ketQua = await controller.dangNhap(duLieuDangNhap);

      // Assert
      expect(dichVuXacThuc.dangNhap).toHaveBeenCalledWith(duLieuDangNhap);
      expect(ketQua).toEqual(ketQuaXacThuc);
    });
  });

  describe('thongTinCaNhan - Lấy thông tin cá nhân', () => {
    it('nên trả về thông tin người dùng hiện tại', () => {
      // Act
      const ketQua = controller.thongTinCaNhan(nguoiDungMau);

      // Assert
      expect(ketQua).toEqual(nguoiDungMau);
    });
  });
});
