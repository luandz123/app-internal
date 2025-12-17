export enum LoaiCaLam {
  FULL_DAY = 'full_day',
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  CUSTOM = 'custom',
}

export enum LoaiHinhLamViec {
  WFO = 'wfo',
  REMOTE = 'remote',
  OFF = 'off',
}

export const CA_LAM_VIEC_MAC_DINH = {
  [LoaiCaLam.FULL_DAY]: {
    gioBatDau: '08:30',
    gioKetThuc: '17:30',
    nghiTruaBatDau: '12:00',
    nghiTruaKetThuc: '13:00',
    soPhutNghi: 60,
  },
  [LoaiCaLam.MORNING]: {
    gioBatDau: '08:30',
    gioKetThuc: '12:30',
    soPhutNghi: 0,
  },
  [LoaiCaLam.AFTERNOON]: {
    gioBatDau: '13:30',
    gioKetThuc: '17:30',
    soPhutNghi: 0,
  },
};

export const WORK_SCHEDULE_CONSTANTS = {
  MIN_SHIFT_MINUTES: 120, // 2 hours
  EARLIEST_START_TIME: '06:00',
  LATEST_END_TIME: '22:00',
};
