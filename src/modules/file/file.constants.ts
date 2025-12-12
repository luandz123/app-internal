import { BadRequestException } from '@nestjs/common';
import type { Express } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

export const THU_MUC_TAI_LEN = './uploads';

export const damBaoThuMucTaiLenTonTai = () => {
  if (!fs.existsSync(THU_MUC_TAI_LEN)) {
    fs.mkdirSync(THU_MUC_TAI_LEN, { recursive: true });
  }
};

damBaoThuMucTaiLenTonTai();

const MIME_CHO_PHEP = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const cauHinhMulter = {
  storage: diskStorage({
    destination: THU_MUC_TAI_LEN,
    filename: (
      req: Express.Request,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void,
    ) => {
      const maNgauNhien = uuidv4();
      const ext = extname(file.originalname);
      callback(null, `${maNgauNhien}${ext}`);
    },
  }),
  fileFilter: (
    req: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (MIME_CHO_PHEP.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException('Định dạng tệp không được hỗ trợ'),
        false,
      );
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
};
