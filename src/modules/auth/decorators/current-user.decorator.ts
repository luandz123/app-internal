import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../user/entities/user.entity';

/**
 * Decorator lấy thông tin người dùng hiện tại từ request
 * Sử dụng: @CurrentUser() nguoiDung: User
 */
export const CurrentUser = createParamDecorator(
  (_duLieu: unknown, nguCanhThucThi: ExecutionContext): User | undefined => {
    const yeuCau = nguCanhThucThi.switchToHttp().getRequest<{
      user?: User;
    }>();
    return yeuCau.user;
  },
);
