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
import { RegistrationPeriod } from '../../registration-period/entities/registration-period.entity';
import {
  LoaiCaLam,
  LoaiHinhLamViec,
} from '../constants/work-schedule.constants';

@Entity({ name: 'work_schedules' })
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

  @Column({ type: 'enum', enum: LoaiHinhLamViec, default: LoaiHinhLamViec.WFO })
  workType!: LoaiHinhLamViec;

  @Column({ type: 'enum', enum: LoaiCaLam, default: LoaiCaLam.FULL_DAY })
  loaiCa!: LoaiCaLam;

  @Column({ type: 'varchar', length: 5, nullable: true })
  gioBatDau!: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  gioKetThuc!: string;

  @Column({ type: 'int', nullable: true })
  soPhutDuKien!: number;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
