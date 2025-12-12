import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FileService } from './file.service';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs');

// Mock file.constants để tránh lỗi uuid
jest.mock('./file.constants', () => ({
  THU_MUC_TAI_LEN: './uploads',
  damBaoThuMucTaiLenTonTai: jest.fn(),
  cauHinhLuuTru: {
    storage: {},
    fileFilter: jest.fn(),
  },
}));

describe('FileService - Dịch vụ Tệp', () => {
  let dichVu: FileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileService],
    }).compile();

    dichVu = module.get<FileService>(FileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('taoThongTinTep - Tạo thông tin tệp', () => {
    it('nên trả về thông tin tệp đúng định dạng', () => {
      // Arrange
      const tepMau = {
        filename: 'anh-123.jpg',
        originalname: 'hinh-dai-dien.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      // Act
      const ketQua = dichVu.taoThongTinTep(tepMau);

      // Assert
      expect(ketQua.tenTep).toBe('anh-123.jpg');
      expect(ketQua.tenGoc).toBe('hinh-dai-dien.jpg');
      expect(ketQua.kieuNoiDung).toBe('image/jpeg');
      expect(ketQua.kichThuoc).toBe(1024);
      expect(ketQua.duongDan).toBe('/files/anh-123.jpg');
    });
  });

  describe('taoThongTinNhieuTep - Tạo thông tin nhiều tệp', () => {
    it('nên trả về danh sách thông tin các tệp', () => {
      // Arrange
      const danhSachTep = [
        {
          filename: 'anh-1.jpg',
          originalname: 'anh-1.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
        },
        {
          filename: 'anh-2.png',
          originalname: 'anh-2.png',
          mimetype: 'image/png',
          size: 2048,
        },
      ] as Express.Multer.File[];

      // Act
      const ketQua = dichVu.taoThongTinNhieuTep(danhSachTep);

      // Assert
      expect(ketQua).toHaveLength(2);
      expect(ketQua[0]?.tenTep).toBe('anh-1.jpg');
      expect(ketQua[1]?.tenTep).toBe('anh-2.png');
    });
  });

  describe('layDuongDanTuyetDoi - Lấy đường dẫn tuyệt đối', () => {
    it('nên trả về đường dẫn nếu tệp tồn tại', () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Act
      const ketQua = dichVu.layDuongDanTuyetDoi('anh-123.jpg');

      // Assert
      expect(ketQua).toContain('anh-123.jpg');
    });

    it('nên ném lỗi nếu tệp không tồn tại', () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Act & Assert
      expect(() => dichVu.layDuongDanTuyetDoi('khong-ton-tai.jpg')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('xoaTep - Xóa tệp', () => {
    it('nên xóa tệp thành công', () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);

      // Act
      dichVu.xoaTep('anh-123.jpg');

      // Assert
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('nên ném lỗi nếu tệp không tồn tại', () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Act & Assert
      expect(() => dichVu.xoaTep('khong-ton-tai.jpg')).toThrow(
        BadRequestException,
      );
    });
  });
});
