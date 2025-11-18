import { Role, Skill } from './Role';

/**
 * 雇用形態
 */
export enum EmploymentType {
  /** 正社員 */
  FULL_TIME = 'FULL_TIME',

  /** パートタイム */
  PART_TIME = 'PART_TIME',

  /** 契約社員 */
  CONTRACT = 'CONTRACT',
}

/**
 * 勤務希望
 */
export interface WorkPreference {
  /** 希望日 (YYYY-MM-DD形式) */
  date: string;

  /** 希望シフトID (OFFの場合は休み希望) */
  preferredShiftId: string;

  /** 優先度 (1: 低, 2: 中, 3: 高) */
  priority: 1 | 2 | 3;
}

/**
 * 従業員
 */
export interface Employee {
  /** 従業員ID */
  id: string;

  /** 名前 */
  name: string;

  /** 職種 */
  role: Role;

  /** 保有スキル */
  skills: Skill[];

  /** 雇用形態 */
  employmentType: EmploymentType;

  /** 月間最大シフト数 */
  maxShiftsPerMonth: number;

  /** 月間最小シフト数 */
  minShiftsPerMonth: number;

  /** 月間最大夜勤数 */
  maxNightShiftsPerMonth?: number;

  /** 月間最小夜勤数 */
  minNightShiftsPerMonth?: number;

  /** 連続勤務可能日数 */
  maxConsecutiveWorkDays: number;

  /** 週間労働時間上限 */
  maxWeeklyHours: number;

  /** 月間労働時間上限 */
  maxMonthlyHours: number;

  /** 勤務希望リスト */
  preferences: WorkPreference[];

  /** 勤務不可日 (YYYY-MM-DD形式) */
  unavailableDates: string[];

  /** 特記事項 */
  notes?: string;
}

/**
 * 従業員ユーティリティ
 */
export class EmployeeUtil {
  /**
   * 夜勤が可能かどうか
   */
  static canWorkNightShift(employee: Employee): boolean {
    return employee.skills.includes(Skill.NIGHT_SHIFT_CAPABLE);
  }

  /**
   * 特定の日に勤務可能かどうか
   */
  static isAvailableOnDate(employee: Employee, date: string): boolean {
    return !employee.unavailableDates.includes(date);
  }

  /**
   * 特定の日の勤務希望を取得
   */
  static getPreferenceForDate(employee: Employee, date: string): WorkPreference | undefined {
    return employee.preferences.find(pref => pref.date === date);
  }

  /**
   * 正社員かどうか
   */
  static isFullTime(employee: Employee): boolean {
    return employee.employmentType === EmploymentType.FULL_TIME;
  }
}
