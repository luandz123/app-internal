// Loại ca làm việc - Mỗi ngày có thể đăng ký nhiều ca (không giới hạn số ca)
// Mỗi loại ca (sáng/chiều) chỉ được đăng ký 1 lần/ngày, ca custom có thể đăng ký nhiều lần
export enum LoaiCaLam {
  MORNING = 'morning', // Ca sáng: mặc định 08:30 - 12:00 (có thể tùy chỉnh)
  AFTERNOON = 'afternoon', // Ca chiều: mặc định 13:00 - 17:30 (có thể tùy chỉnh)
  CUSTOM = 'custom', // Ca tùy chỉnh: tự định nghĩa giờ, tối thiểu 2 giờ
}

export enum LoaiHinhLamViec {
  WFO = 'wfo',
  REMOTE = 'remote',
  OFF = 'off',
}

export const CA_LAM_VIEC_MAC_DINH = {
  [LoaiCaLam.MORNING]: {
    gioBatDau: '08:30',
    gioKetThuc: '12:00',
    soPhutLamViec: 210, // 3.5 giờ
  },
  [LoaiCaLam.AFTERNOON]: {
    gioBatDau: '13:00',
    gioKetThuc: '17:30',
    soPhutLamViec: 270, // 4.5 giờ
  },
  [LoaiCaLam.CUSTOM]: {
    gioBatDau: '',
    gioKetThuc: '',
    soPhutLamViec: 0,
  },
};

export const WORK_SCHEDULE_CONSTANTS = {
  MIN_SHIFT_MINUTES: 120, // Tối thiểu 2 giờ mỗi ca
};
