import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';
import { UserService } from './user.service';

/**
 * Controller quản lý người dùng
 * Bao gồm các chức năng CRUD và quản lý tài khoản
 */
@ApiTags('Người dùng')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserController {
  constructor(private readonly dichVuNguoiDung: UserService) {}

  /**
   * Tạo nhân viên mới (chỉ Admin)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo nhân viên mới (chỉ Admin)' })
  @ApiOkResponse({ description: 'Tạo hồ sơ nhân viên thành công' })
  taoMoi(@Body() duLieu: CreateUserDto) {
    return this.dichVuNguoiDung.taoNguoiDung(duLieu);
  }

  /**
   * Lấy danh sách tất cả nhân viên (chỉ Admin)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách nhân viên (chỉ Admin)' })
  @ApiOkResponse({ description: 'Danh sách nhân viên hiện có' })
  layTatCa() {
    return this.dichVuNguoiDung.layTatCa();
  }

  /**
   * Lấy danh sách nhân viên đang hoạt động (chỉ Admin)
   */
  @Get('active')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Lấy danh sách nhân viên đang hoạt động (chỉ Admin)',
  })
  layNguoiDungHoatDong() {
    return this.dichVuNguoiDung.layNguoiDungHoatDong();
  }

  /**
   * Xem hồ sơ của bản thân
   */
  @Get('me')
  @ApiOperation({ summary: 'Xem hồ sơ của bản thân' })
  layHoSoCaNhan(@CurrentUser() nguoiDung: User) {
    return this.dichVuNguoiDung.timTheoId(nguoiDung.id);
  }

  /**
   * Xem số ngày phép của bản thân
   */
  @Get('me/leave-balance')
  @ApiOperation({ summary: 'Xem số ngày phép của bản thân' })
  laySoDuNgayPhepCaNhan(@CurrentUser() nguoiDung: User) {
    return this.dichVuNguoiDung.laySoDuNgayPhep(nguoiDung.id);
  }

  /**
   * Xem thông tin nhân viên theo ID (chỉ Admin)
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xem thông tin nhân viên theo ID (chỉ Admin)' })
  timTheoId(@Param('id', new ParseUUIDPipe()) maNguoiDung: string) {
    return this.dichVuNguoiDung.timTheoId(maNguoiDung);
  }

  /**
   * Xem số ngày phép của nhân viên (chỉ Admin)
   */
  @Get(':id/leave-balance')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xem số ngày phép của nhân viên (chỉ Admin)' })
  laySoDuNgayPhepNhanVien(
    @Param('id', new ParseUUIDPipe()) maNguoiDung: string,
  ) {
    return this.dichVuNguoiDung.laySoDuNgayPhep(maNguoiDung);
  }

  /**
   * Cập nhật hồ sơ của bản thân
   */
  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật hồ sơ của bản thân' })
  capNhatHoSoCaNhan(
    @CurrentUser() nguoiDung: User,
    @Body() duLieu: UpdateProfileDto,
  ) {
    return this.dichVuNguoiDung.capNhatNguoiDung(nguoiDung.id, duLieu);
  }

  /**
   * Cập nhật thông tin nhân viên (chỉ Admin)
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật thông tin nhân viên (chỉ Admin)' })
  capNhatNhanVien(
    @Param('id', new ParseUUIDPipe()) maNguoiDung: string,
    @Body() duLieu: UpdateUserDto,
  ) {
    return this.dichVuNguoiDung.capNhatNguoiDung(maNguoiDung, duLieu);
  }

  /**
   * Đặt lại mật khẩu nhân viên (chỉ Admin)
   */
  @Post(':id/reset-password')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Đặt lại mật khẩu nhân viên (chỉ Admin)' })
  datLaiMatKhau(
    @Param('id', new ParseUUIDPipe()) maNguoiDung: string,
    @Body() duLieu: ResetPasswordDto,
  ) {
    return this.dichVuNguoiDung.datLaiMatKhau(maNguoiDung, duLieu.newPassword);
  }

  /**
   * Kích hoạt tài khoản nhân viên (chỉ Admin)
   */
  @Post(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Kích hoạt tài khoản nhân viên (chỉ Admin)' })
  kichHoat(@Param('id', new ParseUUIDPipe()) maNguoiDung: string) {
    return this.dichVuNguoiDung.kichHoat(maNguoiDung);
  }

  /**
   * Ngưng kích hoạt tài khoản nhân viên (chỉ Admin)
   */
  @Post(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Ngưng kích hoạt tài khoản nhân viên (chỉ Admin)' })
  voHieuHoa(@Param('id', new ParseUUIDPipe()) maNguoiDung: string) {
    return this.dichVuNguoiDung.voHieuHoa(maNguoiDung);
  }

  /**
   * Xóa nhân viên (chỉ Admin)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xóa nhân viên (chỉ Admin)' })
  xoaNhanVien(@Param('id', new ParseUUIDPipe()) maNguoiDung: string) {
    return this.dichVuNguoiDung.xoaNguoiDung(maNguoiDung);
  }
}
