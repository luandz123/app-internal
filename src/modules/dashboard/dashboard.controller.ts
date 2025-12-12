import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { DashboardService } from './dashboard.service';

@ApiTags('Bảng điều khiển')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy số liệu tổng quan cho Admin (chỉ Admin)' })
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('admin/monthly/:year')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy thống kê từng tháng theo năm (chỉ Admin)' })
  getMonthlyStats(@Param('year', ParseIntPipe) year: number) {
    return this.dashboardService.getMonthlyStats(year);
  }

  @Get('my/stats')
  @ApiOperation({ summary: 'Lấy thống kê công việc của bản thân' })
  @ApiQuery({ name: 'year', required: true, example: 2025 })
  @ApiQuery({ name: 'month', required: false, example: 11 })
  getMyStats(
    @CurrentUser() user: User,
    @Query('year', ParseIntPipe) year: number,
    @Query('month') month?: string,
  ) {
    return this.dashboardService.getUserStats(
      user.id,
      year,
      month ? parseInt(month, 10) : undefined,
    );
  }

  @Get('my/history')
  @ApiOperation({ summary: 'Lấy lịch sử yêu cầu của bản thân' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getMyHistory(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getRequestHistory(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }
}
