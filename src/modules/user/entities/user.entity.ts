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

  @Column({ type: 'varchar', length: 120, nullable: true })
  position!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
