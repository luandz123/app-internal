import { BadRequestException, Injectable } from '@nestjs/common';
import type { Express } from 'express';
import { join } from 'path';
import * as fs from 'fs';
import { THU_MUC_TAI_LEN, damBaoThuMucTaiLenTonTai } from './file.constants';

export interface ThongTinTepDaTaiLen {
  tenTep: string;
  tenGoc: string;
  kieuNoiDung: string;
  kichThuoc: number;
  duongDan: string;
}

@Injectable()
export class FileService {
  constructor() {
    damBaoThuMucTaiLenTonTai();
  }

  taoThongTinTep(file: Express.Multer.File): ThongTinTepDaTaiLen {
    return {
      tenTep: file.filename,
      tenGoc: file.originalname,
      kieuNoiDung: file.mimetype,
      kichThuoc: file.size,
      duongDan: this.taoDuongDanCongKhai(file.filename),
    };
  }

  taoThongTinNhieuTep(files: Express.Multer.File[]): ThongTinTepDaTaiLen[] {
    return files.map((file) => this.taoThongTinTep(file));
  }

  layDuongDanTuyetDoi(filename: string): string {
    const duongDan = join(process.cwd(), THU_MUC_TAI_LEN, filename);

    if (!fs.existsSync(duongDan)) {
      throw new BadRequestException('Không tìm thấy tệp');
    }

    return duongDan;
  }

  xoaTep(filename: string): void {
    const duongDan = this.layDuongDanTuyetDoi(filename);
    fs.unlinkSync(duongDan);
  }

  private taoDuongDanCongKhai(filename: string): string {
    return `/files/${filename}`;
  }
}
