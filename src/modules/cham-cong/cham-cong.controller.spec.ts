import { Test, TestingModule } from '@nestjs/testing';
import { ChamCongController } from './cham-cong.controller';
import { ChamCongService } from './cham-cong.service';
import { ChamCong, TrangThaiChamCong } from './entities/cham-cong.entity';
import { User, UserRole, UserStatus } from '../user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

describe('ChamCongController - Controller Chấm công', () => {
  let controller: ChamCongController;
  let dichVuChamCong: jest.Mocked<ChamCongService>;

  // Dữ liệu mẫu
  const nguoiDungMau: User = {
    id: 'uuid-user-123',
    firstName: 'Nguyễn',
    lastName: 'Văn A',
    email: 'nguyenvana@example.com',
    passwordHash: '$2b$10$hashedpassword',
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    position: 'Nhân viên',
    phone: '0123456789',
    address: 'Hà Nội',
    avatar: null,
    baseSalary: 10000000,
    annualLeaveDays: 12,
    usedLeaveDays: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const chamCongMau: Partial<ChamCong> = {
    id: 'uuid-chamcong-123',
    maNguoiDung: nguoiDungMau.id,
    ngay: new Date(),
    thoiGianVao: new Date('2025-01-15T08:30:00'),
    thoiGianRa: null,
    trangThai: TrangThaiChamCong.DA_VAO,
    soPhutLamViec: 0,
    soPhutDiMuon: 0,
    soPhutVeSom: 0,
    soPhutTangCa: 0,
  };

  beforeEach(async () => {
    const mockChamCongService = {
      checkIn: jest.fn(),
      checkOut: jest.fn(),
      getTodayAttendance: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      getMonthlyStats: jest.fn(),
      getDailyReport: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue(''),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChamCongController],
      providers: [
        { provide: ChamCongService, useValue: mockChamCongService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    controller = module.get<ChamCongController>(ChamCongController);
    dichVuChamCong = module.get(ChamCongService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('chamCongVao - Check-in', () => {
    it('nên gọi service check-in với đúng tham số', async () => {
      // Arrange
      const duLieuVao = { viTri: '21.0285,105.8542', ghiChu: 'Check-in' };
      const diaChiIp = '192.168.1.100';
      dichVuChamCong.checkIn.mockResolvedValue(chamCongMau as ChamCong);

      // Act
      const ketQua = await controller.chamCongVao(
        nguoiDungMau,
        duLieuVao,
        diaChiIp,
      );

      // Assert
      expect(dichVuChamCong.checkIn).toHaveBeenCalledWith(
        nguoiDungMau.id,
        duLieuVao,
        diaChiIp,
      );
      expect(ketQua).toEqual(chamCongMau);
    });
  });

  describe('chamCongRa - Check-out', () => {
    it('nên gọi service check-out với đúng tham số', async () => {
      // Arrange
      const duLieuRa = { viTri: '21.0285,105.8542', ghiChu: 'Check-out' };
      const diaChiIp = '192.168.1.100';
      const chamCongDaRa = {
        ...chamCongMau,
        thoiGianRa: new Date(),
        trangThai: TrangThaiChamCong.HOAN_THANH,
      };
      dichVuChamCong.checkOut.mockResolvedValue(chamCongDaRa as ChamCong);

      // Act
      const ketQua = await controller.chamCongRa(
        nguoiDungMau,
        duLieuRa,
        diaChiIp,
      );

      // Assert
      expect(dichVuChamCong.checkOut).toHaveBeenCalledWith(
        nguoiDungMau.id,
        duLieuRa,
        diaChiIp,
      );
      expect(ketQua.trangThai).toBe(TrangThaiChamCong.HOAN_THANH);
    });
  });

  describe('layChamCongHomNay - Lấy chấm công hôm nay', () => {
    it('nên trả về chấm công của hôm nay', async () => {
      // Arrange
      dichVuChamCong.getTodayAttendance.mockResolvedValue(
        chamCongMau as ChamCong,
      );

      // Act
      const ketQua = await controller.layChamCongHomNay(nguoiDungMau);

      // Assert
      expect(dichVuChamCong.getTodayAttendance).toHaveBeenCalledWith(
        nguoiDungMau.id,
      );
      expect(ketQua).toEqual(chamCongMau);
    });

    it('nên trả về null nếu chưa chấm công', async () => {
      // Arrange
      dichVuChamCong.getTodayAttendance.mockResolvedValue(null);

      // Act
      const ketQua = await controller.layChamCongHomNay(nguoiDungMau);

      // Assert
      expect(ketQua).toBeNull();
    });
  });

  describe('layLichSuChamCong - Lấy lịch sử chấm công', () => {
    it('nên trả về danh sách chấm công có phân trang', async () => {
      // Arrange
      const ketQuaPhanTrang = {
        data: [chamCongMau as ChamCong],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      dichVuChamCong.findAll.mockResolvedValue(ketQuaPhanTrang);

      // Act
      const ketQua = await controller.layLichSuChamCong(nguoiDungMau, {
        page: 1,
        limit: 10,
      });

      // Assert
      expect(dichVuChamCong.findAll).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        nguoiDungMau.id,
        false,
      );
      expect(ketQua.data).toHaveLength(1);
    });
  });

  describe('layThongKeThang - Lấy thống kê chấm công theo tháng', () => {
    it('nên trả về thống kê của tháng hiện tại nếu không truyền tham số', async () => {
      // Arrange
      const thongKe = {
        tongSoNgay: 22,
        soNgayDiLam: 20,
        soNgayVang: 2,
        tongPhutDiMuon: 30,
        tongPhutVeSom: 0,
        tongPhutTangCa: 120,
        tongPhutLamViec: 9600,
        trungBinhPhutLamViec: 480,
      };
      dichVuChamCong.getMonthlyStats.mockResolvedValue(thongKe);

      // Act
      const ketQua = await controller.layThongKeThang(
        nguoiDungMau,
        undefined as unknown as number,
        undefined as unknown as number,
      );

      // Assert
      expect(ketQua.tongSoNgay).toBe(22);
      expect(ketQua.soNgayDiLam).toBe(20);
    });

    it('nên sử dụng tháng/năm được truyền vào', async () => {
      // Arrange
      const thongKe = {
        tongSoNgay: 20,
        soNgayDiLam: 18,
        soNgayVang: 2,
        tongPhutDiMuon: 0,
        tongPhutVeSom: 0,
        tongPhutTangCa: 0,
        tongPhutLamViec: 8640,
        trungBinhPhutLamViec: 480,
      };
      dichVuChamCong.getMonthlyStats.mockResolvedValue(thongKe);

      // Act
      await controller.layThongKeThang(nguoiDungMau, 6, 2025);

      // Assert
      expect(dichVuChamCong.getMonthlyStats).toHaveBeenCalledWith(
        nguoiDungMau.id,
        6,
        2025,
      );
    });
  });

  describe('layTatCa - Lấy tất cả chấm công (Admin)', () => {
    it('nên trả về danh sách tất cả chấm công', async () => {
      // Arrange
      const ketQuaPhanTrang = {
        data: [chamCongMau as ChamCong],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      dichVuChamCong.findAll.mockResolvedValue(ketQuaPhanTrang);

      // Act
      const ketQua = await controller.layTatCa({ page: 1, limit: 10 });

      // Assert
      expect(dichVuChamCong.findAll).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        undefined,
        true,
      );
      expect(ketQua.data).toHaveLength(1);
    });
  });

  describe('layBaoCaoTheoNgay - Lấy báo cáo theo ngày (Admin)', () => {
    it('nên trả về báo cáo chấm công của ngày được chỉ định', async () => {
      // Arrange
      const danhSachChamCong = [chamCongMau as ChamCong];
      dichVuChamCong.getDailyReport.mockResolvedValue(danhSachChamCong);

      // Act
      const ketQua = await controller.layBaoCaoTheoNgay('2025-01-15');

      // Assert
      expect(ketQua).toHaveLength(1);
    });

    it('nên sử dụng ngày hiện tại nếu không truyền tham số', async () => {
      // Arrange
      dichVuChamCong.getDailyReport.mockResolvedValue([]);

      // Act
      await controller.layBaoCaoTheoNgay(undefined);

      // Assert
      expect(dichVuChamCong.getDailyReport).toHaveBeenCalled();
    });
  });

  describe('layChiTiet - Lấy chi tiết chấm công (Admin)', () => {
    it('nên trả về chi tiết bản ghi chấm công', async () => {
      // Arrange
      dichVuChamCong.findOne.mockResolvedValue(chamCongMau as ChamCong);

      // Act
      const ketQua = await controller.layChiTiet('uuid-chamcong-123');

      // Assert
      expect(dichVuChamCong.findOne).toHaveBeenCalledWith('uuid-chamcong-123');
      expect(ketQua).toEqual(chamCongMau);
    });
  });
});
