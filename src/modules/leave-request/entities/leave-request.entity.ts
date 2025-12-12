import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum LeaveRequestType {
  ANNUAL_LEAVE = 'annual_leave', // Nghỉ phép năm
  SICK_LEAVE = 'sick_leave', // Nghỉ ốm
  LATE_ARRIVAL = 'late_arrival', // Đi muộn
  EARLY_DEPARTURE = 'early_departure', // Về sớm
  OVERTIME = 'overtime', // Làm thêm giờ (OT)
  BUSINESS_TRIP = 'business_trip', // Công tác
  REMOTE_WORK = 'remote_work', // Làm remote
  COMPENSATORY = 'compensatory', // Nghỉ bù
  UNPAID_LEAVE = 'unpaid_leave', // Nghỉ không lương
  OTHER = 'other', // Khác
}

export enum LeaveRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'leave_requests' })
export class LeaveRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'enum', enum: LeaveRequestType })
  type!: LeaveRequestType;

  @Column({
    type: 'enum',
    enum: LeaveRequestStatus,
    default: LeaveRequestStatus.PENDING,
  })
  status!: LeaveRequestStatus;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({ type: 'time', nullable: true })
  startTime!: string | null;

  @Column({ type: 'time', nullable: true })
  endTime!: string | null;

  @Column({ type: 'decimal', precision: 4, scale: 1, default: 1 })
  totalDays!: number;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'simple-array', nullable: true })
  attachments!: string[] | null;

  @Column({ type: 'uuid', nullable: true })
  approvedById!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy!: User | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  adminNote!: string | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
