import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationPeriodModule } from '../registration-period/registration-period.module';
import { WorkSchedule } from './entities/work-schedule.entity';
import { WorkScheduleController } from './work-schedule.controller';
import { DichVuLichLamViec } from './work-schedule.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkSchedule]), RegistrationPeriodModule],
  controllers: [WorkScheduleController],
  providers: [DichVuLichLamViec],
  exports: [DichVuLichLamViec],
})
export class WorkScheduleModule {}
