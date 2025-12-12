import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { LeaveRequest } from '../leave-request/entities/leave-request.entity';
import { Salary } from '../salary/entities/salary.entity';
import { WorkSchedule } from '../work-schedule/entities/work-schedule.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, LeaveRequest, Salary, WorkSchedule]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
