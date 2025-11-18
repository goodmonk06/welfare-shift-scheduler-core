/**
 * シフト割り当て
 */
export interface ShiftAssignment {
  /** 従業員ID */
  employeeId: string;

  /** 日付 (YYYY-MM-DD形式) */
  date: string;

  /** シフトタイプID */
  shiftTypeId: string;
}

/**
 * スケジュール (1ヶ月分のシフト割り当て)
 */
export interface Schedule {
  /** 年月 (YYYY-MM形式) */
  yearMonth: string;

  /** シフト割り当てリスト */
  assignments: ShiftAssignment[];

  /** 生成日時 */
  generatedAt: Date;

  /** メタデータ */
  metadata?: {
    /** 違反した制約数 */
    violatedConstraints?: number;

    /** 満足度スコア (0-100) */
    satisfactionScore?: number;

    /** 生成にかかった時間 (ms) */
    generationTimeMs?: number;
  };
}

/**
 * シフト割り当てユーティリティ
 */
export class ShiftAssignmentUtil {
  /**
   * 特定の従業員の特定日のシフトを取得
   */
  static getAssignment(
    schedule: Schedule,
    employeeId: string,
    date: string
  ): ShiftAssignment | undefined {
    return schedule.assignments.find(
      a => a.employeeId === employeeId && a.date === date
    );
  }

  /**
   * 特定の日のすべてのシフト割り当てを取得
   */
  static getAssignmentsByDate(schedule: Schedule, date: string): ShiftAssignment[] {
    return schedule.assignments.filter(a => a.date === date);
  }

  /**
   * 特定の従業員のすべてのシフト割り当てを取得
   */
  static getAssignmentsByEmployee(schedule: Schedule, employeeId: string): ShiftAssignment[] {
    return schedule.assignments.filter(a => a.employeeId === employeeId);
  }

  /**
   * 特定の日の特定のシフトタイプに割り当てられている従業員数を取得
   */
  static countAssignments(
    schedule: Schedule,
    date: string,
    shiftTypeId: string
  ): number {
    return schedule.assignments.filter(
      a => a.date === date && a.shiftTypeId === shiftTypeId
    ).length;
  }
}
