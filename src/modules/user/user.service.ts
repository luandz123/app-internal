import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole, UserStatus } from './entities/user.entity';

/**
 * Dịch vụ quản lý người dùng
 * Xử lý tất cả logic liên quan đến người dùng trong hệ thống
 */
@Injectable()
export class UserService {
  private readonly soVongMaHoa: number;

  constructor(
    @InjectRepository(User)
    private readonly khoNguoiDung: Repository<User>,
    dichVuCauHinh: ConfigService,
  ) {
    this.soVongMaHoa = dichVuCauHinh.get<number>('BCRYPT_SALT_ROUNDS', 10);
  }

  /**
   * Tạo người dùng mới
   * @param duLieu - Dữ liệu tạo người dùng
   */
  async taoNguoiDung(duLieu: CreateUserDto): Promise<User> {
    await this.kiemTraEmailTonTai(duLieu.email);
    const matKhauDaMaHoa = await this.maHoaMatKhau(duLieu.password);

    const nguoiDung = this.khoNguoiDung.create({
      firstName: duLieu.firstName,
      lastName: duLieu.lastName,
      email: duLieu.email.toLowerCase(),
      passwordHash: matKhauDaMaHoa,
      role: duLieu.role ?? UserRole.STAFF,
      position: duLieu.position ?? null,
      phone: duLieu.phone !== undefined ? duLieu.phone : null,
      address: duLieu.address !== undefined ? duLieu.address : null,
      baseSalary: typeof duLieu.baseSalary === 'number' ? duLieu.baseSalary : 0,
      annualLeaveDays:
        typeof duLieu.annualLeaveDays === 'number'
          ? duLieu.annualLeaveDays
          : 12,
    });

    return this.khoNguoiDung.save(nguoiDung);
  }

  /**
   * Alias cho phương thức taoNguoiDung (tương thích ngược)
   */
  async create(duLieu: CreateUserDto): Promise<User> {
    return this.taoNguoiDung(duLieu);
  }

  /**
   * Lấy tất cả người dùng
   */
  layTatCa(): Promise<User[]> {
    return this.khoNguoiDung.find({ order: { createdAt: 'DESC' } });
  }

  /**
   * Alias cho layTatCa (tương thích ngược)
   */
  findAll(): Promise<User[]> {
    return this.layTatCa();
  }

  /**
   * Lấy người dùng đang hoạt động
   */
  layNguoiDungHoatDong(): Promise<User[]> {
    return this.khoNguoiDung.find({
      where: { status: UserStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Alias cho layNguoiDungHoatDong (tương thích ngược)
   */
  findActive(): Promise<User[]> {
    return this.layNguoiDungHoatDong();
  }

  /**
   * Tìm người dùng theo ID
   * @param id - Mã người dùng
   * @throws NotFoundException nếu không tìm thấy
   */
  async timTheoId(id: string): Promise<User> {
    const nguoiDung = await this.khoNguoiDung.findOne({ where: { id } });
    if (!nguoiDung) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return nguoiDung;
  }

  /**
   * Alias cho timTheoId (tương thích ngược)
   */
  async findOne(id: string): Promise<User> {
    return this.timTheoId(id);
  }

  /**
   * Cập nhật thông tin người dùng
   * @param id - Mã người dùng
   * @param duLieu - Dữ liệu cập nhật
   */
  async capNhatNguoiDung(id: string, duLieu: UpdateUserDto): Promise<User> {
    const nguoiDung = await this.timTheoId(id);

    // Cập nhật email nếu có thay đổi
    if (duLieu.email && duLieu.email.toLowerCase() !== nguoiDung.email) {
      await this.kiemTraEmailTonTai(duLieu.email, id);
      nguoiDung.email = duLieu.email.toLowerCase();
    }

    // Cập nhật các trường thông tin cơ bản
    if (duLieu.firstName) nguoiDung.firstName = duLieu.firstName;
    if (duLieu.lastName) nguoiDung.lastName = duLieu.lastName;
    if (duLieu.position !== undefined) {
      nguoiDung.position = duLieu.position ?? null;
    }
    if (duLieu.role) nguoiDung.role = duLieu.role;
    if (duLieu.phone !== undefined) {
      nguoiDung.phone = duLieu.phone ?? null;
    }
    if (duLieu.address !== undefined) {
      nguoiDung.address = duLieu.address ?? null;
    }
    if (typeof duLieu.baseSalary === 'number') {
      nguoiDung.baseSalary = duLieu.baseSalary;
    }
    if (typeof duLieu.annualLeaveDays === 'number') {
      nguoiDung.annualLeaveDays = duLieu.annualLeaveDays;
    }
    if (duLieu.status !== undefined) {
      nguoiDung.status = duLieu.status;
    }
    if (duLieu.password) {
      nguoiDung.passwordHash = await this.maHoaMatKhau(duLieu.password);
    }

    return this.khoNguoiDung.save(nguoiDung);
  }

  /**
   * Alias cho phương thức capNhatNguoiDung (tương thích ngược)
   */
  async update(id: string, duLieu: UpdateUserDto): Promise<User> {
    return this.capNhatNguoiDung(id, duLieu);
  }

  /**
   * Đặt lại mật khẩu cho người dùng
   * @param id - Mã người dùng
   * @param matKhauMoi - Mật khẩu mới
   */
  async datLaiMatKhau(id: string, matKhauMoi: string): Promise<User> {
    const nguoiDung = await this.timTheoId(id);
    nguoiDung.passwordHash = await this.maHoaMatKhau(matKhauMoi);
    return this.khoNguoiDung.save(nguoiDung);
  }

  /**
   * Alias cho datLaiMatKhau (tương thích ngược)
   */
  async resetPassword(id: string, matKhauMoi: string): Promise<User> {
    return this.datLaiMatKhau(id, matKhauMoi);
  }

  /**
   * Vô hiệu hóa người dùng
   * @param id - Mã người dùng
   */
  async voHieuHoa(id: string): Promise<User> {
    const nguoiDung = await this.timTheoId(id);
    nguoiDung.status = UserStatus.INACTIVE;
    return this.khoNguoiDung.save(nguoiDung);
  }

  /**
   * Alias cho voHieuHoa (tương thích ngược)
   */
  async deactivate(id: string): Promise<User> {
    return this.voHieuHoa(id);
  }

  /**
   * Kích hoạt lại người dùng
   * @param id - Mã người dùng
   */
  async kichHoat(id: string): Promise<User> {
    const nguoiDung = await this.timTheoId(id);
    nguoiDung.status = UserStatus.ACTIVE;
    return this.khoNguoiDung.save(nguoiDung);
  }

  /**
   * Alias cho kichHoat (tương thích ngược)
   */
  async activate(id: string): Promise<User> {
    return this.kichHoat(id);
  }

  /**
   * Xóa người dùng
   * @param id - Mã người dùng
   */
  async xoaNguoiDung(id: string): Promise<User> {
    const nguoiDung = await this.timTheoId(id);
    await this.khoNguoiDung.remove(nguoiDung);
    return nguoiDung;
  }

  /**
   * Alias cho xoaNguoiDung (tương thích ngược)
   */
  async remove(id: string): Promise<User> {
    return this.xoaNguoiDung(id);
  }

  /**
   * Tìm người dùng theo email
   * @param email - Email cần tìm
   */
  timTheoEmail(email: string): Promise<User | null> {
    return this.khoNguoiDung.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Alias cho timTheoEmail (tương thích ngược)
   */
  findByEmail(email: string): Promise<User | null> {
    return this.timTheoEmail(email);
  }

  /**
   * Lấy số ngày phép còn lại của người dùng
   * @param id - Mã người dùng
   */
  async laySoDuNgayPhep(id: string) {
    const nguoiDung = await this.timTheoId(id);
    return {
      soNgayPhepNam: nguoiDung.annualLeaveDays,
      soNgayDaSuDung: nguoiDung.usedLeaveDays,
      soNgayConLai: nguoiDung.annualLeaveDays - nguoiDung.usedLeaveDays,
      // Giữ tên tiếng Anh để tương thích ngược
      annualLeaveDays: nguoiDung.annualLeaveDays,
      usedLeaveDays: nguoiDung.usedLeaveDays,
      remainingLeaveDays: nguoiDung.annualLeaveDays - nguoiDung.usedLeaveDays,
    };
  }

  /**
   * Alias cho laySoDuNgayPhep (tương thích ngược)
   */
  async getLeaveBalance(id: string) {
    return this.laySoDuNgayPhep(id);
  }

  /**
   * Kiểm tra email đã tồn tại hay chưa
   * @param email - Email cần kiểm tra
   * @param boQuaMaNguoiDung - Bỏ qua user có ID này (dùng khi cập nhật)
   */
  private async kiemTraEmailTonTai(
    email: string,
    boQuaMaNguoiDung?: string,
  ): Promise<void> {
    const daTonTai = await this.timTheoEmail(email);
    if (daTonTai && daTonTai.id !== boQuaMaNguoiDung) {
      throw new ConflictException('Email đã được sử dụng');
    }
  }

  /**
   * Alias cho kiemTraEmailTonTai (tương thích ngược)
   */
  private async assertEmailAvailable(
    email: string,
    boQuaMaNguoiDung?: string,
  ): Promise<void> {
    return this.kiemTraEmailTonTai(email, boQuaMaNguoiDung);
  }

  /**
   * Mã hóa mật khẩu
   * @param matKhauThuong - Mật khẩu dạng plain text
   */
  private maHoaMatKhau(matKhauThuong: string): Promise<string> {
    return bcrypt.hash(matKhauThuong, this.soVongMaHoa);
  }

  /**
   * Alias cho maHoaMatKhau (tương thích ngược)
   */
  private hashPassword(matKhauThuong: string): Promise<string> {
    return this.maHoaMatKhau(matKhauThuong);
  }
}
