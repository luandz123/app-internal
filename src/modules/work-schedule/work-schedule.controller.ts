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
