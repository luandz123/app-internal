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
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UserService {
  private readonly saltRounds: number;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    configService: ConfigService,
  ) {
    this.saltRounds = configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
  }

  async create(dto: CreateUserDto) {
    await this.assertEmailAvailable(dto.email);
    const passwordHash = await this.hashPassword(dto.password);

    const user = this.userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email.toLowerCase(),
      passwordHash,
      role: dto.role ?? UserRole.STAFF,
      position: dto.position,
    });

    return this.userRepository.save(user);
  }

  findAll() {
    return this.userRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      await this.assertEmailAvailable(dto.email, id);
      user.email = dto.email.toLowerCase();
    }

    if (dto.firstName) {
      user.firstName = dto.firstName;
    }
    if (dto.lastName) {
      user.lastName = dto.lastName;
    }
    if (dto.position !== undefined) {
      user.position = dto.position;
    }
    if (dto.role) {
      user.role = dto.role;
    }
    if (dto.password) {
      user.passwordHash = await this.hashPassword(dto.password);
    }

    return this.userRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return user;
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  private async assertEmailAvailable(email: string, ignoreUserId?: string) {
    const existing = await this.findByEmail(email);
    if (existing && existing.id !== ignoreUserId) {
      throw new ConflictException('Email already in use');
    }
  }

  private hashPassword(plain: string) {
    return bcrypt.hash(plain, this.saltRounds);
  }
}
