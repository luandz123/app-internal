import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { LeaveRequestController } from './leave-request.controller';
import { LeaveRequestService } from './leave-request.service';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveRequest, User])],
  controllers: [LeaveRequestController],
  providers: [LeaveRequestService],
  exports: [LeaveRequestService],
})
export class LeaveRequestModule {}
