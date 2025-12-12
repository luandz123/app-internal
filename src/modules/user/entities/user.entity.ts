import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 60 })
  firstName!: string;

  @Column({ length: 60 })
  lastName!: string;

  @Index('users_email_unique', { unique: true })
  @Column({ length: 120 })
  email!: string;

  @Exclude()
  @Column({ length: 120 })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STAFF })
  role!: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({ type: 'varchar', length: 120, nullable: true })
  position!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar!: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  baseSalary!: number;

  @Column({ type: 'int', default: 12 })
  annualLeaveDays!: number;

  @Column({ type: 'int', default: 0 })
  usedLeaveDays!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
