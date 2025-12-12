import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Regulation } from './entities/regulation.entity';
import { RegulationController } from './regulation.controller';
import { RegulationService } from './regulation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Regulation])],
  controllers: [RegulationController],
  providers: [RegulationService],
  exports: [RegulationService],
})
export class RegulationModule {}
