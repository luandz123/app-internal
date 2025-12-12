import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
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
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { SalaryService } from './salary.service';

@ApiTags('Bảng lương')
@ApiBearerAuth()
@Controller('salaries')
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo bảng lương mới (chỉ Admin)' })
  create(@Body() dto: CreateSalaryDto) {
    return this.salaryService.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách bảng lương (chỉ Admin)' })
  @ApiQuery({ name: 'year', required: false, example: 2025 })
  @ApiQuery({ name: 'month', required: false, example: 11 })
  findAll(@Query('year') year?: string, @Query('month') month?: string) {
    return this.salaryService.findAll(
      year ? parseInt(year, 10) : undefined,
      month ? parseInt(month, 10) : undefined,
    );
  }

  @Get('my')
  @ApiOperation({ summary: 'Lấy bảng lương của bản thân' })
  findMySalaries(@CurrentUser() user: User) {
    return this.salaryService.findByUser(user.id);
  }

  @Get('my/:year/:month')
  @ApiOperation({ summary: 'Lấy bảng lương của bản thân theo tháng' })
  findMySalaryByPeriod(
    @CurrentUser() user: User,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.salaryService.findByUserAndPeriod(user.id, year, month);
  }

  @Get('export/:year/:month')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xuất bảng lương ra Excel (chỉ Admin)' })
  async exportToExcel(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Res() res: Response,
  ) {
    const buffer = await this.salaryService.exportToExcel(year, month);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="salary_${year}_${month}.xlsx"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết bảng lương' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.salaryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật bảng lương (chỉ Admin)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSalaryDto,
  ) {
    return this.salaryService.update(id, dto);
  }

  @Post(':id/finalize')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Chốt bảng lương (chỉ Admin)' })
  finalize(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.salaryService.finalize(id);
  }

  @Post(':id/mark-paid')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Đánh dấu đã chi trả (chỉ Admin)' })
  markAsPaid(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.salaryService.markAsPaid(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xóa bảng lương (chỉ Admin)' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.salaryService.remove(id);
  }
}
