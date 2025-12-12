import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { RegulationService } from './regulation.service';
import { Regulation } from './entities/regulation.entity';

describe('RegulationService - Dịch vụ Quy định', () => {
  let dichVu: RegulationService;
  let khoQuyDinh: jest.Mocked<Repository<Regulation>>;

  // Dữ liệu mẫu
  const quyDinhMau: Partial<Regulation> = {
    id: 'uuid-quydinh-123',
    title: 'Quy định về giờ làm việc',
    content: 'Nhân viên cần đến công ty trước 8h30 sáng.',
    order: 1,
    category: 'attendance',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegulationService,
        {
          provide: getRepositoryToken(Regulation),
          useValue: { ...mockRepository },
        },
      ],
    }).compile();

    dichVu = module.get<RegulationService>(RegulationService);
    khoQuyDinh = module.get(getRepositoryToken(Regulation));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create - Tạo quy định', () => {
    it('nên tạo quy định mới thành công', async () => {
      // Arrange
      const duLieuTao = {
        title: 'Quy định mới',
        content: 'Nội dung quy định',
        category: 'general',
      };
      khoQuyDinh.create.mockReturnValue(quyDinhMau as Regulation);
      khoQuyDinh.save.mockResolvedValue(quyDinhMau as Regulation);

      // Act
      const ketQua = await dichVu.create(duLieuTao);

      // Assert
      expect(khoQuyDinh.create).toHaveBeenCalled();
      expect(khoQuyDinh.save).toHaveBeenCalled();
      expect(ketQua.title).toBe('Quy định về giờ làm việc');
    });

    it('nên sử dụng giá trị mặc định cho order và isActive', async () => {
      // Arrange
      const duLieuTao = {
        title: 'Quy định',
        content: 'Nội dung',
      };
      khoQuyDinh.create.mockReturnValue(quyDinhMau as Regulation);
      khoQuyDinh.save.mockResolvedValue(quyDinhMau as Regulation);

      // Act
      await dichVu.create(duLieuTao);

      // Assert
      expect(khoQuyDinh.create).toHaveBeenCalledWith(
        expect.objectContaining({
          order: 0,
          isActive: true,
        }),
      );
    });
  });

  describe('findAll - Tìm tất cả quy định', () => {
    it('nên trả về danh sách tất cả quy định', async () => {
      // Arrange
      khoQuyDinh.find.mockResolvedValue([quyDinhMau as Regulation]);

      // Act
      const ketQua = await dichVu.findAll();

      // Assert
      expect(ketQua).toHaveLength(1);
      expect(khoQuyDinh.find).toHaveBeenCalled();
    });
  });

  describe('findActive - Tìm quy định đang hoạt động', () => {
    it('nên chỉ trả về quy định có isActive = true', async () => {
      // Arrange
      khoQuyDinh.find.mockResolvedValue([quyDinhMau as Regulation]);

      // Act
      const ketQua = await dichVu.findActive();

      // Assert
      expect(ketQua).toHaveLength(1);
      expect(ketQua[0]?.isActive).toBe(true);
    });
  });

  describe('findByCategory - Tìm theo danh mục', () => {
    it('nên trả về quy định theo danh mục', async () => {
      // Arrange
      khoQuyDinh.find.mockResolvedValue([quyDinhMau as Regulation]);

      // Act
      const ketQua = await dichVu.findByCategory('attendance');

      // Assert
      expect(ketQua).toHaveLength(1);
    });
  });

  describe('findOne - Tìm một quy định', () => {
    it('nên trả về quy định nếu tồn tại', async () => {
      // Arrange
      khoQuyDinh.findOne.mockResolvedValue(quyDinhMau as Regulation);

      // Act
      const ketQua = await dichVu.findOne('uuid-quydinh-123');

      // Assert
      expect(ketQua).toEqual(quyDinhMau);
    });

    it('nên ném lỗi nếu không tìm thấy', async () => {
      // Arrange
      khoQuyDinh.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(dichVu.findOne('uuid-khong-ton-tai')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update - Cập nhật quy định', () => {
    it('nên cập nhật quy định thành công', async () => {
      // Arrange
      khoQuyDinh.findOne.mockResolvedValue(quyDinhMau as Regulation);
      const quyDinhCapNhat = { ...quyDinhMau, title: 'Tiêu đề mới' };
      khoQuyDinh.save.mockResolvedValue(quyDinhCapNhat as Regulation);

      // Act
      const ketQua = await dichVu.update('uuid-quydinh-123', {
        title: 'Tiêu đề mới',
      });

      // Assert
      expect(ketQua.title).toBe('Tiêu đề mới');
    });
  });

  describe('remove - Xóa quy định', () => {
    it('nên xóa quy định thành công', async () => {
      // Arrange
      khoQuyDinh.findOne.mockResolvedValue(quyDinhMau as Regulation);
      khoQuyDinh.remove.mockResolvedValue(quyDinhMau as Regulation);

      // Act
      const ketQua = await dichVu.remove('uuid-quydinh-123');

      // Assert
      expect(khoQuyDinh.remove).toHaveBeenCalled();
      expect(ketQua).toEqual(quyDinhMau);
    });

    it('nên ném lỗi nếu quy định không tồn tại', async () => {
      // Arrange
      khoQuyDinh.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(dichVu.remove('uuid-khong-ton-tai')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
