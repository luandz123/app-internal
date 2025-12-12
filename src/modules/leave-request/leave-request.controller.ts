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
import {
  ApproveLeaveRequestDto,
  RejectLeaveRequestDto,
} from './dto/approve-leave-request.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { QueryLeaveRequestDto } from './dto/query-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { LeaveRequestService } from './leave-request.service';

@ApiTags('Đơn nghỉ phép')
@ApiBearerAuth()
@Controller('leave-requests')
export class LeaveRequestController {
  constructor(private readonly requestService: LeaveRequestService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo đơn nghỉ phép mới' })
  create(@CurrentUser() user: User, @Body() dto: CreateLeaveRequestDto) {
    return this.requestService.create(user.id, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách đơn nghỉ phép (chỉ Admin)' })
  findAll(@Query() query: QueryLeaveRequestDto) {
    return this.requestService.findAll(query);
  }

  @Get('my')
  @ApiOperation({ summary: 'Lấy các đơn nghỉ phép của bản thân' })
  findMyRequests(@CurrentUser() user: User) {
    return this.requestService.findByUser(user.id);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy các đơn nghỉ phép chờ duyệt (chỉ Admin)' })
  findPending() {
    return this.requestService.findPending();
  }

  @Get('my/stats')
  @ApiOperation({ summary: 'Thống kê đơn nghỉ phép của bản thân' })
  @ApiQuery({ name: 'year', required: true, example: 2025 })
  @ApiQuery({ name: 'month', required: false, example: 11 })
  getMyStats(
    @CurrentUser() user: User,
    @Query('year', ParseIntPipe) year: number,
    @Query('month') month?: string,
  ) {
    return this.requestService.getStatsByUser(
      user.id,
      year,
      month ? parseInt(month, 10) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết đơn nghỉ phép' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.requestService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật đơn nghỉ phép' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateLeaveRequestDto,
  ) {
    return this.requestService.update(id, user.id, dto);
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Phê duyệt đơn nghỉ phép (chỉ Admin)' })
  approve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() admin: User,
    @Body() dto: ApproveLeaveRequestDto,
  ) {
    return this.requestService.approve(id, admin.id, dto);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Từ chối đơn nghỉ phép (chỉ Admin)' })
  reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() admin: User,
    @Body() dto: RejectLeaveRequestDto,
  ) {
    return this.requestService.reject(id, admin.id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Hủy đơn nghỉ phép' })
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.requestService.cancel(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa đơn nghỉ phép' })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.requestService.remove(id, user);
  }
}
