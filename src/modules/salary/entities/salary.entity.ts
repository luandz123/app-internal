import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum SalaryStatus {
  DRAFT = 'draft',
  FINALIZED = 'finalized',
  PAID = 'paid',
}

@Entity({ name: 'salaries' })
@Index(['userId', 'year', 'month'], { unique: true })
export class Salary {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'int' })
  month!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  baseSalary!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  allowance!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  bonus!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  overtimePay!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  deduction!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  penalty!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  insurance!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  tax!: number;

  @Column({ type: 'int', default: 0 })
  workDays!: number;

  @Column({ type: 'int', default: 0 })
  actualWorkDays!: number;

  @Column({ type: 'int', default: 0 })
  leaveDays!: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  overtimeHours!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  netSalary!: number;

  @Column({ type: 'enum', enum: SalaryStatus, default: SalaryStatus.DRAFT })
  status!: SalaryStatus;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
