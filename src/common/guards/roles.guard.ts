import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, User } from '../../modules/user/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard kiểm tra vai trò người dùng
 * Sử dụng để bảo vệ các route chỉ cho phép người dùng có vai trò nhất định
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private boLocPhanChieu: Reflector) {}

  /**
   * Kiểm tra người dùng có quyền truy cập hay không
   * @param nguCanhThucThi - Ngữ cảnh thực thi
   */
  canActivate(nguCanhThucThi: ExecutionContext): boolean {
    const cacVaiTroCanThiet = this.boLocPhanChieu.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [nguCanhThucThi.getHandler(), nguCanhThucThi.getClass()],
    );

    // Nếu không yêu cầu vai trò nào, cho phép truy cập
    if (!cacVaiTroCanThiet) {
      return true;
    }

    const yeuCau = nguCanhThucThi.switchToHttp().getRequest<{
      user?: User;
    }>();
    const nguoiDung = yeuCau.user;

    if (!nguoiDung) {
      throw new ForbiddenException('Người dùng chưa đăng nhập');
    }

    const coVaiTro = cacVaiTroCanThiet.some(
      (vaiTro) => nguoiDung.role === vaiTro,
    );

    if (!coVaiTro) {
      throw new ForbiddenException('Không đủ quyền truy cập');
    }

    return true;
  }
}
