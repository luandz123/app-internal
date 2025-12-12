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

export enum NotificationType {
  SYSTEM = 'system',
  LEAVE_REQUEST = 'leave_request',
  SALARY = 'salary',
  REGULATION = 'regulation',
  SCHEDULE = 'schedule',
  REMINDER = 'reminder',
}

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type!: NotificationType;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'uuid', nullable: true })
  relatedId!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  relatedType!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  link!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
