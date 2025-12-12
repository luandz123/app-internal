import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardService, DashboardStats } from './dashboard.service';
import { User, UserStatus } from '../user/entities/user.entity';
import {
  LeaveRequest,
  LeaveRequestStatus,
} from '../leave-request/entities/leave-request.entity';
import { Salary } from '../salary/entities/salary.entity';
import { WorkSchedule } from '../work-schedule/entities/work-schedule.entity';

describe('DashboardService - Dịch vụ Bảng điều khiển', () => {
  let dichVu: DashboardService;
  let khoNguoiDung: jest.Mocked<Repository<User>>;
  let khoDonNghiPhep: jest.Mocked<Repository<LeaveRequest>>;
  let khoLuong: jest.Mocked<Repository<Salary>>;
  let khoLichLamViec: jest.Mocked<Repository<WorkSchedule>>;

  beforeEach(async () => {
    const mockRepository = {
      count: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(User),
          useValue: { ...mockRepository },
        },
        {
          provide: getRepositoryToken(LeaveRequest),
          useValue: { ...mockRepository },
        },
        {
          provide: getRepositoryToken(Salary),
          useValue: { ...mockRepository },
        },
        {
          provide: getRepositoryToken(WorkSchedule),
          useValue: { ...mockRepository },
        },
      ],
    }).compile();

    dichVu = module.get<DashboardService>(DashboardService);
    khoNguoiDung = module.get(getRepositoryToken(User));
    khoDonNghiPhep = module.get(getRepositoryToken(LeaveRequest));
    khoLuong = module.get(getRepositoryToken(Salary));
    khoLichLamViec = module.get(getRepositoryToken(WorkSchedule));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAdminDashboard - Lấy thống kê cho Admin', () => {
    it('nên trả về thống kê đầy đủ', async () => {
      // Arrange
      khoNguoiDung.count
        .mockResolvedValueOnce(50) // totalEmployees
        .mockResolvedValueOnce(45); // activeEmployees

      khoDonNghiPhep.count
        .mockResolvedValueOnce(5) // pendingRequests
        .mockResolvedValueOnce(20) // approvedRequestsThisMonth
        .mockResolvedValueOnce(3) // rejectedRequestsThisMonth
        .mockResolvedValueOnce(10); // lateArrivalsThisMonth

      khoDonNghiPhep.find.mockResolvedValueOnce([]); // overtimeRequests
      khoLuong.find.mockResolvedValueOnce([
        { netSalary: 100000000 } as unknown as Salary,
        { netSalary: 80000000 } as unknown as Salary,
      ]);

      // Act
      const ketQua: DashboardStats = await dichVu.getAdminDashboard();

      // Assert
      expect(ketQua.totalEmployees).toBe(50);
      expect(ketQua.activeEmployees).toBe(45);
      expect(ketQua.pendingRequests).toBe(5);
      expect(ketQua.approvedRequestsThisMonth).toBe(20);
      expect(ketQua.rejectedRequestsThisMonth).toBe(3);
      expect(ketQua.lateArrivalsThisMonth).toBe(10);
    });

    it('nên tính tổng lương từ danh sách', async () => {
      // Arrange - Mock đầy đủ cho Promise.all
      khoNguoiDung.count.mockResolvedValueOnce(10).mockResolvedValueOnce(10);
      khoDonNghiPhep.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      khoDonNghiPhep.find.mockResolvedValueOnce([]);
      khoLuong.find.mockResolvedValueOnce([]);

      // Act
      const ketQua = await dichVu.getAdminDashboard();

      // Assert
      expect(ketQua.totalSalaryThisMonth).toBe(0);
    });

    it('nên trả về 0 khi không có dữ liệu', async () => {
      // Arrange
      khoNguoiDung.count.mockResolvedValue(0);
      khoDonNghiPhep.count.mockResolvedValue(0);
      khoDonNghiPhep.find.mockResolvedValue([]);
      khoLuong.find.mockResolvedValue([]);

      // Act
      const ketQua = await dichVu.getAdminDashboard();

      // Assert
      expect(ketQua.totalEmployees).toBe(0);
      expect(ketQua.totalSalaryThisMonth).toBe(0);
    });
  });
});
