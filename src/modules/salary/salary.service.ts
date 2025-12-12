import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { Salary, SalaryStatus } from './entities/salary.entity';
import * as ExcelJS from 'exceljs';

@Injectable()
export class SalaryService {
  constructor(
    @InjectRepository(Salary)
    private readonly salaryRepository: Repository<Salary>,
    private readonly userService: UserService,
  ) {}

  async create(dto: CreateSalaryDto): Promise<Salary> {
    // Kiểm tra bảng lương đã tồn tại cho nhân viên và kỳ này chưa
    const existing = await this.salaryRepository.findOne({
      where: {
        userId: dto.userId,
        year: dto.year,
        month: dto.month,
      },
    });

    if (existing) {
      throw new ConflictException('Đã có bảng lương cho nhân viên và kỳ này');
    }

    // Lấy lương cơ bản của nhân viên nếu client không truyền
    const user = await this.userService.findOne(dto.userId);
    const baseSalary = dto.baseSalary ?? Number(user.baseSalary);

    const salary = this.salaryRepository.create({
      userId: dto.userId,
      year: dto.year,
      month: dto.month,
      baseSalary,
      allowance: dto.allowance ?? 0,
      bonus: dto.bonus ?? 0,
      overtimePay: dto.overtimePay ?? 0,
      deduction: dto.deduction ?? 0,
      penalty: dto.penalty ?? 0,
      insurance: dto.insurance ?? 0,
      tax: dto.tax ?? 0,
      workDays: dto.workDays ?? 22,
      actualWorkDays: dto.actualWorkDays ?? 22,
      leaveDays: dto.leaveDays ?? 0,
      overtimeHours: dto.overtimeHours ?? 0,
      note: dto.note,
    });

    // Tính lại lương thực lĩnh
    salary.netSalary = this.calculateNetSalary(salary);

    return this.salaryRepository.save(salary);
  }

  async findAll(year?: number, month?: number): Promise<Salary[]> {
    const where: Record<string, number> = {};
    if (year) where.year = year;
    if (month) where.month = month;

    return this.salaryRepository.find({
      where,
      relations: ['user'],
      order: { year: 'DESC', month: 'DESC', createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string): Promise<Salary[]> {
    return this.salaryRepository.find({
      where: { userId },
      order: { year: 'DESC', month: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Salary> {
    const salary = await this.salaryRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!salary) {
      throw new NotFoundException('Không tìm thấy bảng lương');
    }
    return salary;
  }

  async findByUserAndPeriod(
    userId: string,
    year: number,
    month: number,
  ): Promise<Salary | null> {
    return this.salaryRepository.findOne({
      where: { userId, year, month },
    });
  }

  async update(id: string, dto: UpdateSalaryDto): Promise<Salary> {
    const salary = await this.findOne(id);

    if (salary.status === SalaryStatus.PAID) {
      throw new BadRequestException('Không thể sửa bảng lương đã chi trả');
    }

    if (dto.baseSalary !== undefined) salary.baseSalary = dto.baseSalary;
    if (dto.allowance !== undefined) salary.allowance = dto.allowance;
    if (dto.bonus !== undefined) salary.bonus = dto.bonus;
    if (dto.overtimePay !== undefined) salary.overtimePay = dto.overtimePay;
    if (dto.deduction !== undefined) salary.deduction = dto.deduction;
    if (dto.penalty !== undefined) salary.penalty = dto.penalty;
    if (dto.insurance !== undefined) salary.insurance = dto.insurance;
    if (dto.tax !== undefined) salary.tax = dto.tax;
    if (dto.workDays !== undefined) salary.workDays = dto.workDays;
    if (dto.actualWorkDays !== undefined)
      salary.actualWorkDays = dto.actualWorkDays;
    if (dto.leaveDays !== undefined) salary.leaveDays = dto.leaveDays;
    if (dto.overtimeHours !== undefined)
      salary.overtimeHours = dto.overtimeHours;
    if (dto.status !== undefined) salary.status = dto.status;
    if (dto.note !== undefined) salary.note = dto.note;

    // Tính lại lương thực lĩnh sau khi cập nhật
    salary.netSalary = this.calculateNetSalary(salary);

    return this.salaryRepository.save(salary);
  }

  async finalize(id: string): Promise<Salary> {
    const salary = await this.findOne(id);
    salary.status = SalaryStatus.FINALIZED;
    return this.salaryRepository.save(salary);
  }

  async markAsPaid(id: string): Promise<Salary> {
    const salary = await this.findOne(id);
    salary.status = SalaryStatus.PAID;
    return this.salaryRepository.save(salary);
  }

  async remove(id: string): Promise<Salary> {
    const salary = await this.findOne(id);
    if (salary.status === SalaryStatus.PAID) {
      throw new BadRequestException('Không thể xóa bảng lương đã chi trả');
    }
    return this.salaryRepository.remove(salary);
  }

  async exportToExcel(year: number, month: number): Promise<Buffer> {
    const salaries = await this.salaryRepository.find({
      where: { year, month },
      relations: ['user'],
      order: { user: { firstName: 'ASC' } },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Luong ${month}/${year}`);

    // Thêm tiêu đề cột
    worksheet.columns = [
      { header: 'STT', key: 'stt', width: 5 },
      { header: 'Họ tên', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Chức vụ', key: 'position', width: 20 },
      { header: 'Lương cơ bản', key: 'baseSalary', width: 15 },
      { header: 'Phụ cấp', key: 'allowance', width: 12 },
      { header: 'Thưởng', key: 'bonus', width: 12 },
      { header: 'OT', key: 'overtimePay', width: 12 },
      { header: 'Giảm trừ', key: 'deduction', width: 12 },
      { header: 'Phạt', key: 'penalty', width: 12 },
      { header: 'Bảo hiểm', key: 'insurance', width: 12 },
      { header: 'Thuế', key: 'tax', width: 12 },
      { header: 'Ngày công', key: 'workDays', width: 10 },
      { header: 'Thực công', key: 'actualWorkDays', width: 10 },
      { header: 'Nghỉ phép', key: 'leaveDays', width: 10 },
      { header: 'Giờ OT', key: 'overtimeHours', width: 10 },
      { header: 'Thực lĩnh', key: 'netSalary', width: 15 },
      { header: 'Trạng thái', key: 'status', width: 12 },
    ];

    // Định dạng hàng tiêu đề
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Đổ dữ liệu từng dòng
    salaries.forEach((salary, index) => {
      worksheet.addRow({
        stt: index + 1,
        name: `${salary.user.firstName} ${salary.user.lastName}`,
        email: salary.user.email,
        position: salary.user.position || '',
        baseSalary: Number(salary.baseSalary),
        allowance: Number(salary.allowance),
        bonus: Number(salary.bonus),
        overtimePay: Number(salary.overtimePay),
        deduction: Number(salary.deduction),
        penalty: Number(salary.penalty),
        insurance: Number(salary.insurance),
        tax: Number(salary.tax),
        workDays: salary.workDays,
        actualWorkDays: salary.actualWorkDays,
        leaveDays: salary.leaveDays,
        overtimeHours: Number(salary.overtimeHours),
        netSalary: Number(salary.netSalary),
        status: salary.status,
      });
    });

    // Định dạng các cột số
    const numberCols = ['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'Q'];
    numberCols.forEach((col) => {
      worksheet.getColumn(col).numFmt = '#,##0';
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private calculateNetSalary(salary: Salary): number {
    const gross =
      Number(salary.baseSalary) +
      Number(salary.allowance) +
      Number(salary.bonus) +
      Number(salary.overtimePay);

    const deductions =
      Number(salary.deduction) +
      Number(salary.penalty) +
      Number(salary.insurance) +
      Number(salary.tax);

    return gross - deductions;
  }
}
