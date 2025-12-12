import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';

/**
 * Kết quả xác thực
 */
export interface KetQuaXacThuc {
  accessToken: string;
  user: User;
}

// Giữ lại tên cũ để tương thích ngược
export type AuthResult = KetQuaXacThuc;

/**
 * Dịch vụ xác thực người dùng
 * Xử lý đăng ký, đăng nhập và tạo token JWT
 */
@Injectable()
export class AuthService {
  private readonly thoiGianHetHanToken: number;

  constructor(
    private readonly dichVuNguoiDung: UserService,
    private readonly dichVuJwt: JwtService,
    dichVuCauHinh: ConfigService,
  ) {
    this.thoiGianHetHanToken = dichVuCauHinh.get<number>(
      'JWT_ACCESS_TTL',
      3600,
    );
  }

  /**
   * Đăng ký tài khoản mới
   * @param duLieu - Thông tin đăng ký
   */
  async dangKy(duLieu: SignupDto): Promise<KetQuaXacThuc> {
    const nguoiDung = await this.dichVuNguoiDung.taoNguoiDung({
      ...duLieu,
      role: UserRole.STAFF,
    });
    return this.taoKetQuaXacThuc(nguoiDung);
  }

  /**
   * Alias cho dangKy (tương thích ngược)
   */
  async signup(duLieu: SignupDto): Promise<KetQuaXacThuc> {
    return this.dangKy(duLieu);
  }

  /**
   * Đăng nhập
   * @param duLieu - Thông tin đăng nhập
   */
  async dangNhap(duLieu: SigninDto): Promise<KetQuaXacThuc> {
    const nguoiDung = await this.dichVuNguoiDung.timTheoEmail(duLieu.email);
    if (!nguoiDung) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    const matKhauKhop = await bcrypt.compare(
      duLieu.password,
      nguoiDung.passwordHash,
    );
    if (!matKhauKhop) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    return this.taoKetQuaXacThuc(nguoiDung);
  }

  /**
   * Alias cho dangNhap (tương thích ngược)
   */
  async signin(duLieu: SigninDto): Promise<KetQuaXacThuc> {
    return this.dangNhap(duLieu);
  }

  /**
   * Tạo kết quả xác thực với token JWT
   * @param nguoiDung - Thông tin người dùng
   */
  private async taoKetQuaXacThuc(nguoiDung: User): Promise<KetQuaXacThuc> {
    const payload = {
      sub: nguoiDung.id,
      email: nguoiDung.email,
      role: nguoiDung.role,
    };
    const accessToken = await this.dichVuJwt.signAsync(payload, {
      expiresIn: `${this.thoiGianHetHanToken}s`,
    });

    return { accessToken, user: nguoiDung };
  }

  /**
   * Alias cho taoKetQuaXacThuc (tương thích ngược)
   */
  private async buildAuthResult(nguoiDung: User): Promise<KetQuaXacThuc> {
    return this.taoKetQuaXacThuc(nguoiDung);
  }
}
