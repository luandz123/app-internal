import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../user/entities/user.entity';
import { ChamCongService } from '../cham-cong/cham-cong.service';
import {
  ChamCongVaoDto,
  ChamCongRaDto,
  TruyVanChamCongDto,
} from '../cham-cong/dto';
import { DanhSachIpGuard } from '../cham-cong/guards/danh-sach-ip.guard';

/**
 * Controller quản lý chấm công (phiên bản tiếng Anh endpoint)
 * Sử dụng lại ChamCongService từ module cham-cong
 */
@ApiTags('Attendance - Chấm công')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly dichVuChamCong: ChamCongService) {}

  /**
   * Chấm công vào - Check-in cho nhân viên
   */
  @Post('check-in')
  @UseGuards(DanhSachIpGuard)
  @ApiOperation({ summary: 'Chấm công vào cho nhân viên' })
  async chamCongVao(
    @CurrentUser() nguoiDung: User,
    @Body() duLieu: ChamCongVaoDto,
    @Ip() diaChiIp: string,
  ) {
    return await this.dichVuChamCong.checkIn(nguoiDung.id, duLieu, diaChiIp);
  }

  /**
   * Chấm công ra - Check-out cho nhân viên
   */
  @Post('check-out')
  @UseGuards(DanhSachIpGuard)
  @ApiOperation({ summary: 'Chấm công ra cho nhân viên' })
  async chamCongRa(
    @CurrentUser() nguoiDung: User,
    @Body() duLieu: ChamCongRaDto,
    @Ip() diaChiIp: string,
  ) {
    return await this.dichVuChamCong.checkOut(nguoiDung.id, duLieu, diaChiIp);
  }

  /**
   * Lấy thông tin chấm công của ngày hôm nay
   */
  @Get('today')
  @ApiOperation({ summary: 'Lấy thông tin chấm công hôm nay của bản thân' })
  async layChamCongHomNay(@CurrentUser() nguoiDung: User) {
    return await this.dichVuChamCong.getTodayAttendances(nguoiDung.id);
  }

  /**
   * Lấy lịch sử chấm công của bản thân
   */
  @Get('my')
  @ApiOperation({ summary: 'Lấy lịch sử chấm công của bản thân' })
  async layChamCongCuaToi(
    @CurrentUser() nguoiDung: User,
    @Query() truyVan: TruyVanChamCongDto,
  ) {
    return await this.dichVuChamCong.findAll(truyVan, nguoiDung.id, false);
  }

  /**
   * Lấy thống kê chấm công theo tháng của bản thân
   */
  @Get('stats/monthly')
  @ApiOperation({ summary: 'Lấy thống kê chấm công tháng của bản thân' })
  async layThongKeThang(
    @CurrentUser() nguoiDung: User,
    @Query('thang') thang: number,
    @Query('nam') nam: number,
  ) {
    const ngayHienTai = new Date();
    const thangMucTieu = thang || ngayHienTai.getMonth() + 1;
    const namMucTieu = nam || ngayHienTai.getFullYear();
    return await this.dichVuChamCong.getMonthlyStats(
      nguoiDung.id,
      thangMucTieu,
      namMucTieu,
    );
  }

  // ============ API dành cho Quản trị viên ============

  /**
   * Lấy danh sách tất cả bản ghi chấm công (chỉ Admin)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách chấm công (chỉ Admin)' })
  async layTatCa(@Query() truyVan: TruyVanChamCongDto) {
    return await this.dichVuChamCong.findAll(truyVan, undefined, true);
  }

  /**
   * Lấy báo cáo chấm công theo ngày (chỉ Admin)
   */
  @Get('daily-report')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Báo cáo chấm công theo ngày (chỉ Admin)' })
  async layBaoCaoTheoNgay(@Query('ngay') chuoiNgay?: string) {
    const ngay = chuoiNgay ? new Date(chuoiNgay) : new Date();
    // Đặt lại về thời điểm đầu ngày
    ngay.setHours(0, 0, 0, 0);
    return await this.dichVuChamCong.getDailyReport(ngay);
  }

  /**
   * Lấy thống kê chấm công của một nhân viên cụ thể (chỉ Admin)
   */
  @Get('user/:userId/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Lấy thống kê chấm công của nhân viên (chỉ Admin)',
  })
  @ApiParam({ name: 'userId', description: 'ID của nhân viên' })
  async layThongKeNhanVien(
    @Param('userId', ParseUUIDPipe) maNguoiDung: string,
    @Query('thang') thang: number,
    @Query('nam') nam: number,
  ) {
    const ngayHienTai = new Date();
    const thangMucTieu = thang || ngayHienTai.getMonth() + 1;
    const namMucTieu = nam || ngayHienTai.getFullYear();
    return await this.dichVuChamCong.getMonthlyStats(
      maNguoiDung,
      thangMucTieu,
      namMucTieu,
    );
  }

  /**
   * Lấy chi tiết một bản ghi chấm công (chỉ Admin)
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy chi tiết bản ghi chấm công (chỉ Admin)' })
  @ApiParam({ name: 'id', description: 'ID của bản ghi chấm công' })
  async layChiTiet(@Param('id', ParseUUIDPipe) id: string) {
    return await this.dichVuChamCong.findOne(id);
  }
}
