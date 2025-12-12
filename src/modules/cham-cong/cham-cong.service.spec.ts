import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChamCongService } from './cham-cong.service';
import { ChamCong, TrangThaiChamCong } from './entities/cham-cong.entity';

describe('ChamCongService - Dịch vụ Chấm công', () => {
  let dichVuChamCong: ChamCongService;
  let khoChamCong: jest.Mocked<Repository<ChamCong>>;

  // Dữ liệu mẫu cho test
  const maNguoiDung = 'uuid-user-123';
  const ngayHomNay = new Date();
  ngayHomNay.setHours(0, 0, 0, 0);

  const chamCongMau: ChamCong = {
    id: 'uuid-chamcong-123',
    maNguoiDung,
    ngay: ngayHomNay,
    thoiGianVao: new Date('2025-01-15T08:30:00'),
    thoiGianRa: null,
    trangThai: TrangThaiChamCong.DA_VAO,
    soPhutLamViec: 0,
    soPhutDiMuon: 0,
    soPhutVeSom: 0,
    soPhutTangCa: 0,
    ipVao: '192.168.1.1',
    ipRa: null,
    viTriVao: null,
    viTriRa: null,
    ghiChu: null,
    ngayTao: new Date(),
    ngayCapNhat: new Date(),
    nguoiDung: null as any,
  };

  beforeEach(async () => {
    // Tạo mock cho repository
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      })),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChamCongService,
        { provide: getRepositoryToken(ChamCong), useValue: mockRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    dichVuChamCong = module.get<ChamCongService>(ChamCongService);
    khoChamCong = module.get(getRepositoryToken(ChamCong));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkIn - Chấm công vào', () => {
    const duLieuChamCongVao = {
      viTri: '21.0285,105.8542',
      ghiChu: 'Check-in từ văn phòng',
    };
    const diaChiIp = '192.168.1.100';

    it('nên tạo bản ghi chấm công mới khi chưa check-in', async () => {
      // Arrange
      khoChamCong.findOne.mockResolvedValue(null);
      khoChamCong.create.mockReturnValue(chamCongMau);
      khoChamCong.save.mockResolvedValue(chamCongMau);

      // Act
      const ketQua = await dichVuChamCong.checkIn(
        maNguoiDung,
        duLieuChamCongVao,
        diaChiIp,
      );

      // Assert
      expect(khoChamCong.create).toHaveBeenCalled();
      expect(khoChamCong.save).toHaveBeenCalled();
      expect(ketQua).toEqual(chamCongMau);
    });

    it('nên ném lỗi khi đã check-in rồi', async () => {
      // Arrange
      khoChamCong.findOne.mockResolvedValue(chamCongMau);

      // Act & Assert
      await expect(
        dichVuChamCong.checkIn(maNguoiDung, duLieuChamCongVao, diaChiIp),
      ).rejects.toThrow(BadRequestException);
      await expect(
        dichVuChamCong.checkIn(maNguoiDung, duLieuChamCongVao, diaChiIp),
      ).rejects.toThrow('Bạn đã check-in hôm nay rồi');
    });

    it('nên lưu địa chỉ IP khi check-in', async () => {
      // Arrange
      khoChamCong.findOne.mockResolvedValue(null);
      khoChamCong.create.mockReturnValue(chamCongMau);
      khoChamCong.save.mockResolvedValue(chamCongMau);

      // Act
      await dichVuChamCong.checkIn(maNguoiDung, duLieuChamCongVao, diaChiIp);

      // Assert
      expect(khoChamCong.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ipVao: diaChiIp,
        }),
      );
    });

    it('nên lưu vị trí GPS nếu có', async () => {
      // Arrange
      khoChamCong.findOne.mockResolvedValue(null);
      khoChamCong.create.mockReturnValue(chamCongMau);
      khoChamCong.save.mockResolvedValue(chamCongMau);

      // Act
      await dichVuChamCong.checkIn(maNguoiDung, duLieuChamCongVao, diaChiIp);

      // Assert
      expect(khoChamCong.create).toHaveBeenCalledWith(
        expect.objectContaining({
          viTriVao: duLieuChamCongVao.viTri,
        }),
      );
    });
  });

  describe('checkOut - Chấm công ra', () => {
    const duLieuChamCongRa = {
      viTri: '21.0285,105.8542',
      ghiChu: 'Check-out cuối ngày',
    };
    const diaChiIp = '192.168.1.100';

    it('nên cập nhật bản ghi chấm công khi check-out', async () => {
      // Arrange
      const chamCongDaVao = { ...chamCongMau, thoiGianRa: null };
      const chamCongDaRa = {
        ...chamCongMau,
        thoiGianRa: new Date(),
        trangThai: TrangThaiChamCong.HOAN_THANH,
      };

      khoChamCong.findOne.mockResolvedValue(chamCongDaVao);
      khoChamCong.save.mockResolvedValue(chamCongDaRa);

      // Act
      const ketQua = await dichVuChamCong.checkOut(
        maNguoiDung,
        duLieuChamCongRa,
        diaChiIp,
      );

      // Assert
      expect(khoChamCong.save).toHaveBeenCalled();
      expect(ketQua.trangThai).toBe(TrangThaiChamCong.HOAN_THANH);
    });

    it('nên ném lỗi khi chưa check-in', async () => {
      // Arrange
      khoChamCong.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        dichVuChamCong.checkOut(maNguoiDung, duLieuChamCongRa, diaChiIp),
      ).rejects.toThrow(BadRequestException);
      await expect(
        dichVuChamCong.checkOut(maNguoiDung, duLieuChamCongRa, diaChiIp),
      ).rejects.toThrow('Bạn chưa check-in hôm nay');
    });

    it('nên ném lỗi khi đã check-out rồi', async () => {
      // Arrange
      const chamCongDaCheckOut = {
        ...chamCongMau,
        thoiGianRa: new Date(),
      };
      khoChamCong.findOne.mockResolvedValue(chamCongDaCheckOut);

      // Act & Assert
      await expect(
        dichVuChamCong.checkOut(maNguoiDung, duLieuChamCongRa, diaChiIp),
      ).rejects.toThrow(BadRequestException);
      await expect(
        dichVuChamCong.checkOut(maNguoiDung, duLieuChamCongRa, diaChiIp),
      ).rejects.toThrow('Bạn đã check-out hôm nay rồi');
    });
  });

  describe('getTodayAttendance - Lấy chấm công hôm nay', () => {
    it('nên trả về bản ghi chấm công của hôm nay', async () => {
      // Arrange
      khoChamCong.findOne.mockResolvedValue(chamCongMau);

      // Act
      const ketQua = await dichVuChamCong.getTodayAttendance(maNguoiDung);

      // Assert
      expect(ketQua).toEqual(chamCongMau);
    });

    it('nên trả về null nếu chưa có chấm công hôm nay', async () => {
      // Arrange
      khoChamCong.findOne.mockResolvedValue(null);

      // Act
      const ketQua = await dichVuChamCong.getTodayAttendance(maNguoiDung);

      // Assert
      expect(ketQua).toBeNull();
    });
  });

  describe('findOne - Tìm chấm công theo ID', () => {
    it('nên trả về bản ghi chấm công khi tìm thấy', async () => {
      // Arrange
      khoChamCong.findOne.mockResolvedValue(chamCongMau);

      // Act
      const ketQua = await dichVuChamCong.findOne('uuid-chamcong-123');

      // Assert
      expect(khoChamCong.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-chamcong-123' },
        relations: ['nguoiDung'],
      });
      expect(ketQua).toEqual(chamCongMau);
    });

    it('nên ném lỗi NotFoundException khi không tìm thấy', async () => {
      // Arrange
      khoChamCong.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        dichVuChamCong.findOne('uuid-khong-ton-tai'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        dichVuChamCong.findOne('uuid-khong-ton-tai'),
      ).rejects.toThrow('Không tìm thấy bản ghi chấm công');
    });
  });

  describe('findAll - Lấy danh sách chấm công', () => {
    it('nên trả về danh sách có phân trang', async () => {
      // Arrange
      const danhSachChamCong = [chamCongMau];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([danhSachChamCong, 1]),
      };
      khoChamCong.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const ketQua = await dichVuChamCong.findAll(
        { page: 1, limit: 10 },
        maNguoiDung,
        false,
      );

      // Assert
      expect(ketQua.data).toEqual(danhSachChamCong);
      expect(ketQua.meta.total).toBe(1);
      expect(ketQua.meta.page).toBe(1);
    });

    it('nên lọc theo ngày khi admin xem', async () => {
      // Arrange
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      khoChamCong.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      await dichVuChamCong.findAll(
        {
          page: 1,
          limit: 10,
          ngayBatDau: '2025-01-01',
          ngayKetThuc: '2025-01-31',
        },
        undefined,
        true,
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('getMonthlyStats - Thống kê chấm công theo tháng', () => {
    it('nên tính toán thống kê chính xác', async () => {
      // Arrange
      const danhSachChamCong = [
        {
          ...chamCongMau,
          trangThai: TrangThaiChamCong.HOAN_THANH,
          soPhutLamViec: 480,
          soPhutDiMuon: 10,
          soPhutVeSom: 5,
          soPhutTangCa: 30,
        },
        {
          ...chamCongMau,
          id: 'uuid-2',
          trangThai: TrangThaiChamCong.HOAN_THANH,
          soPhutLamViec: 500,
          soPhutDiMuon: 0,
          soPhutVeSom: 0,
          soPhutTangCa: 60,
        },
      ];
      khoChamCong.find.mockResolvedValue(danhSachChamCong as any);

      // Act
      const ketQua = await dichVuChamCong.getMonthlyStats(maNguoiDung, 1, 2025);

      // Assert
      expect(ketQua.tongSoNgay).toBe(2);
      expect(ketQua.soNgayDiLam).toBe(2);
      expect(ketQua.tongPhutDiMuon).toBe(10);
      expect(ketQua.tongPhutVeSom).toBe(5);
      expect(ketQua.tongPhutTangCa).toBe(90);
      expect(ketQua.tongPhutLamViec).toBe(980);
      expect(ketQua.trungBinhPhutLamViec).toBe(490);
    });

    it('nên trả về 0 khi không có ngày làm việc', async () => {
      // Arrange
      khoChamCong.find.mockResolvedValue([]);

      // Act
      const ketQua = await dichVuChamCong.getMonthlyStats(maNguoiDung, 1, 2025);

      // Assert
      expect(ketQua.tongSoNgay).toBe(0);
      expect(ketQua.soNgayDiLam).toBe(0);
      expect(ketQua.trungBinhPhutLamViec).toBe(0);
    });
  });

  describe('getDailyReport - Báo cáo chấm công theo ngày', () => {
    it('nên trả về danh sách chấm công của tất cả nhân viên trong ngày', async () => {
      // Arrange
      const danhSachChamCong = [chamCongMau];
      khoChamCong.find.mockResolvedValue(danhSachChamCong);

      // Act
      const ketQua = await dichVuChamCong.getDailyReport(ngayHomNay);

      // Assert
      expect(khoChamCong.find).toHaveBeenCalledWith({
        where: { ngay: ngayHomNay },
        relations: ['nguoiDung'],
        order: { thoiGianVao: 'ASC' },
      });
      expect(ketQua).toEqual(danhSachChamCong);
    });
  });

  describe('markAbsentForDate - Đánh dấu vắng mặt', () => {
    it('nên tạo bản ghi vắng mặt cho các nhân viên chưa check-in', async () => {
      // Arrange
      const danhSachMaNguoiDung = ['user-1', 'user-2'];
      khoChamCong.findOne.mockResolvedValue(null); // Chưa có bản ghi
      khoChamCong.create.mockReturnValue({
        ...chamCongMau,
        trangThai: TrangThaiChamCong.VANG_MAT,
      });
      khoChamCong.save.mockResolvedValue({
        ...chamCongMau,
        trangThai: TrangThaiChamCong.VANG_MAT,
      });

      // Act
      await dichVuChamCong.markAbsentForDate(ngayHomNay, danhSachMaNguoiDung);

      // Assert
      expect(khoChamCong.create).toHaveBeenCalledTimes(2);
      expect(khoChamCong.save).toHaveBeenCalledTimes(2);
    });

    it('không nên tạo bản ghi nếu đã tồn tại', async () => {
      // Arrange
      const danhSachMaNguoiDung = ['user-1'];
      khoChamCong.findOne.mockResolvedValue(chamCongMau); // Đã có bản ghi

      // Act
      await dichVuChamCong.markAbsentForDate(ngayHomNay, danhSachMaNguoiDung);

      // Assert
      expect(khoChamCong.create).not.toHaveBeenCalled();
      expect(khoChamCong.save).not.toHaveBeenCalled();
    });
  });
});
