import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
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

@Injectable()
export class DichVuLichLamViec {
  constructor(
    @InjectRepository(WorkSchedule)
    private readonly khoLich: Repository<WorkSchedule>,
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
      const resolvedItems = items.map((item) => {
        let start = item.gioBatDau;
        let end = item.gioKetThuc;
        let breakMins = 0;

        if (item.loaiCa !== LoaiCaLam.CUSTOM) {
          const def = CA_LAM_VIEC_MAC_DINH[item.loaiCa];
          start = def.gioBatDau;
          end = def.gioKetThuc;
          breakMins = def.soPhutNghi;
        } else {
          if (!start || !end)
            throw new BadRequestException(
              'Giờ bắt đầu và kết thúc là bắt buộc cho ca tùy chỉnh',
            );
        }

        const minutes = this.calculateMinutes(start, end) - breakMins;

        if (minutes < WORK_SCHEDULE_CONSTANTS.MIN_SHIFT_MINUTES) {
          throw new BadRequestException(
            `Ca làm việc ngày ${dateStr} phải tối thiểu 2 giờ`,
          );
        }

        return { ...item, start: start, end: end, minutes };
      });

      // Check overlap
      resolvedItems.sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 0; i < resolvedItems.length - 1; i++) {
        if (resolvedItems[i].end > resolvedItems[i + 1].start) {
          throw new BadRequestException(
            `Ca làm việc ngày ${dateStr} bị trùng giờ`,
          );
        }
      }

      for (const item of resolvedItems) {
        danhSachLich.push(
          this.khoLich.create({
            userId: idNguoiDung,
            periodId: duLieu.periodId,
            date: new Date(dateStr),
            workType: item.workType,
            loaiCa: item.loaiCa,
            gioBatDau: item.start,
            gioKetThuc: item.end,
            soPhutDuKien: item.minutes,
            note: item.note,
          }),
        );
      }
    }

    // Delete old schedules for this period
    await this.khoLich.delete({
      userId: idNguoiDung,
      periodId: duLieu.periodId,
    });

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
        const def = CA_LAM_VIEC_MAC_DINH[duLieu.loaiCa];
        lich.gioBatDau = def.gioBatDau;
        lich.gioKetThuc = def.gioKetThuc;
        lich.soPhutDuKien =
          this.calculateMinutes(lich.gioBatDau, lich.gioKetThuc) -
          def.soPhutNghi;
      } else {
        if (duLieu.gioBatDau) lich.gioBatDau = duLieu.gioBatDau;
        if (duLieu.gioKetThuc) lich.gioKetThuc = duLieu.gioKetThuc;
        lich.soPhutDuKien = this.calculateMinutes(
          lich.gioBatDau,
          lich.gioKetThuc,
        );
      }
    } else if (lich.loaiCa === LoaiCaLam.CUSTOM) {
      if (duLieu.gioBatDau) lich.gioBatDau = duLieu.gioBatDau;
      if (duLieu.gioKetThuc) lich.gioKetThuc = duLieu.gioKetThuc;
      lich.soPhutDuKien = this.calculateMinutes(
        lich.gioBatDau,
        lich.gioKetThuc,
      );
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
