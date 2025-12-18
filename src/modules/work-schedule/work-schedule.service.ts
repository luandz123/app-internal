import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { RegistrationPeriodService } from '../registration-period/registration-period.service';
import { RegistrationPeriodStatus } from '../registration-period/entities/registration-period.entity';
import {
  CreateWorkScheduleDto,
  ScheduleItemDto,
} from './dto/create-work-schedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-work-schedule.dto';
import { WorkSchedule } from './entities/work-schedule.entity';
import {
  CA_LAM_VIEC_MAC_DINH,
  LoaiCaLam,
  WORK_SCHEDULE_CONSTANTS,
} from './constants/work-schedule.constants';
import { ChamCong } from '../cham-cong/entities/cham-cong.entity';

@Injectable()
export class DichVuLichLamViec {
  constructor(
    @InjectRepository(WorkSchedule)
    private readonly khoLich: Repository<WorkSchedule>,
    @InjectRepository(ChamCong)
    private readonly chamCongRepository: Repository<ChamCong>,
    private readonly dichVuKy: RegistrationPeriodService,
  ) {}

  async taoHangLoat(
    idNguoiDung: string,
    duLieu: CreateWorkScheduleDto,
  ): Promise<WorkSchedule[]> {
    const ky = await this.dichVuKy.findOne(duLieu.periodId);

    if (ky.status !== RegistrationPeriodStatus.OPEN) {
      throw new BadRequestException('Kỳ đăng ký chưa mở');
    }

    if (new Date() > ky.registrationDeadline) {
      throw new BadRequestException('Đã quá hạn đăng ký');
    }

    // Group by date
    const schedulesByDate = new Map<string, ScheduleItemDto[]>();
    for (const muc of duLieu.schedules) {
      const ngay = new Date(muc.date);
      if (ngay < ky.startDate || ngay > ky.endDate) {
        throw new BadRequestException(
          `Ngày ${muc.date} không nằm trong kỳ đăng ký`,
        );
      }
      const dateStr = muc.date;
      if (!schedulesByDate.has(dateStr)) {
        schedulesByDate.set(dateStr, []);
      }
      schedulesByDate.get(dateStr)!.push(muc);
    }

    const danhSachLich: WorkSchedule[] = [];

    for (const [dateStr, items] of schedulesByDate) {
      const resolvedShifts: Array<{
        loaiCa: LoaiCaLam;
        workType: string;
        start: string;
        end: string;
        minutes: number;
        note?: string;
      }> = [];

      // Kiểm tra trùng loại ca trong cùng ngày (chỉ không cho đăng ký 2 ca sáng hoặc 2 ca chiều)
      // Ca custom có thể đăng ký nhiều lần
      const caTypes = items
        .filter((i) => i.loaiCa !== LoaiCaLam.CUSTOM)
        .map((i) => i.loaiCa);
      const uniqueCaTypes = new Set(caTypes);
      if (caTypes.length !== uniqueCaTypes.size) {
        throw new BadRequestException(
          `Ngày ${dateStr} không thể đăng ký trùng loại ca (sáng/chiều)`,
        );
      }

      for (const item of items) {
        let start = item.gioBatDau;
        let end = item.gioKetThuc;

        if (item.loaiCa !== LoaiCaLam.CUSTOM) {
          // Ca sáng hoặc chiều: dùng giờ mặc định nếu không có giờ tùy chỉnh
          const def = CA_LAM_VIEC_MAC_DINH[item.loaiCa];
          start = item.gioBatDau || def.gioBatDau;
          end = item.gioKetThuc || def.gioKetThuc;
        } else {
          // Ca tùy chỉnh: bắt buộc có giờ
          if (!start || !end) {
            throw new BadRequestException(
              'Giờ bắt đầu và kết thúc là bắt buộc cho ca tùy chỉnh',
            );
          }
        }

        const minutes = this.calculateMinutes(start, end);

        if (minutes < WORK_SCHEDULE_CONSTANTS.MIN_SHIFT_MINUTES) {
          throw new BadRequestException(
            `Ca làm việc ngày ${dateStr} phải tối thiểu 2 giờ`,
          );
        }

        resolvedShifts.push({
          loaiCa: item.loaiCa,
          workType: item.workType,
          start: start,
          end: end,
          minutes,
          note: item.note,
        });
      }

      // Kiểm tra trùng giờ giữa các ca
      resolvedShifts.sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 0; i < resolvedShifts.length - 1; i++) {
        if (resolvedShifts[i].end > resolvedShifts[i + 1].start) {
          throw new BadRequestException(
            `Ca làm việc ngày ${dateStr} bị trùng giờ`,
          );
        }
      }

      // Tạo các bản ghi lịch
      for (const shift of resolvedShifts) {
        danhSachLich.push(
          this.khoLich.create({
            userId: idNguoiDung,
            periodId: duLieu.periodId,
            date: new Date(dateStr),
            workType: shift.workType as any,
            loaiCa: shift.loaiCa,
            gioBatDau: shift.start,
            gioKetThuc: shift.end,
            soPhutDuKien: shift.minutes,
            note: shift.note,
          }),
        );
      }
    }

    // Lấy tất cả lịch cũ của user trong kỳ này
    const lichCu = await this.khoLich.find({
      where: { userId: idNguoiDung, periodId: duLieu.periodId },
    });

    if (lichCu.length > 0) {
      // Lấy danh sách ID lịch cũ
      const lichCuIds = lichCu.map((l) => l.id);

      // Kiểm tra xem có bản ghi chấm công nào liên kết với các lịch này không
      const chamCongLienKet = await this.chamCongRepository.find({
        where: { maLichLam: In(lichCuIds) },
      });

      if (chamCongLienKet.length > 0) {
        // Lấy danh sách ngày đã chấm công
        const ngayDaChamCong = [
          ...new Set(
            chamCongLienKet.map((cc) => {
              const ngay = new Date(cc.ngay);
              return `${ngay.getDate()}/${ngay.getMonth() + 1}/${ngay.getFullYear()}`;
            }),
          ),
        ];

        throw new BadRequestException(
          `Không thể thay đổi lịch đăng ký vì đã có dữ liệu chấm công cho các ngày: ${ngayDaChamCong.join(', ')}. Vui lòng liên hệ quản trị viên để được hỗ trợ.`,
        );
      }

      // Xóa lịch cũ nếu không có chấm công liên kết
      await this.khoLich
        .createQueryBuilder()
        .delete()
        .from(WorkSchedule)
        .where('userId = :userId', { userId: idNguoiDung })
        .andWhere('periodId = :periodId', { periodId: duLieu.periodId })
        .execute();
    }

    return this.khoLich.save(danhSachLich);
  }

  private calculateMinutes(start: string, end: string): number {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    return h2 * 60 + m2 - (h1 * 60 + m1);
  }

  async timTheoNguoiDung(idNguoiDung: string): Promise<WorkSchedule[]> {
    return this.khoLich.find({
      where: { userId: idNguoiDung },
      relations: ['period'],
      order: { date: 'ASC', gioBatDau: 'ASC' },
    });
  }

  async timTheoNguoiDungVaKy(
    idNguoiDung: string,
    idKy: string,
  ): Promise<WorkSchedule[]> {
    return this.khoLich.find({
      where: { userId: idNguoiDung, periodId: idKy },
      order: { date: 'ASC', gioBatDau: 'ASC' },
    });
  }

  async timTheoKy(idKy: string): Promise<WorkSchedule[]> {
    return this.khoLich.find({
      where: { periodId: idKy },
      relations: ['user'],
      order: { date: 'ASC', gioBatDau: 'ASC' },
    });
  }

  async timTheoKhoangThoiGian(
    idNguoiDung: string,
    ngayBatDau: Date,
    ngayKetThuc: Date,
  ): Promise<WorkSchedule[]> {
    return this.khoLich.find({
      where: {
        userId: idNguoiDung,
        date: Between(ngayBatDau, ngayKetThuc),
      },
      order: { date: 'ASC', gioBatDau: 'ASC' },
    });
  }

  async timMot(id: string): Promise<WorkSchedule> {
    const lich = await this.khoLich.findOne({
      where: { id },
      relations: ['user', 'period'],
    });
    if (!lich) {
      throw new NotFoundException('Không tìm thấy lịch làm việc');
    }
    return lich;
  }

  async capNhat(
    id: string,
    duLieu: UpdateWorkScheduleDto,
  ): Promise<WorkSchedule> {
    const lich = await this.timMot(id);

    if (lich.period.status !== RegistrationPeriodStatus.OPEN) {
      throw new BadRequestException('Kỳ đăng ký chưa mở');
    }

    if (duLieu.workType) lich.workType = duLieu.workType;
    if (duLieu.note !== undefined) lich.note = duLieu.note;

    if (duLieu.loaiCa) {
      lich.loaiCa = duLieu.loaiCa;
      if (duLieu.loaiCa !== LoaiCaLam.CUSTOM) {
        // Ca sáng/chiều: dùng giờ mặc định nếu không cung cấp giờ tùy chỉnh
        const def = CA_LAM_VIEC_MAC_DINH[duLieu.loaiCa];
        lich.gioBatDau = duLieu.gioBatDau || def.gioBatDau;
        lich.gioKetThuc = duLieu.gioKetThuc || def.gioKetThuc;
        lich.soPhutDuKien = this.calculateMinutes(
          lich.gioBatDau,
          lich.gioKetThuc,
        );
      } else {
        if (duLieu.gioBatDau) lich.gioBatDau = duLieu.gioBatDau;
        if (duLieu.gioKetThuc) lich.gioKetThuc = duLieu.gioKetThuc;
        lich.soPhutDuKien = this.calculateMinutes(
          lich.gioBatDau,
          lich.gioKetThuc,
        );
      }
    } else {
      // Cập nhật giờ cho ca hiện tại (sáng, chiều hoặc custom)
      if (duLieu.gioBatDau) lich.gioBatDau = duLieu.gioBatDau;
      if (duLieu.gioKetThuc) lich.gioKetThuc = duLieu.gioKetThuc;
      if (duLieu.gioBatDau || duLieu.gioKetThuc) {
        lich.soPhutDuKien = this.calculateMinutes(
          lich.gioBatDau,
          lich.gioKetThuc,
        );
      }
    }

    // Kiểm tra tối thiểu 2 giờ
    if (lich.soPhutDuKien < WORK_SCHEDULE_CONSTANTS.MIN_SHIFT_MINUTES) {
      throw new BadRequestException('Ca làm việc phải tối thiểu 2 giờ');
    }

    return this.khoLich.save(lich);
  }

  async xoa(id: string): Promise<WorkSchedule> {
    const lich = await this.timMot(id);

    if (lich.period.status !== RegistrationPeriodStatus.OPEN) {
      throw new BadRequestException('Kỳ đăng ký chưa mở');
    }

    return this.khoLich.remove(lich);
  }

  async layTrangThaiDangKy(idKy: string): Promise<{
    registered: string[];
    notRegistered: string[];
  }> {
    const nguoiDungDaDangKy = await this.khoLich
      .createQueryBuilder('schedule')
      .select('DISTINCT schedule.userId', 'userId')
      .where('schedule.periodId = :periodId', { periodId: idKy })
      .getRawMany<{ userId: string }>();

    const danhSachIdNguoiDung = nguoiDungDaDangKy.map((r) => r.userId);

    return {
      registered: danhSachIdNguoiDung,
      notRegistered: [],
    };
  }
}
