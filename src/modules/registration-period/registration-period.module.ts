import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationPeriod } from './entities/registration-period.entity';
import { RegistrationPeriodController } from './registration-period.controller';
import { RegistrationPeriodService } from './registration-period.service';

@Module({
  imports: [TypeOrmModule.forFeature([RegistrationPeriod])],
  controllers: [RegistrationPeriodController],
  providers: [RegistrationPeriodService],
  exports: [RegistrationPeriodService],
})
export class RegistrationPeriodModule {}
