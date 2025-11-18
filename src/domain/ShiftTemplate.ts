/**
 * ShiftTemplate（シフトテンプレート）エンティティ
 *
 * 施設ごとにカスタマイズ可能なシフトパターン
 */

/**
 * シフトテンプレート
 */
export interface ShiftTemplate {
  /** テンプレートID */
  id: string;

  /** 施設ID */
  facilityId: string;

  /** テンプレート名 */
  name: string;

  /** 説明 */
  description?: string;

  /** 開始時刻 (HH:MM) */
  startTime: string;

  /** 終了時刻 (HH:MM) */
  endTime: string;

  /** 労働時間（時間） */
  workingHours: number;

  /** 休憩時間（時間） */
  breakHours: number;

  /** 夜勤かどうか */
  isNightShift: boolean;

  /** 必要スタッフ数 */
  requiredStaff: number;

  /** 必要スキル */
  requiredSkills?: string[];

  /** 優先職種 */
  preferredRoles?: string[];

  /** カラーコード（UI表示用） */
  color?: string;

  /** 表示順序 */
  sortOrder: number;

  /** アクティブかどうか */
  isActive: boolean;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;

  /** 作成者ID */
  createdBy?: string;
}

/**
 * テンプレート適用結果
 */
export interface TemplateApplication {
  /** 適用されたシフトID */
  shiftId: string;

  /** 使用したテンプレートID */
  templateId: string;

  /** 適用日 */
  date: string;

  /** 割り当てられた従業員ID */
  employeeId: string;
}

/**
 * シフトテンプレートユーティリティ
 */
export class ShiftTemplateUtil {
  /**
   * 実労働時間を計算（労働時間 - 休憩時間）
   */
  static getActualWorkingHours(template: ShiftTemplate): number {
    return Math.max(0, template.workingHours - template.breakHours);
  }

  /**
   * テンプレートが有効かどうか
   */
  static isValid(template: ShiftTemplate): boolean {
    return (
      template.isActive &&
      template.workingHours > 0 &&
      template.requiredStaff > 0 &&
      this.isValidTimeFormat(template.startTime) &&
      this.isValidTimeFormat(template.endTime)
    );
  }

  /**
   * 時刻フォーマットの検証
   */
  static isValidTimeFormat(time: string): boolean {
    return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  }

  /**
   * 時間帯が重複するかチェック
   */
  static hasOverlap(template1: ShiftTemplate, template2: ShiftTemplate): boolean {
    const start1 = this.timeToMinutes(template1.startTime);
    const end1 = this.timeToMinutes(template1.endTime);
    const start2 = this.timeToMinutes(template2.startTime);
    const end2 = this.timeToMinutes(template2.endTime);

    // 夜勤の場合は特別処理が必要
    if (template1.isNightShift || template2.isNightShift) {
      return true; // 簡易実装: 夜勤は重複する可能性あり
    }

    return start1 < end2 && start2 < end1;
  }

  /**
   * 時刻を分に変換
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * テンプレートをソート順にソート
   */
  static sortTemplates(templates: ShiftTemplate[]): ShiftTemplate[] {
    return [...templates].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * アクティブなテンプレートのみをフィルタ
   */
  static filterActive(templates: ShiftTemplate[]): ShiftTemplate[] {
    return templates.filter(t => t.isActive);
  }
}
