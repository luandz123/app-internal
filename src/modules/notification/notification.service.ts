import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import {
  BroadcastNotificationDto,
  CreateNotificationDto,
} from './dto/create-notification.dto';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      type: dto.type ?? NotificationType.SYSTEM,
      title: dto.title,
      message: dto.message,
      relatedId: dto.relatedId,
      relatedType: dto.relatedType,
      link: dto.link,
    });
    return this.notificationRepository.save(notification);
  }

  async broadcast(dto: BroadcastNotificationDto): Promise<number> {
    let users: User[];

    if (dto.userIds && dto.userIds.length > 0) {
      users = await this.userRepository.find({
        where: { id: In(dto.userIds) },
      });
    } else {
      users = await this.userRepository.find();
    }

    const notifications = users.map((user) =>
      this.notificationRepository.create({
        userId: user.id,
        type: dto.type ?? NotificationType.SYSTEM,
        title: dto.title,
        message: dto.message,
        link: dto.link,
      }),
    );

    await this.notificationRepository.save(notifications);
    return notifications.length;
  }

  async findByUser(
    userId: string,
    unreadOnly = false,
  ): Promise<Notification[]> {
    const where: Record<string, unknown> = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }
    return notification;
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }
    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return result.affected ?? 0;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async remove(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }
    return this.notificationRepository.remove(notification);
  }

  async removeAll(userId: string): Promise<number> {
    const result = await this.notificationRepository.delete({ userId });
    return result.affected ?? 0;
  }

  // Gửi thông báo khi đơn nghỉ phép được duyệt hoặc từ chối
  async notifyLeaveRequestStatus(
    userId: string,
    leaveRequestId: string,
    status: 'approved' | 'rejected',
    message: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.LEAVE_REQUEST,
      title: status === 'approved' ? 'Đơn đã được duyệt' : 'Đơn bị từ chối',
      message,
      relatedId: leaveRequestId,
      relatedType: 'leave_request',
      link: `/leave-requests/${leaveRequestId}`,
    });
  }

  // Gửi thông báo khi có bảng lương mới
  async notifySalary(
    userId: string,
    salaryId: string,
    year: number,
    month: number,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.SALARY,
      title: 'Bảng lương mới',
      message: `Bảng lương tháng ${month}/${year} đã sẵn sàng.`,
      relatedId: salaryId,
      relatedType: 'salary',
      link: `/salaries/${salaryId}`,
    });
  }

  // Gửi thông báo nhắc đăng ký lịch làm việc
  async notifyScheduleReminder(
    userId: string,
    periodId: string,
    periodName: string,
    deadline: Date,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.REMINDER,
      title: 'Nhắc đăng ký lịch làm',
      message: `Hạn đăng ký lịch "${periodName}" là ${deadline.toLocaleDateString('vi-VN')}. Vui lòng đăng ký sớm.`,
      relatedId: periodId,
      relatedType: 'registration_period',
      link: `/work-schedules/register/${periodId}`,
    });
  }
}
