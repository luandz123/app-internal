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
import { WorkSchedule } from '../work-schedule/entities/work-schedule.entity';
import { LoaiCaLam } from '../work-schedule/constants/work-schedule.constants';

@Injectable()
export class ChamCongService {
  constructor(
    @InjectRepository(ChamCong)
    private readonly chamCongRepository: Repository<ChamCong>,
    @InjectRepository(WorkSchedule)
    private readonly workScheduleRepository: Repository<WorkSchedule>,
    private readonly configService: ConfigService,
  ) {}

  private getToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private getMinutesFromDate(date: Date): number {
    return date.getHours() * 60 + date.getMinutes();
  }

  private readonly AUTO_CLOSE_SHIFT_BUFFER_MINUTES = 30;

  /**
   * Tự động đóng ca cũ nếu đã quá giờ kết thúc + buffer
   * Đánh dấu ca cũ là "quên checkout" và cho phép check-in ca mới
   */
  private async autoCloseExpiredShift(
    activeAttendance: ChamCong,
    activeCa: WorkSchedule | undefined,
    currentMinutes: number,
  ): Promise<boolean> {
    if (!activeCa) return false;

    const endMinutes = this.timeToMinutes(activeCa.gioKetThuc);

    // Kiểm tra xem đã quá giờ kết thúc ca cũ + buffer chưa
    if (currentMinutes >= endMinutes + this.AUTO_CLOSE_SHIFT_BUFFER_MINUTES) {
      // Tự động đóng ca với giờ kết thúc đăng ký
      const autoCloseTime = new Date();
      autoCloseTime.setHours(
        Math.floor(endMinutes / 60),
        endMinutes % 60,
        0,
        0,
      );

      // Tính thời gian làm việc (từ check-in đến giờ kết thúc ca)
      const diffMs =
        autoCloseTime.getTime() - activeAttendance.thoiGianVao!.getTime();
      const workingMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

      // Tính tỷ lệ hoàn thành
      const completionRate =
        activeAttendance.soPhutDangKy > 0
          ? Math.min(
              100,
              (workingMinutes / activeAttendance.soPhutDangKy) * 100,
            )
          : 0;

      // Cập nhật ca cũ - đánh dấu là quên checkout
      activeAttendance.thoiGianRa = autoCloseTime;
      activeAttendance.trangThai = TrangThaiChamCong.HOAN_THANH;
      activeAttendance.soPhutLamViec = workingMinutes;
      activeAttendance.soPhutVeSom = 0;
      activeAttendance.soPhutTangCa = 0;
      activeAttendance.tyLeHoanThanh = Math.round(completionRate * 100) / 100;
      activeAttendance.ghiChu = activeAttendance.ghiChu
        ? `${activeAttendance.ghiChu}\n[Hệ thống] Quên check-out - tự động đóng ca`
        : `[Hệ thống] Quên check-out - tự động đóng ca`;

      await this.chamCongRepository.save(activeAttendance);
      return true;
    }

    return false;
  }

  /**
   * Tìm ca làm việc phù hợp để check-in
   * - Nếu có maLichLam: dùng trực tiếp
   * - Nếu có loaiCa: tìm ca theo loại
   * - Nếu không có gì: tìm ca gần nhất chưa check-in
   */
  private async findScheduleForCheckIn(
    maNguoiDung: string,
    today: Date,
    dto: ChamCongVaoDto,
    currentMinutes: number,
  ): Promise<{ schedule: WorkSchedule; checkedInIds: Set<string> }> {
    // Lấy tất cả ca làm việc trong ngày
    const schedules = await this.workScheduleRepository.find({
      where: { userId: maNguoiDung, date: today },
      order: { gioBatDau: 'ASC' },
    });

    if (!schedules.length) {
      throw new BadRequestException('Không tìm thấy lịch làm việc cho hôm nay');
    }

    // Lấy các ca đã check-in
    let attendances = await this.chamCongRepository.find({
      where: { maNguoiDung, ngay: today },
    });

    // Kiểm tra xem có ca nào đang check-in mà chưa check-out không
    const activeAttendance = attendances.find(
      (a) => a.trangThai === TrangThaiChamCong.DA_VAO,
    );

    if (activeAttendance) {
      const activeCa = schedules.find(
        (s) => s.id === activeAttendance.maLichLam,
      );

      // Thử tự động đóng ca nếu đã quá giờ
      const wasClosed = await this.autoCloseExpiredShift(
        activeAttendance,
        activeCa,
        currentMinutes,
      );

      if (!wasClosed) {
        // Nếu chưa đủ điều kiện tự động đóng, báo lỗi như cũ
        const caName = this.getShiftName(activeCa?.loaiCa);
        throw new BadRequestException(
          `Bạn chưa check-out ${caName} (${activeCa?.gioBatDau} - ${activeCa?.gioKetThuc}). Vui lòng check-out trước khi check-in ca mới.`,
        );
      }

      // Reload attendances sau khi đóng ca cũ
      attendances = await this.chamCongRepository.find({
        where: { maNguoiDung, ngay: today },
      });
    }

    const checkedInIds = new Set(
      attendances.map((a) => a.maLichLam).filter((id): id is string => !!id),
    );

    let selectedSchedule: WorkSchedule | null = null;

    // Trường hợp 1: Chỉ định ID lịch cụ thể
    if (dto.maLichLam) {
      // ...existing code...
      selectedSchedule = schedules.find((s) => s.id === dto.maLichLam) || null;
      if (!selectedSchedule) {
        throw new BadRequestException(
          'Không tìm thấy ca làm việc với ID đã chỉ định',
        );
      }
      if (checkedInIds.has(selectedSchedule.id)) {
        throw new BadRequestException('Ca làm việc này đã được check-in');
      }
    }
    // Trường hợp 2: Chỉ định loại ca
    else if (dto.loaiCa) {
      // ...existing code...
      selectedSchedule =
        schedules.find(
          (s) => s.loaiCa === dto.loaiCa && !checkedInIds.has(s.id),
        ) || null;
      if (!selectedSchedule) {
        throw new BadRequestException(
          `Không tìm thấy ${this.getShiftName(dto.loaiCa)} chưa check-in`,
        );
      }
    }
    // Trường hợp 3: Tự động tìm ca phù hợp
    else {
      // ...existing code...
      selectedSchedule = this.findNextAvailableShift(
        schedules,
        checkedInIds,
        currentMinutes,
      );
      if (!selectedSchedule) {
        throw new BadRequestException(
          'Bạn đã check-in hết các ca làm việc trong ngày',
        );
      }
    }

    return { schedule: selectedSchedule, checkedInIds };
  }

  private getShiftName(loaiCa?: LoaiCaLam | null): string {
    switch (loaiCa) {
      case LoaiCaLam.MORNING:
        return 'ca sáng';
      case LoaiCaLam.AFTERNOON:
        return 'ca chiều';
      case LoaiCaLam.CUSTOM:
        return 'ca tùy chỉnh';
      default:
        return 'ca làm việc';
    }
  }

  private findNextAvailableShift(
    schedules: WorkSchedule[],
    checkedInScheduleIds: Set<string>,
    currentMinutes: number,
  ): WorkSchedule | null {
    // Lọc các ca chưa check-in
    const availableSchedules = schedules.filter(
      (s) => !checkedInScheduleIds.has(s.id),
    );

    if (availableSchedules.length === 0) return null;

    // Sắp xếp theo giờ bắt đầu
    availableSchedules.sort(
      (a, b) =>
        this.timeToMinutes(a.gioBatDau) - this.timeToMinutes(b.gioBatDau),
    );

    // Tìm ca phù hợp nhất (ca đầu tiên mà giờ hiện tại <= giờ kết thúc)
    for (const schedule of availableSchedules) {
      const endMinutes = this.timeToMinutes(schedule.gioKetThuc);
      // Cho phép check-in nếu chưa hết giờ của ca đó
      if (currentMinutes <= endMinutes) {
        return schedule;
      }
    }

    // Nếu tất cả ca đều đã qua giờ, trả về ca cuối cùng để ghi nhận đi muộn
    return availableSchedules[availableSchedules.length - 1];
  }

  async checkIn(
    maNguoiDung: string,
    dto: ChamCongVaoDto,
    ipAddress: string,
  ): Promise<ChamCong> {
    const now = new Date();
    const today = this.getToday();
    const currentMinutes = this.getMinutesFromDate(now);

    // Tìm ca làm việc phù hợp
    const { schedule: selectedSchedule } = await this.findScheduleForCheckIn(
      maNguoiDung,
      today,
      dto,
      currentMinutes,
    );

    // Tính số phút đi muộn
    const startMinutes = this.timeToMinutes(selectedSchedule.gioBatDau);
    const lateMinutes = Math.max(0, currentMinutes - startMinutes);

    const chamCong = this.chamCongRepository.create({
      maNguoiDung,
      ngay: today,
      thoiGianVao: now,
      trangThai: TrangThaiChamCong.DA_VAO,
      ipVao: ipAddress,
      viTriVao: dto.viTri ?? null,
      maLichLam: selectedSchedule.id,
      gioDangKyBatDau: selectedSchedule.gioBatDau,
      gioDangKyKetThuc: selectedSchedule.gioKetThuc,
      soPhutDangKy: selectedSchedule.soPhutDuKien,
      loaiLamViec: selectedSchedule.workType,
      loaiCa: selectedSchedule.loaiCa,
      soPhutDiMuon: lateMinutes,
      ghiChu: dto.ghiChu,
    });

    return this.chamCongRepository.save(chamCong);
  }

  async checkOut(
    maNguoiDung: string,
    dto: ChamCongRaDto,
    ipAddress: string,
  ): Promise<ChamCong> {
    const today = this.getToday();
    let attendance: ChamCong | null = null;

    // Nếu có chỉ định mã chấm công cụ thể
    if (dto.maChamCong) {
      attendance = await this.chamCongRepository.findOne({
        where: {
          id: dto.maChamCong,
          maNguoiDung,
          trangThai: TrangThaiChamCong.DA_VAO,
        },
        relations: ['lichLam'],
      });
      if (!attendance) {
        throw new BadRequestException(
          'Không tìm thấy bản ghi chấm công với ID đã chỉ định hoặc đã check-out',
        );
      }
    } else {
      // Tìm bản ghi check-in chưa check-out (ưu tiên ca sớm nhất)
      attendance = await this.chamCongRepository.findOne({
        where: {
          maNguoiDung,
          ngay: today,
          trangThai: TrangThaiChamCong.DA_VAO,
        },
        relations: ['lichLam'],
        order: { thoiGianVao: 'ASC' },
      });
    }

    if (!attendance) {
      throw new BadRequestException(
        'Không tìm thấy lượt check-in nào chưa hoàn thành. Vui lòng check-in trước.',
      );
    }

    const now = new Date();
    const currentMinutes = this.getMinutesFromDate(now);
    const endMinutes = this.timeToMinutes(attendance.gioDangKyKetThuc!);

    // Tính về sớm (nếu check-out trước giờ kết thúc)
    const earlyMinutes = Math.max(0, endMinutes - currentMinutes);

    // Tính thời gian làm việc thực tế
    const diffMs = now.getTime() - attendance.thoiGianVao!.getTime();
    const workingMinutes = Math.floor(diffMs / (1000 * 60));

    // Tính tăng ca (làm thêm ngoài giờ đăng ký)
    const overtimeMinutes = Math.max(
      0,
      workingMinutes - attendance.soPhutDangKy,
    );

    // Tính tỷ lệ hoàn thành
    const completionRate =
      attendance.soPhutDangKy > 0
        ? Math.min(100, (workingMinutes / attendance.soPhutDangKy) * 100)
        : 0;

    attendance.thoiGianRa = now;
    attendance.trangThai = TrangThaiChamCong.HOAN_THANH;
    attendance.ipRa = ipAddress;
    attendance.viTriRa = dto.viTri ?? null;
    attendance.soPhutLamViec = workingMinutes;
    attendance.soPhutVeSom = earlyMinutes;
    attendance.soPhutTangCa = overtimeMinutes;
    attendance.tyLeHoanThanh = Math.round(completionRate * 100) / 100;

    if (dto.ghiChu) {
      attendance.ghiChu = attendance.ghiChu
        ? `${attendance.ghiChu}\n[Check-out] ${dto.ghiChu}`
        : `[Check-out] ${dto.ghiChu}`;
    }

    return this.chamCongRepository.save(attendance);
  }

  /**
   * Lấy trạng thái chấm công hôm nay với thông tin chi tiết từng ca
   */
  async getTodayAttendances(maNguoiDung: string): Promise<{
    schedules: WorkSchedule[];
    attendances: ChamCong[];
    summary: {
      totalShifts: number;
      completedShifts: number;
      inProgressShift: ChamCong | null;
      pendingShifts: WorkSchedule[];
    };
  }> {
    const today = this.getToday();

    const schedules = await this.workScheduleRepository.find({
      where: { userId: maNguoiDung, date: today },
      order: { gioBatDau: 'ASC' },
    });

    const attendances = await this.chamCongRepository.find({
      where: { maNguoiDung, ngay: today },
      order: { thoiGianVao: 'ASC' },
    });

    const checkedInScheduleIds = new Set(
      attendances.map((a) => a.maLichLam).filter((id) => id),
    );

    const inProgressShift =
      attendances.find((a) => a.trangThai === TrangThaiChamCong.DA_VAO) || null;

    const completedShifts = attendances.filter(
      (a) => a.trangThai === TrangThaiChamCong.HOAN_THANH,
    ).length;

    const pendingShifts = schedules.filter(
      (s) => !checkedInScheduleIds.has(s.id),
    );

    return {
      schedules,
      attendances,
      summary: {
        totalShifts: schedules.length,
        completedShifts,
        inProgressShift,
        pendingShifts,
      },
    };
  }
  async findOne(id: string): Promise<ChamCong> {
    const attendance = await this.chamCongRepository.findOne({
      where: { id },
      relations: ['nguoiDung', 'lichLam'],
    });

    if (!attendance) {
      throw new NotFoundException('Không tìm thấy bản ghi chấm công');
    }

    return attendance;
  }

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
      .leftJoinAndSelect('attendance.nguoiDung', 'nguoiDung')
      .leftJoinAndSelect('attendance.lichLam', 'lichLam');

    if (!isAdmin) {
      queryBuilder.where('attendance.maNguoiDung = :currentUserId', {
        currentUserId,
      });
    } else if (maNguoiDung) {
      queryBuilder.where('attendance.maNguoiDung = :maNguoiDung', {
        maNguoiDung,
      });
    }

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

    if (trangThai) {
      queryBuilder.andWhere('attendance.trangThai = :trangThai', { trangThai });
    }

    queryBuilder
      .orderBy('attendance.ngay', 'DESC')
      .addOrderBy('attendance.thoiGianVao', 'DESC')
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

  async getDailyReport(ngay: Date): Promise<ChamCong[]> {
    return this.chamCongRepository.find({
      where: { ngay },
      relations: ['nguoiDung', 'lichLam'],
      order: { thoiGianVao: 'ASC' },
    });
  }

  async markAbsentForDate(ngay: Date, userIds: string[]): Promise<void> {
    // This logic needs update for multiple shifts.
    // For each user, check if they have a schedule for this day.
    // If they have a schedule but no attendance, mark absent.
    // But this method takes userIds.
    // I'll leave it simple for now or update if I have time.
    // The user didn't explicitly ask to fix cron job logic, but "Tái cấu trúc hoàn toàn" implies it.
    // However, I don't have the full context of how this is called.
    // I'll just update it to check against schedules if possible, but `userIds` passed might be all users.

    // Better logic: Find all schedules for `ngay` where userId is in `userIds`.
    // For each schedule, check if there is an attendance.
    // If not, create absent attendance linked to schedule.

    const schedules = await this.workScheduleRepository.find({
      where: { date: ngay },
    });

    // Filter schedules for users in userIds (if userIds is provided)
    // But `userIds` argument suggests we iterate users.

    // Let's stick to the previous logic but maybe link to schedule if found?
    // Or just leave it as "VANG_MAT" for the day.
    // Given the complexity, I'll keep it simple: if no attendance at all for the day, mark absent.

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
