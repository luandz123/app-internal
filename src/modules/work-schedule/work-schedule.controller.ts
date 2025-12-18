import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../user/entities/user.entity';
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-work-schedule.dto';
import { DichVuLichLamViec } from './work-schedule.service';

@ApiTags('Lịch làm việc')
@ApiBearerAuth()
@Controller('work-schedules')
export class WorkScheduleController {
  constructor(private readonly dichVuLich: DichVuLichLamViec) {}

  @Post()
  @ApiOperation({ summary: 'Đăng ký lịch làm việc cho một kỳ' })
  create(@CurrentUser() user: User, @Body() dto: CreateWorkScheduleDto) {
    return this.dichVuLich.taoHangLoat(user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Lấy lịch làm việc của bản thân' })
  findMySchedules(@CurrentUser() user: User) {
    return this.dichVuLich.timTheoNguoiDung(user.id);
  }

  @Get('my/period/:periodId')
  @ApiOperation({ summary: 'Lấy lịch làm việc của bản thân theo kỳ' })
  findMySchedulesByPeriod(
    @CurrentUser() user: User,
    @Param('periodId', new ParseUUIDPipe()) periodId: string,
  ) {
    return this.dichVuLich.timTheoNguoiDungVaKy(user.id, periodId);
  }

  @Get('my/calendar')
  @ApiOperation({ summary: 'Lấy lịch làm việc của bản thân theo khoảng ngày' })
  @ApiQuery({ name: 'startDate', required: true, example: '2025-11-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2025-11-30' })
  findMyCalendar(
    @CurrentUser() user: User,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dichVuLich.timTheoKhoangThoiGian(
      user.id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('period/:periodId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy toàn bộ lịch làm việc theo kỳ (chỉ Admin)' })
  findByPeriod(@Param('periodId', new ParseUUIDPipe()) periodId: string) {
    return this.dichVuLich.timTheoKy(periodId);
  }

  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy lịch làm việc của một nhân viên (chỉ Admin)' })
  @ApiParam({ name: 'userId', description: 'ID của nhân viên' })
  findUserSchedules(@Param('userId', new ParseUUIDPipe()) userId: string) {
    return this.dichVuLich.timTheoNguoiDung(userId);
  }

  @Get('user/:userId/period/:periodId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Lấy lịch làm việc của một nhân viên theo kỳ (chỉ Admin)',
  })
  @ApiParam({ name: 'userId', description: 'ID của nhân viên' })
  @ApiParam({ name: 'periodId', description: 'ID của kỳ' })
  findUserSchedulesByPeriod(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Param('periodId', new ParseUUIDPipe()) periodId: string,
  ) {
    return this.dichVuLich.timTheoNguoiDungVaKy(userId, periodId);
  }

  @Get('user/:userId/calendar')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Lấy lịch làm việc của một nhân viên theo khoảng ngày (chỉ Admin)',
  })
  @ApiParam({ name: 'userId', description: 'ID của nhân viên' })
  @ApiQuery({ name: 'startDate', required: true, example: '2025-11-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2025-11-30' })
  findUserCalendar(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dichVuLich.timTheoKhoangThoiGian(
      userId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('period/:periodId/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Lấy trạng thái đăng ký lịch của một kỳ (chỉ Admin)',
  })
  getRegistrationStatus(
    @Param('periodId', new ParseUUIDPipe()) periodId: string,
  ) {
    return this.dichVuLich.layTrangThaiDangKy(periodId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết một lịch làm việc' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.dichVuLich.timMot(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật lịch làm việc' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateWorkScheduleDto,
  ) {
    return this.dichVuLich.capNhat(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa lịch làm việc' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.dichVuLich.xoa(id);
  }
}
