import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { RegistrationPeriodService } from '../registration-period/registration-period.service';
import { RegistrationPeriodStatus } from '../registration-period/entities/registration-period.entity';
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-work-schedule.dto';
import { WorkSchedule } from './entities/work-schedule.entity';

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

    // Kiểm tra kỳ đăng ký đã mở chưa
    if (ky.status !== RegistrationPeriodStatus.OPEN) {
      throw new BadRequestException('Kỳ đăng ký chưa mở');
    }

    // Kiểm tra đã quá hạn đăng ký hay chưa
    if (new Date() > ky.registrationDeadline) {
      throw new BadRequestException('Đã quá hạn đăng ký');
    }

    // Đảm bảo các ngày nằm trong phạm vi kỳ đăng ký
    for (const muc of duLieu.schedules) {
      const ngay = new Date(muc.date);
      if (ngay < ky.startDate || ngay > ky.endDate) {
        throw new BadRequestException(
          `Ngày ${muc.date} không nằm trong kỳ đăng ký`,
        );
      }
    }

    // Xóa các lịch cũ của người dùng trong kỳ này để ghi đè
    await this.khoLich.delete({
      userId: idNguoiDung,
      periodId: duLieu.periodId,
    });

    // Tạo danh sách lịch làm việc mới
    const danhSachLich = duLieu.schedules.map((muc) =>
      this.khoLich.create({
        userId: idNguoiDung,
        periodId: duLieu.periodId,
        date: new Date(muc.date),
        workType: muc.workType,
        note: muc.note,
      }),
    );

    return this.khoLich.save(danhSachLich);
  }

  async timTheoNguoiDung(idNguoiDung: string): Promise<WorkSchedule[]> {
    return this.khoLich.find({
      where: { userId: idNguoiDung },
      relations: ['period'],
      order: { date: 'ASC' },
    });
  }

  async timTheoNguoiDungVaKy(
    idNguoiDung: string,
    idKy: string,
  ): Promise<WorkSchedule[]> {
    return this.khoLich.find({
      where: { userId: idNguoiDung, periodId: idKy },
      order: { date: 'ASC' },
    });
  }

  async timTheoKy(idKy: string): Promise<WorkSchedule[]> {
    return this.khoLich.find({
      where: { periodId: idKy },
      relations: ['user'],
      order: { date: 'ASC' },
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
      order: { date: 'ASC' },
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

    // Kiểm tra kỳ đăng ký còn mở không trước khi cập nhật
    if (lich.period.status !== RegistrationPeriodStatus.OPEN) {
      throw new BadRequestException('Kỳ đăng ký chưa mở');
    }

    if (duLieu.workType) lich.workType = duLieu.workType;
    if (duLieu.note !== undefined) lich.note = duLieu.note;

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
      notRegistered: [], // Cần join với bảng người dùng để lấy danh sách này
    };
  }
}
