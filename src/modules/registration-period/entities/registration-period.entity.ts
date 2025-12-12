import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RegistrationPeriodStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  LOCKED = 'locked',
}

export enum PeriodType {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

@Entity({ name: 'registration_periods' })
export class RegistrationPeriod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: PeriodType, default: PeriodType.WEEKLY })
  type!: PeriodType;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({ type: 'timestamp' })
  registrationDeadline!: Date;

  @Column({
    type: 'enum',
    enum: RegistrationPeriodStatus,
    default: RegistrationPeriodStatus.OPEN,
  })
  status!: RegistrationPeriodStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
