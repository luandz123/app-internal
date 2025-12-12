import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { RegistrationPeriod } from '../../registration-period/entities/registration-period.entity';

export enum WorkType {
  WFO = 'wfo', // Work From Office
  REMOTE = 'remote',
  OFF = 'off',
}

@Entity({ name: 'work_schedules' })
@Index(['userId', 'date'], { unique: true })
export class WorkSchedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' })
  periodId!: string;

  @ManyToOne(() => RegistrationPeriod, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'periodId' })
  period!: RegistrationPeriod;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'enum', enum: WorkType, default: WorkType.WFO })
  workType!: WorkType;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
