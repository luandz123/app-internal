import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Between, Repository } from 'typeorm';
import { ChamCong, TrangThaiChamCong } from './entities/cham-cong.entity';
import { ChamCongVaoDto, ChamCongRaDto, TruyVanChamCongDto } from './dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

// Cấu hình giờ làm việc mặc định (có thể chuyển ra config)
const WORK_START_HOUR = 8;
const WORK_START_MINUTE = 30; // 8:30
const WORK_END_HOUR = 17;
const WORK_END_MINUTE = 30; // 17:30
const STANDARD_WORK_MINUTES = 8 * 60; // 8 giờ = 480 phút

@Injectable()
export class ChamCongService {
  constructor(
    @InjectRepository(ChamCong)
    private readonly chamCongRepository: Repository<ChamCong>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Lấy ngày hiện tại theo định dạng YYYY-MM-DD
   */
  private getToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  /**
   * Tính số phút đi muộn
   */
  private calculateLateMinutes(checkInTime: Date): number {
    const checkInHour = checkInTime.getHours();
    const checkInMinute = checkInTime.getMinutes();
    const checkInTotalMinutes = checkInHour * 60 + checkInMinute;
    const workStartTotalMinutes = WORK_START_HOUR * 60 + WORK_START_MINUTE;

    if (checkInTotalMinutes > workStartTotalMinutes) {
      return checkInTotalMinutes - workStartTotalMinutes;
    }
    return 0;
  }

  /**
   * Tính số phút về sớm
   */
  private calculateEarlyLeaveMinutes(checkOutTime: Date): number {
    const checkOutHour = checkOutTime.getHours();
    const checkOutMinute = checkOutTime.getMinutes();
    const checkOutTotalMinutes = checkOutHour * 60 + checkOutMinute;
    const workEndTotalMinutes = WORK_END_HOUR * 60 + WORK_END_MINUTE;

    if (checkOutTotalMinutes < workEndTotalMinutes) {
      return workEndTotalMinutes - checkOutTotalMinutes;
    }
    return 0;
  }

  /**
   * Tính thời gian làm việc thực tế (phút)
   */
  private calculateWorkingMinutes(
    checkInTime: Date,
    checkOutTime: Date,
  ): number {
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }

  /**
   * Tính số phút làm thêm giờ
   */
  private calculateOvertimeMinutes(workingMinutes: number): number {
    if (workingMinutes > STANDARD_WORK_MINUTES) {
      return workingMinutes - STANDARD_WORK_MINUTES;
    }
    return 0;
  }

  /**
   * Check-in cho nhân viên
   */
  async checkIn(
    maNguoiDung: string,
    dto: ChamCongVaoDto,
    ipAddress: string,
  ): Promise<ChamCong> {
    const today = this.getToday();

    // Kiểm tra xem đã check-in hôm nay chưa
    const existingAttendance = await this.chamCongRepository.findOne({
      where: { maNguoiDung, ngay: today },
    });

    if (existingAttendance) {
      if (existingAttendance.thoiGianVao) {
        throw new BadRequestException('Bạn đã check-in hôm nay rồi');
      }
    }

    const thoiGianVao = new Date();
    const soPhutDiMuon = this.calculateLateMinutes(thoiGianVao);

    if (existingAttendance) {
      // Cập nhật record đã tồn tại
      existingAttendance.thoiGianVao = thoiGianVao;
      existingAttendance.ipVao = ipAddress;
      existingAttendance.viTriVao = dto.viTri || null;
      existingAttendance.soPhutDiMuon = soPhutDiMuon;
      existingAttendance.trangThai = TrangThaiChamCong.DA_VAO;
      if (dto.ghiChu) {
        existingAttendance.ghiChu = dto.ghiChu;
      }
      return this.chamCongRepository.save(existingAttendance);
    }

    // Tạo mới bản ghi chấm công
    const attendance = this.chamCongRepository.create({
      maNguoiDung,
      ngay: today,
      thoiGianVao,
      ipVao: ipAddress,
      viTriVao: dto.viTri || null,
      soPhutDiMuon,
      trangThai: TrangThaiChamCong.DA_VAO,
      ghiChu: dto.ghiChu || null,
    });

    return this.chamCongRepository.save(attendance);
  }

  /**
   * Check-out cho nhân viên
   */
  async checkOut(
    maNguoiDung: string,
    dto: ChamCongRaDto,
    ipAddress: string,
  ): Promise<ChamCong> {
    const today = this.getToday();

    // Tìm bản ghi chấm công của hôm nay
    const attendance = await this.chamCongRepository.findOne({
      where: { maNguoiDung, ngay: today },
    });

    if (!attendance) {
      throw new BadRequestException('Bạn chưa check-in hôm nay');
    }

    if (!attendance.thoiGianVao) {
      throw new BadRequestException('Bạn chưa check-in hôm nay');
    }

    if (attendance.thoiGianRa) {
      throw new BadRequestException('Bạn đã check-out hôm nay rồi');
    }

    const thoiGianRa = new Date();
    const soPhutVeSom = this.calculateEarlyLeaveMinutes(thoiGianRa);
    const soPhutLamViec = this.calculateWorkingMinutes(
      attendance.thoiGianVao,
      thoiGianRa,
    );
    const soPhutTangCa = this.calculateOvertimeMinutes(soPhutLamViec);

    attendance.thoiGianRa = thoiGianRa;
    attendance.ipRa = ipAddress;
    attendance.viTriRa = dto.viTri || null;
    attendance.soPhutVeSom = soPhutVeSom;
    attendance.soPhutLamViec = soPhutLamViec;
    attendance.soPhutTangCa = soPhutTangCa;
    attendance.trangThai = TrangThaiChamCong.HOAN_THANH;

    if (dto.ghiChu) {
      attendance.ghiChu = attendance.ghiChu
        ? `${attendance.ghiChu}\n${dto.ghiChu}`
        : dto.ghiChu;
    }

    return this.chamCongRepository.save(attendance);
  }

  /**
   * Lấy thông tin chấm công hôm nay của user
   */
  async getTodayAttendance(maNguoiDung: string): Promise<ChamCong | null> {
    const today = this.getToday();
    return this.chamCongRepository.findOne({
      where: { maNguoiDung, ngay: today },
    });
  }

  /**
   * Lấy chấm công theo ID
   */
  async findOne(id: string): Promise<ChamCong> {
    const attendance = await this.chamCongRepository.findOne({
      where: { id },
      relations: ['nguoiDung'],
    });

    if (!attendance) {
      throw new NotFoundException('Không tìm thấy bản ghi chấm công');
    }

    return attendance;
  }

  /**
   * Lấy danh sách chấm công với filter và pagination
   */
  async findAll(
    query: TruyVanChamCongDto,
    currentUserId?: string,
    isAdmin = false,
  ): Promise<PaginatedResult<ChamCong>> {
    const {
      page = 1,
      limit = 10,
      maNguoiDung,
      ngayBatDau,
      ngayKetThuc,
      trangThai,
      thang,
      nam,
    } = query;

    const queryBuilder = this.chamCongRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.nguoiDung', 'nguoiDung');

    // Nếu không phải admin, chỉ xem được của chính mình
    if (!isAdmin) {
      queryBuilder.where('attendance.maNguoiDung = :currentUserId', {
        currentUserId,
      });
    } else if (maNguoiDung) {
      queryBuilder.where('attendance.maNguoiDung = :maNguoiDung', {
        maNguoiDung,
      });
    }

    // Filter theo ngày
    if (ngayBatDau) {
      queryBuilder.andWhere('attendance.ngay >= :ngayBatDau', {
        ngayBatDau: new Date(ngayBatDau),
      });
    }

    if (ngayKetThuc) {
      queryBuilder.andWhere('attendance.ngay <= :ngayKetThuc', {
        ngayKetThuc: new Date(ngayKetThuc),
      });
    }

    // Filter theo tháng/năm
    if (thang && nam) {
      const startOfMonth = new Date(nam, thang - 1, 1);
      const endOfMonth = new Date(nam, thang, 0);
      queryBuilder.andWhere(
        'attendance.ngay BETWEEN :startOfMonth AND :endOfMonth',
        {
          startOfMonth,
          endOfMonth,
        },
      );
    } else if (nam) {
      const startOfYear = new Date(nam, 0, 1);
      const endOfYear = new Date(nam, 11, 31);
      queryBuilder.andWhere(
        'attendance.ngay BETWEEN :startOfYear AND :endOfYear',
        {
          startOfYear,
          endOfYear,
        },
      );
    }

    // Filter theo status
    if (trangThai) {
      queryBuilder.andWhere('attendance.trangThai = :trangThai', { trangThai });
    }

    // Sắp xếp và pagination
    queryBuilder
      .orderBy('attendance.ngay', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy thống kê chấm công của user trong tháng
   */
  async getMonthlyStats(
    maNguoiDung: string,
    thang: number,
    nam: number,
  ): Promise<{
    tongSoNgay: number;
    soNgayDiLam: number;
    soNgayVang: number;
    tongPhutDiMuon: number;
    tongPhutVeSom: number;
    tongPhutTangCa: number;
    tongPhutLamViec: number;
    trungBinhPhutLamViec: number;
  }> {
    const startOfMonth = new Date(nam, thang - 1, 1);
    const endOfMonth = new Date(nam, thang, 0);

    const attendances = await this.chamCongRepository.find({
      where: {
        maNguoiDung,
        ngay: Between(startOfMonth, endOfMonth),
      },
    });

    const soNgayDiLam = attendances.filter(
      (a) => a.trangThai === TrangThaiChamCong.HOAN_THANH,
    ).length;
    const soNgayVang = attendances.filter(
      (a) => a.trangThai === TrangThaiChamCong.VANG_MAT,
    ).length;

    const tongPhutDiMuon = attendances.reduce(
      (sum, a) => sum + a.soPhutDiMuon,
      0,
    );
    const tongPhutVeSom = attendances.reduce(
      (sum, a) => sum + a.soPhutVeSom,
      0,
    );
    const tongPhutTangCa = attendances.reduce(
      (sum, a) => sum + a.soPhutTangCa,
      0,
    );
    const tongPhutLamViec = attendances.reduce(
      (sum, a) => sum + a.soPhutLamViec,
      0,
    );

    return {
      tongSoNgay: attendances.length,
      soNgayDiLam,
      soNgayVang,
      tongPhutDiMuon,
      tongPhutVeSom,
      tongPhutTangCa,
      tongPhutLamViec,
      trungBinhPhutLamViec:
        soNgayDiLam > 0 ? Math.round(tongPhutLamViec / soNgayDiLam) : 0,
    };
  }

  /**
   * Lấy danh sách chấm công của tất cả nhân viên trong ngày (cho admin)
   */
  async getDailyReport(ngay: Date): Promise<ChamCong[]> {
    return this.chamCongRepository.find({
      where: { ngay },
      relations: ['nguoiDung'],
      order: { thoiGianVao: 'ASC' },
    });
  }

  /**
   * Đánh dấu vắng mặt cho nhân viên không check-in (cron job)
   */
  async markAbsentForDate(ngay: Date, userIds: string[]): Promise<void> {
    for (const maNguoiDung of userIds) {
      const existing = await this.chamCongRepository.findOne({
        where: { maNguoiDung, ngay },
      });

      if (!existing) {
        const attendance = this.chamCongRepository.create({
          maNguoiDung,
          ngay,
          trangThai: TrangThaiChamCong.VANG_MAT,
        });
        await this.chamCongRepository.save(attendance);
      }
    }
  }
}
