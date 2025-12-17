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
import { WorkSchedule } from '../../work-schedule/entities/work-schedule.entity';
import { LoaiHinhLamViec } from '../../work-schedule/constants/work-schedule.constants';

export enum TrangThaiChamCong {
  DA_VAO = 'checked_in',
  HOAN_THANH = 'completed',
  VANG_MAT = 'absent',
}

@Entity({ name: 'attendances' })
export class ChamCong {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  maNguoiDung!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'maNguoiDung' })
  nguoiDung!: User;

  @Column({ type: 'uuid', nullable: true })
  maLichLam!: string;

  @ManyToOne(() => WorkSchedule, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'maLichLam' })
  lichLam!: WorkSchedule;

  @Column({ type: 'date' })
  ngay!: Date;

  @Column({ type: 'timestamp', nullable: true })
  thoiGianVao!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  thoiGianRa!: Date | null;

  @Column({
    type: 'enum',
    enum: TrangThaiChamCong,
    default: TrangThaiChamCong.DA_VAO,
  })
  trangThai!: TrangThaiChamCong;

  @Column({ type: 'int', default: 0 })
  soPhutLamViec!: number;

  @Column({ type: 'varchar', length: 5, nullable: true })
  gioDangKyBatDau!: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  gioDangKyKetThuc!: string;

  @Column({ type: 'int', default: 0 })
  soPhutDangKy!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tyLeHoanThanh!: number;

  @Column({ type: 'enum', enum: LoaiHinhLamViec, default: LoaiHinhLamViec.WFO })
  loaiLamViec!: LoaiHinhLamViec;

  @Column({ type: 'int', default: 0 })
  soPhutDiMuon!: number;

  @Column({ type: 'int', default: 0 })
  soPhutVeSom!: number;

  @Column({ type: 'int', default: 0 })
  soPhutTangCa!: number;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipVao!: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipRa!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  viTriVao!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  viTriRa!: string | null;

  @Column({ type: 'text', nullable: true })
  ghiChu!: string | null;

  @CreateDateColumn()
  ngayTao!: Date;

  @UpdateDateColumn()
  ngayCapNhat!: Date;
}
