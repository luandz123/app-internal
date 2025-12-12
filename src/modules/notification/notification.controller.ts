import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
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
  BroadcastNotificationDto,
  CreateNotificationDto,
} from './dto/create-notification.dto';
import { NotificationService } from './notification.service';

@ApiTags('Thông báo')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo thông báo cho người dùng (chỉ Admin)' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Gửi thông báo hàng loạt đến nhiều người dùng (chỉ Admin)',
  })
  broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.notificationService.broadcast(dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Lấy thông báo của bản thân' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  findMyNotifications(
    @CurrentUser() user: User,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationService.findByUser(user.id, unreadOnly === 'true');
  }

  @Get('my/unread-count')
  @ApiOperation({ summary: 'Đếm số thông báo chưa đọc của bản thân' })
  getUnreadCount(@CurrentUser() user: User) {
    return this.notificationService.getUnreadCount(user.id);
  }

  @Post('my/mark-all-read')
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo của tôi là đã đọc' })
  markAllAsRead(@CurrentUser() user: User) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Đánh dấu một thông báo là đã đọc' })
  markAsRead(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.notificationService.markAsRead(id, user.id);
  }

  @Delete('my/all')
  @ApiOperation({ summary: 'Xóa toàn bộ thông báo của bản thân' })
  removeAll(@CurrentUser() user: User) {
    return this.notificationService.removeAll(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một thông báo' })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.notificationService.remove(id, user.id);
  }
}
