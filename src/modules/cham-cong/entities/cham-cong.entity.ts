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

export enum TrangThaiChamCong {
  DA_VAO = 'checked_in', // Đã check-in, chưa check-out
  HOAN_THANH = 'completed', // Đã hoàn thành (có cả check-in và check-out)
  VANG_MAT = 'absent', // Vắng mặt
}

@Entity({ name: 'attendances' })
@Index(['maNguoiDung', 'ngay'], { unique: true })
export class ChamCong {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  maNguoiDung!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'maNguoiDung' })
  nguoiDung!: User;

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

  // Thời gian làm việc thực tế (tính bằng phút)
  @Column({ type: 'int', default: 0 })
  soPhutLamViec!: number;

  // Số phút đi muộn (so với giờ quy định, ví dụ: 8:30)
  @Column({ type: 'int', default: 0 })
  soPhutDiMuon!: number;

  // Số phút về sớm (so với giờ quy định, ví dụ: 17:30)
  @Column({ type: 'int', default: 0 })
  soPhutVeSom!: number;

  // Số phút làm thêm (overtime)
  @Column({ type: 'int', default: 0 })
  soPhutTangCa!: number;

  // IP Address khi check-in
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipVao!: string | null;

  // IP Address khi check-out
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipRa!: string | null;

  // GPS Location khi check-in (format: "latitude,longitude")
  @Column({ type: 'varchar', length: 50, nullable: true })
  viTriVao!: string | null;

  // GPS Location khi check-out (format: "latitude,longitude")
  @Column({ type: 'varchar', length: 50, nullable: true })
  viTriRa!: string | null;

  // Ghi chú
  @Column({ type: 'text', nullable: true })
  ghiChu!: string | null;

  @CreateDateColumn()
  ngayTao!: Date;

  @UpdateDateColumn()
  ngayCapNhat!: Date;
}
