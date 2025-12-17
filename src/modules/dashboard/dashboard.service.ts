import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { User, UserStatus } from '../user/entities/user.entity';
import {
  LeaveRequest,
  LeaveRequestStatus,
  LeaveRequestType,
} from '../leave-request/entities/leave-request.entity';
import { Salary } from '../salary/entities/salary.entity';
import { WorkSchedule } from '../work-schedule/entities/work-schedule.entity';
import { LoaiHinhLamViec } from '../work-schedule/constants/work-schedule.constants';

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingRequests: number;
  approvedRequestsThisMonth: number;
  rejectedRequestsThisMonth: number;
  lateArrivalsThisMonth: number;
  overtimeHoursThisMonth: number;
  totalSalaryThisMonth: number;
}

export interface MonthlyStats {
  month: number;
  year: number;
  lateArrivals: number;
  overtimeRequests: number;
  leaveRequests: number;
  remoteRequests: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepository: Repository<LeaveRequest>,
    @InjectRepository(Salary)
    private readonly salaryRepository: Repository<Salary>,
    @InjectRepository(WorkSchedule)
    private readonly workScheduleRepository: Repository<WorkSchedule>,
  ) {}

  async getAdminDashboard(): Promise<DashboardStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalEmployees,
      activeEmployees,
      pendingRequests,
      approvedRequestsThisMonth,
      rejectedRequestsThisMonth,
      lateArrivalsThisMonth,
      overtimeRequests,
      salariesThisMonth,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { status: UserStatus.ACTIVE } }),
      this.leaveRequestRepository.count({
        where: { status: LeaveRequestStatus.PENDING },
      }),
      this.leaveRequestRepository.count({
        where: {
          status: LeaveRequestStatus.APPROVED,
          createdAt: Between(startOfMonth, endOfMonth),
        },
      }),
      this.leaveRequestRepository.count({
        where: {
          status: LeaveRequestStatus.REJECTED,
          createdAt: Between(startOfMonth, endOfMonth),
        },
      }),
      this.leaveRequestRepository.count({
        where: {
          type: LeaveRequestType.LATE_ARRIVAL,
          createdAt: Between(startOfMonth, endOfMonth),
        },
      }),
      this.leaveRequestRepository.find({
        where: {
          type: LeaveRequestType.OVERTIME,
          status: LeaveRequestStatus.APPROVED,
          createdAt: Between(startOfMonth, endOfMonth),
        },
      }),
      this.salaryRepository.find({
        where: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        },
      }),
    ]);

    const overtimeHoursThisMonth = overtimeRequests.reduce(
      (sum, req) => sum + Number(req.totalDays) * 8,
      0,
    );

    const totalSalaryThisMonth = salariesThisMonth.reduce(
      (sum, salary) => sum + Number(salary.netSalary),
      0,
    );

    return {
      totalEmployees,
      activeEmployees,
      pendingRequests,
      approvedRequestsThisMonth,
      rejectedRequestsThisMonth,
      lateArrivalsThisMonth,
      overtimeHoursThisMonth,
      totalSalaryThisMonth,
    };
  }

  async getMonthlyStats(year: number): Promise<MonthlyStats[]> {
    const stats: MonthlyStats[] = [];

    for (let month = 1; month <= 12; month++) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);

      const [lateArrivals, overtimeRequests, leaveRequests, remoteRequests] =
        await Promise.all([
          this.leaveRequestRepository.count({
            where: {
              type: LeaveRequestType.LATE_ARRIVAL,
              createdAt: Between(startOfMonth, endOfMonth),
            },
          }),
          this.leaveRequestRepository.count({
            where: {
              type: LeaveRequestType.OVERTIME,
              createdAt: Between(startOfMonth, endOfMonth),
            },
          }),
          this.leaveRequestRepository.count({
            where: {
              type: LeaveRequestType.ANNUAL_LEAVE,
              createdAt: Between(startOfMonth, endOfMonth),
            },
          }),
          this.leaveRequestRepository.count({
            where: {
              type: LeaveRequestType.REMOTE_WORK,
              createdAt: Between(startOfMonth, endOfMonth),
            },
          }),
        ]);

      stats.push({
        month,
        year,
        lateArrivals,
        overtimeRequests,
        leaveRequests,
        remoteRequests,
      });
    }

    return stats;
  }

  async getUserStats(userId: string, year: number, month?: number) {
    let startDate: Date;
    let endDate: Date;

    if (month) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    const requests = await this.leaveRequestRepository.find({
      where: {
        userId,
        startDate: Between(startDate, endDate),
      },
    });

    const workSchedules = await this.workScheduleRepository.find({
      where: {
        userId,
        date: Between(startDate, endDate),
      },
    });

    const stats = {
      workDays: workSchedules.filter((s) => s.workType === LoaiHinhLamViec.WFO)
        .length,
      remoteDays: workSchedules.filter(
        (s) => s.workType === LoaiHinhLamViec.REMOTE,
      ).length,
      offDays: workSchedules.filter((s) => s.workType === LoaiHinhLamViec.OFF)
        .length,
      lateArrivals: 0,
      earlyDepartures: 0,
      leaveDays: 0,
      overtimeDays: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
    };

    for (const request of requests) {
      if (request.status === LeaveRequestStatus.PENDING) {
        stats.pendingRequests++;
      } else if (request.status === LeaveRequestStatus.APPROVED) {
        stats.approvedRequests++;

        switch (request.type) {
          case LeaveRequestType.LATE_ARRIVAL:
            stats.lateArrivals++;
            break;
          case LeaveRequestType.EARLY_DEPARTURE:
            stats.earlyDepartures++;
            break;
          case LeaveRequestType.ANNUAL_LEAVE:
          case LeaveRequestType.SICK_LEAVE:
          case LeaveRequestType.UNPAID_LEAVE:
            stats.leaveDays += Number(request.totalDays);
            break;
          case LeaveRequestType.OVERTIME:
            stats.overtimeDays += Number(request.totalDays);
            break;
        }
      } else if (request.status === LeaveRequestStatus.REJECTED) {
        stats.rejectedRequests++;
      }
    }

    return stats;
  }

  async getRequestHistory(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    data: LeaveRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [data, total] = await this.leaveRequestRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['approvedBy'],
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
