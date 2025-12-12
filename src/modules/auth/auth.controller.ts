import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.entity';

/**
 * Controller xử lý xác thực người dùng
 * Bao gồm đăng ký, đăng nhập và lấy thông tin người dùng hiện tại
 */
@ApiTags('Xác thực')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly dichVuXacThuc: AuthService) {}

  /**
   * Đăng ký tài khoản mới
   */
  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Đăng ký tài khoản nhân viên' })
  dangKy(@Body() duLieu: SignupDto) {
    return this.dichVuXacThuc.dangKy(duLieu);
  }

  /**
   * Đăng nhập hệ thống
   */
  @Public()
  @Post('signin')
  @ApiOperation({ summary: 'Đăng nhập hệ thống' })
  dangNhap(@Body() duLieu: SigninDto) {
    return this.dichVuXacThuc.dangNhap(duLieu);
  }

  /**
   * Lấy thông tin người dùng hiện tại
   */
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiOkResponse({ description: 'Thông tin người dùng đang đăng nhập' })
  @Get('me')
  thongTinCaNhan(@CurrentUser() nguoiDung: User) {
    return nguoiDung;
  }
}
