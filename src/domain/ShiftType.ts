/**
 * シフトタイプ
 * 日本の介護施設でよくあるシフトパターンを定義
 */
export interface ShiftType {
  id: string;
  name: string;
  startTime: string; // HH:MM形式
  endTime: string; // HH:MM形式
  workingHours: number;
  isNightShift: boolean; // 夜勤かどうか
  isNightShiftStart?: boolean; // 夜勤入りかどうか
  isNightShiftEnd?: boolean; // 夜勤明けかどうか
  requiredStaff: number; // 最低必要人数（デフォルト値として使用）
}

/**
 * 介護施設で一般的なシフトタイプの定義
 */
export const STANDARD_SHIFT_TYPES: Record<string, ShiftType> = {
  // 早番
  EARLY: {
    id: 'EARLY',
    name: '早番',
    startTime: '07:00',
    endTime: '16:00',
    workingHours: 8,
    isNightShift: false,
    requiredStaff: 2,
  },

  // 日勤A (通常の日勤)
  DAY_A: {
    id: 'DAY_A',
    name: '日勤A',
    startTime: '08:30',
    endTime: '17:30',
    workingHours: 8,
    isNightShift: false,
    requiredStaff: 3,
  },

  // 日勤B (遅めの日勤)
  DAY_B: {
    id: 'DAY_B',
    name: '日勤B',
    startTime: '09:00',
    endTime: '18:00',
    workingHours: 8,
    isNightShift: false,
    requiredStaff: 2,
  },

  // 遅番
  LATE: {
    id: 'LATE',
    name: '遅番',
    startTime: '11:00',
    endTime: '20:00',
    workingHours: 8,
    isNightShift: false,
    requiredStaff: 2,
  },

  // 夜勤入り (16時間勤務の場合)
  NIGHT_START: {
    id: 'NIGHT_START',
    name: '夜勤入り',
    startTime: '16:00',
    endTime: '10:00', // 翌日
    workingHours: 16,
    isNightShift: true,
    isNightShiftStart: true,
    requiredStaff: 1,
  },

  // 夜勤明け (夜勤後の休憩・引き継ぎ時間)
  NIGHT_END: {
    id: 'NIGHT_END',
    name: '夜勤明け',
    startTime: '10:00',
    endTime: '12:00',
    workingHours: 0, // 実質的な労働時間ではない
    isNightShift: false,
    isNightShiftEnd: true,
    requiredStaff: 0,
  },

  // 休み
  OFF: {
    id: 'OFF',
    name: '休み',
    startTime: '00:00',
    endTime: '00:00',
    workingHours: 0,
    isNightShift: false,
    requiredStaff: 0,
  },
};

/**
 * シフトタイプのユーティリティ関数
 */
export class ShiftTypeUtil {
  /**
   * 2つのシフトが時間的に重複するかをチェック
   */
  static hasTimeOverlap(shift1: ShiftType, shift2: ShiftType): boolean {
    if (shift1.id === 'OFF' || shift2.id === 'OFF') {
      return false;
    }

    // 夜勤の場合は翌日にまたがるため特別処理が必要
    // 簡易的な実装として、夜勤と他のシフトの重複をチェック
    if (shift1.isNightShift || shift2.isNightShift) {
      // 夜勤と早番は重複する可能性がある
      return true; // 簡易実装: 詳細は制約チェックで行う
    }

    // 通常シフトの時間重複チェック
    const start1 = this.timeToMinutes(shift1.startTime);
    const end1 = this.timeToMinutes(shift1.endTime);
    const start2 = this.timeToMinutes(shift2.startTime);
    const end2 = this.timeToMinutes(shift2.endTime);

    return start1 < end2 && start2 < end1;
  }

  /**
   * 時刻文字列(HH:MM)を分に変換
   */
  static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
