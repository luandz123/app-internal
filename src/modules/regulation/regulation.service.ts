import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRegulationDto } from './dto/create-regulation.dto';
import { UpdateRegulationDto } from './dto/update-regulation.dto';
import { Regulation } from './entities/regulation.entity';

@Injectable()
export class RegulationService {
  constructor(
    @InjectRepository(Regulation)
    private readonly regulationRepository: Repository<Regulation>,
  ) {}

  async create(dto: CreateRegulationDto): Promise<Regulation> {
    const regulation = this.regulationRepository.create({
      title: dto.title,
      content: dto.content,
      order: dto.order ?? 0,
      category: dto.category,
      isActive: dto.isActive ?? true,
    });
    return this.regulationRepository.save(regulation);
  }

  findAll(): Promise<Regulation[]> {
    return this.regulationRepository.find({
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  findActive(): Promise<Regulation[]> {
    return this.regulationRepository.find({
      where: { isActive: true },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  findByCategory(category: string): Promise<Regulation[]> {
    return this.regulationRepository.find({
      where: { category, isActive: true },
      order: { order: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Regulation> {
    const regulation = await this.regulationRepository.findOne({
      where: { id },
    });
    if (!regulation) {
      throw new NotFoundException('Không tìm thấy quy định');
    }
    return regulation;
  }

  async update(id: string, dto: UpdateRegulationDto): Promise<Regulation> {
    const regulation = await this.findOne(id);

    if (dto.title) regulation.title = dto.title;
    if (dto.content) regulation.content = dto.content;
    if (dto.order !== undefined) regulation.order = dto.order;
    if (dto.category !== undefined) regulation.category = dto.category;
    if (dto.isActive !== undefined) regulation.isActive = dto.isActive;

    return this.regulationRepository.save(regulation);
  }

  async remove(id: string): Promise<Regulation> {
    const regulation = await this.findOne(id);
    return this.regulationRepository.remove(regulation);
  }
}
