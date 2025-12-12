import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { User, UserRole } from '../user/entities/user.entity';
import {
  ApproveLeaveRequestDto,
  RejectLeaveRequestDto,
} from './dto/approve-leave-request.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { QueryLeaveRequestDto } from './dto/query-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import {
  LeaveRequest,
  LeaveRequestStatus,
  LeaveRequestType,
} from './entities/leave-request.entity';

@Injectable()
export class LeaveRequestService {
  constructor(
    @InjectRepository(LeaveRequest)
    private readonly requestRepository: Repository<LeaveRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    userId: string,
    dto: CreateLeaveRequestDto,
  ): Promise<LeaveRequest> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException(
        'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc',
      );
    }

    // Tính tổng số ngày nếu client không gửi lên
    let totalDays = dto.totalDays;
    if (!totalDays) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const request = this.requestRepository.create({
      userId,
      type: dto.type,
      startDate,
      endDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      totalDays,
      reason: dto.reason,
      attachments: dto.attachments,
    });

    return this.requestRepository.save(request);
  }

  async findAll(query: QueryLeaveRequestDto): Promise<LeaveRequest[]> {
    const where: FindOptionsWhere<LeaveRequest> = {};

    if (query.userId) where.userId = query.userId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    if (query.startDate && query.endDate) {
      where.startDate = Between(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    }

    return this.requestRepository.find({
      where,
      relations: ['user', 'approvedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string): Promise<LeaveRequest[]> {
    return this.requestRepository.find({
      where: { userId },
      relations: ['approvedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPending(): Promise<LeaveRequest[]> {
    return this.requestRepository.find({
      where: { status: LeaveRequestStatus.PENDING },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<LeaveRequest> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['user', 'approvedBy'],
    });
    if (!request) {
      throw new NotFoundException('Không tìm thấy đơn nghỉ phép');
    }
    return request;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateLeaveRequestDto,
  ): Promise<LeaveRequest> {
    const request = await this.findOne(id);

    // Chỉ cho phép cập nhật khi đơn đang chờ duyệt và thuộc về người dùng
    if (request.userId !== userId) {
      throw new ForbiddenException('Bạn chỉ được phép chỉnh sửa đơn của mình');
    }

    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể chỉnh sửa đơn đang chờ duyệt');
    }

    if (dto.type) request.type = dto.type;
    if (dto.startDate) request.startDate = new Date(dto.startDate);
    if (dto.endDate) request.endDate = new Date(dto.endDate);
    if (dto.startTime !== undefined) request.startTime = dto.startTime;
    if (dto.endTime !== undefined) request.endTime = dto.endTime;
    if (dto.totalDays) request.totalDays = dto.totalDays;
    if (dto.reason) request.reason = dto.reason;
    if (dto.attachments !== undefined) request.attachments = dto.attachments;

    return this.requestRepository.save(request);
  }

  async approve(
    id: string,
    adminId: string,
    dto: ApproveLeaveRequestDto,
  ): Promise<LeaveRequest> {
    const request = await this.findOne(id);

    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể phê duyệt đơn đang chờ duyệt');
    }

    request.status = LeaveRequestStatus.APPROVED;
    request.approvedById = adminId;
    request.approvedAt = new Date();
    if (dto.adminNote) request.adminNote = dto.adminNote;

    // Cập nhật số ngày phép đã dùng của nhân viên đối với loại phép năm
    if (request.type === LeaveRequestType.ANNUAL_LEAVE) {
      const user = await this.userRepository.findOne({
        where: { id: request.userId },
      });
      if (user) {
        user.usedLeaveDays =
          Number(user.usedLeaveDays) + Number(request.totalDays);
        await this.userRepository.save(user);
      }
    }

    return this.requestRepository.save(request);
  }

  async reject(
    id: string,
    adminId: string,
    dto: RejectLeaveRequestDto,
  ): Promise<LeaveRequest> {
    const request = await this.findOne(id);

    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể từ chối đơn đang chờ duyệt');
    }

    request.status = LeaveRequestStatus.REJECTED;
    request.approvedById = adminId;
    request.approvedAt = new Date();
    request.rejectionReason = dto.rejectionReason;
    if (dto.adminNote) request.adminNote = dto.adminNote;

    return this.requestRepository.save(request);
  }

  async cancel(id: string, userId: string): Promise<LeaveRequest> {
    const request = await this.findOne(id);

    if (request.userId !== userId) {
      throw new ForbiddenException('Bạn chỉ được phép hủy đơn của mình');
    }

    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể hủy đơn đang chờ duyệt');
    }

    request.status = LeaveRequestStatus.CANCELLED;
    return this.requestRepository.save(request);
  }

  async remove(id: string, user: User): Promise<LeaveRequest> {
    const request = await this.findOne(id);

    // Admin có thể xóa mọi đơn, người dùng chỉ được xóa đơn của mình khi đang chờ duyệt
    if (user.role !== UserRole.ADMIN) {
      if (request.userId !== user.id) {
        throw new ForbiddenException('Bạn chỉ được phép xóa đơn của mình');
      }
      if (request.status !== LeaveRequestStatus.PENDING) {
        throw new BadRequestException('Chỉ có thể xóa đơn đang chờ duyệt');
      }
    }

    return this.requestRepository.remove(request);
  }

  async getStatsByUser(
    userId: string,
    year: number,
    month?: number,
  ): Promise<{
    totalLeaveDays: number;
    approvedRequests: number;
    pendingRequests: number;
    rejectedRequests: number;
    byType: Record<LeaveRequestType, number>;
  }> {
    let startDate: Date;
    let endDate: Date;

    if (month) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    const requests = await this.requestRepository.find({
      where: {
        userId,
        startDate: Between(startDate, endDate),
      },
    });

    const stats = {
      totalLeaveDays: 0,
      approvedRequests: 0,
      pendingRequests: 0,
      rejectedRequests: 0,
      byType: {} as Record<LeaveRequestType, number>,
    };

    for (const type of Object.values(LeaveRequestType)) {
      stats.byType[type] = 0;
    }

    for (const request of requests) {
      if (request.status === LeaveRequestStatus.APPROVED) {
        stats.approvedRequests++;
        stats.totalLeaveDays += Number(request.totalDays);
        stats.byType[request.type] += Number(request.totalDays);
      } else if (request.status === LeaveRequestStatus.PENDING) {
        stats.pendingRequests++;
      } else if (request.status === LeaveRequestStatus.REJECTED) {
        stats.rejectedRequests++;
      }
    }

    return stats;
  }
}
