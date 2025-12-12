import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole, UserStatus } from '../../modules/user/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard - Guard Kiểm tra Vai trò', () => {
  let rolesGuard: RolesGuard;
  let boLocPhanChieu: jest.Mocked<Reflector>;

  // Dữ liệu mẫu người dùng
  const nguoiDungAdmin = {
    id: 'uuid-admin',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  };

  const nguoiDungNhanVien = {
    id: 'uuid-staff',
    firstName: 'Staff',
    lastName: 'User',
    email: 'staff@example.com',
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
  };

  beforeEach(() => {
    boLocPhanChieu = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    rolesGuard = new RolesGuard(boLocPhanChieu);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Tạo mock ExecutionContext
   */
  const taoMockContext = (nguoiDung?: unknown): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user: nguoiDung }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  describe('canActivate - Kiểm tra quyền truy cập', () => {
    it('nên cho phép truy cập khi không yêu cầu vai trò nào', () => {
      // Arrange
      boLocPhanChieu.getAllAndOverride.mockReturnValue(undefined);
      const context = taoMockContext(nguoiDungNhanVien);

      // Act
      const ketQua = rolesGuard.canActivate(context);

      // Assert
      expect(ketQua).toBe(true);
    });

    it('nên cho phép truy cập khi người dùng có vai trò phù hợp', () => {
      // Arrange
      boLocPhanChieu.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = taoMockContext(nguoiDungAdmin);

      // Act
      const ketQua = rolesGuard.canActivate(context);

      // Assert
      expect(ketQua).toBe(true);
    });

    it('nên cho phép truy cập khi người dùng có một trong các vai trò yêu cầu', () => {
      // Arrange
      boLocPhanChieu.getAllAndOverride.mockReturnValue([
        UserRole.ADMIN,
        UserRole.STAFF,
      ]);
      const context = taoMockContext(nguoiDungNhanVien);

      // Act
      const ketQua = rolesGuard.canActivate(context);

      // Assert
      expect(ketQua).toBe(true);
    });

    it('nên ném lỗi ForbiddenException khi người dùng chưa đăng nhập', () => {
      // Arrange
      boLocPhanChieu.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = taoMockContext(undefined);

      // Act & Assert
      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => rolesGuard.canActivate(context)).toThrow(
        'Người dùng chưa đăng nhập',
      );
    });

    it('nên ném lỗi ForbiddenException khi người dùng không có vai trò phù hợp', () => {
      // Arrange
      boLocPhanChieu.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = taoMockContext(nguoiDungNhanVien);

      // Act & Assert
      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => rolesGuard.canActivate(context)).toThrow(
        'Không đủ quyền truy cập',
      );
    });

    it('nên lấy metadata vai trò từ handler và class', () => {
      // Arrange
      boLocPhanChieu.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = taoMockContext(nguoiDungAdmin);

      // Act
      rolesGuard.canActivate(context);

      // Assert
      expect(boLocPhanChieu.getAllAndOverride).toHaveBeenCalledWith(
        ROLES_KEY,
        expect.any(Array),
      );
    });
  });
});
