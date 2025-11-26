import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';

export interface AuthResult {
  accessToken: string;
  user: User;
}

@Injectable()
export class AuthService {
  private readonly accessTtl: number;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.accessTtl = configService.get<number>('JWT_ACCESS_TTL', 3600);
  }

  async signup(dto: SignupDto): Promise<AuthResult> {
    const user = await this.userService.create({
      ...dto,
      role: UserRole.STAFF,
    });
    return this.buildAuthResult(user);
  }

  async signin(dto: SigninDto): Promise<AuthResult> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResult(user);
  }

  private async buildAuthResult(user: User): Promise<AuthResult> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: `${this.accessTtl}s`,
    });

    return { accessToken, user };
  }
}
