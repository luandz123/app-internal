import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChamCongController } from './cham-cong.controller';
import { ChamCongService } from './cham-cong.service';
import { ChamCong } from './entities/cham-cong.entity';
import { DanhSachIpGuard } from './guards/danh-sach-ip.guard';

@Module({
  imports: [TypeOrmModule.forFeature([ChamCong])],
  controllers: [ChamCongController],
  providers: [ChamCongService, DanhSachIpGuard],
  exports: [ChamCongService],
})
export class ChamCongModule {}
