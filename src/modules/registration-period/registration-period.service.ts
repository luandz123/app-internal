import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRegistrationPeriodDto } from './dto/create-registration-period.dto';
import { UpdateRegistrationPeriodDto } from './dto/update-registration-period.dto';
import {
  RegistrationPeriod,
  RegistrationPeriodStatus,
} from './entities/registration-period.entity';

@Injectable()
export class RegistrationPeriodService {
  constructor(
    @InjectRepository(RegistrationPeriod)
    private readonly periodRepository: Repository<RegistrationPeriod>,
  ) {}

  async create(dto: CreateRegistrationPeriodDto): Promise<RegistrationPeriod> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const deadline = new Date(dto.registrationDeadline);

    if (startDate >= endDate) {
      throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
    }

    if (deadline <= startDate) {
      throw new BadRequestException(
        'Hạn đăng ký phải diễn ra sau ngày bắt đầu',
      );
    }

    const period = this.periodRepository.create({
      name: dto.name,
      description: dto.description,
      type: dto.type,
      startDate,
      endDate,
      registrationDeadline: deadline,
    });

    return this.periodRepository.save(period);
  }

  findAll(): Promise<RegistrationPeriod[]> {
    return this.periodRepository.find({
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<RegistrationPeriod> {
    const period = await this.periodRepository.findOne({ where: { id } });
    if (!period) {
      throw new NotFoundException('Không tìm thấy kỳ đăng ký');
    }
    return period;
  }

  findActive(): Promise<RegistrationPeriod[]> {
    return this.periodRepository.find({
      where: { status: RegistrationPeriodStatus.OPEN },
      order: { startDate: 'ASC' },
    });
  }

  async update(
    id: string,
    dto: UpdateRegistrationPeriodDto,
  ): Promise<RegistrationPeriod> {
    const period = await this.findOne(id);

    if (dto.name) period.name = dto.name;
    if (dto.description !== undefined) period.description = dto.description;
    if (dto.type) period.type = dto.type;
    if (dto.startDate) period.startDate = new Date(dto.startDate);
    if (dto.endDate) period.endDate = new Date(dto.endDate);
    if (dto.registrationDeadline)
      period.registrationDeadline = new Date(dto.registrationDeadline);
    if (dto.status) period.status = dto.status;

    return this.periodRepository.save(period);
  }

  async lock(id: string): Promise<RegistrationPeriod> {
    const period = await this.findOne(id);
    period.status = RegistrationPeriodStatus.LOCKED;
    return this.periodRepository.save(period);
  }

  async close(id: string): Promise<RegistrationPeriod> {
    const period = await this.findOne(id);
    period.status = RegistrationPeriodStatus.CLOSED;
    return this.periodRepository.save(period);
  }

  async remove(id: string): Promise<RegistrationPeriod> {
    const period = await this.findOne(id);
    return this.periodRepository.remove(period);
  }
}
