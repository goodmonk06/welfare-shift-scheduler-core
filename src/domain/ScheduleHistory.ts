/**
 * ScheduleHistory（スケジュール履歴）エンティティ
 *
 * スケジュールの変更履歴・バージョン管理
 */

/**
 * 変更タイプ
 */
export enum ChangeType {
  /** スケジュール生成 */
  CREATED = 'CREATED',

  /** シフト変更 */
  SHIFT_MODIFIED = 'SHIFT_MODIFIED',

  /** シフト交換 */
  SHIFT_SWAPPED = 'SHIFT_SWAPPED',

  /** 手動調整 */
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',

  /** 承認 */
  APPROVED = 'APPROVED',

  /** 確定 */
  CONFIRMED = 'CONFIRMED',

  /** ロールバック */
  ROLLED_BACK = 'ROLLED_BACK',
}

/**
 * 変更詳細
 */
export interface ChangeDetail {
  /** 従業員ID */
  employeeId: string;

  /** 日付 */
  date: string;

  /** 変更前のシフトID */
  previousShiftId?: string;

  /** 変更後のシフトID */
  newShiftId: string;

  /** 変更理由 */
  reason?: string;
}

/**
 * スケジュール履歴エントリ
 */
export interface ScheduleHistoryEntry {
  /** 履歴ID */
  id: string;

  /** スケジュールID（年月） */
  scheduleId: string;

  /** 施設ID */
  facilityId: string;

  /** バージョン番号 */
  version: number;

  /** 変更タイプ */
  changeType: ChangeType;

  /** 変更詳細 */
  changes: ChangeDetail[];

  /** 変更者ID */
  changedBy: string;

  /** 変更者の役割 */
  changedByRole?: 'EMPLOYEE' | 'MANAGER' | 'ADMIN' | 'SYSTEM';

  /** コメント */
  comment?: string;

  /** スナップショット（完全なスケジュールデータ） */
  snapshot?: any;

  /** タイムスタンプ */
  timestamp: Date;

  /** IPアドレス */
  ipAddress?: string;

  /** ユーザーエージェント */
  userAgent?: string;

  /** メタデータ */
  metadata?: Record<string, any>;
}

/**
 * スケジュール比較結果
 */
export interface ScheduleComparison {
  /** 追加されたシフト */
  added: ChangeDetail[];

  /** 削除されたシフト */
  removed: ChangeDetail[];

  /** 変更されたシフト */
  modified: ChangeDetail[];

  /** 変更なし */
  unchanged: number;

  /** 総変更数 */
  totalChanges: number;
}

/**
 * スケジュール履歴ユーティリティ
 */
export class ScheduleHistoryUtil {
  /**
   * 変更詳細をマージ
   */
  static mergeChanges(changes: ChangeDetail[]): ChangeDetail[] {
    const merged = new Map<string, ChangeDetail>();

    changes.forEach(change => {
      const key = `${change.employeeId}:${change.date}`;
      merged.set(key, change);
    });

    return Array.from(merged.values());
  }

  /**
   * 変更数を計算
   */
  static countChanges(entry: ScheduleHistoryEntry): number {
    return entry.changes.length;
  }

  /**
   * 変更タイプの日本語名を取得
   */
  static getChangeTypeName(type: ChangeType): string {
    const names: Record<ChangeType, string> = {
      [ChangeType.CREATED]: 'スケジュール生成',
      [ChangeType.SHIFT_MODIFIED]: 'シフト変更',
      [ChangeType.SHIFT_SWAPPED]: 'シフト交換',
      [ChangeType.MANUAL_ADJUSTMENT]: '手動調整',
      [ChangeType.APPROVED]: '承認',
      [ChangeType.CONFIRMED]: '確定',
      [ChangeType.ROLLED_BACK]: 'ロールバック',
    };
    return names[type];
  }

  /**
   * 変更サマリーを生成
   */
  static generateSummary(entry: ScheduleHistoryEntry): string {
    const count = this.countChanges(entry);
    const typeName = this.getChangeTypeName(entry.changeType);

    if (count === 0) {
      return typeName;
    }

    return `${typeName}（${count}件の変更）`;
  }

  /**
   * 2つのスケジュールを比較
   */
  static compareSchedules(
    oldAssignments: Array<{ employeeId: string; date: string; shiftTypeId: string }>,
    newAssignments: Array<{ employeeId: string; date: string; shiftTypeId: string }>
  ): ScheduleComparison {
    const oldMap = new Map<string, string>();
    const newMap = new Map<string, string>();

    oldAssignments.forEach(a => {
      const key = `${a.employeeId}:${a.date}`;
      oldMap.set(key, a.shiftTypeId);
    });

    newAssignments.forEach(a => {
      const key = `${a.employeeId}:${a.date}`;
      newMap.set(key, a.shiftTypeId);
    });

    const added: ChangeDetail[] = [];
    const removed: ChangeDetail[] = [];
    const modified: ChangeDetail[] = [];
    let unchanged = 0;

    // 新しいシフトをチェック
    newMap.forEach((shiftTypeId, key) => {
      const [employeeId, date] = key.split(':');

      if (!oldMap.has(key)) {
        added.push({ employeeId, date, newShiftId: shiftTypeId });
      } else if (oldMap.get(key) !== shiftTypeId) {
        modified.push({
          employeeId,
          date,
          previousShiftId: oldMap.get(key),
          newShiftId: shiftTypeId,
        });
      } else {
        unchanged++;
      }
    });

    // 削除されたシフトをチェック
    oldMap.forEach((shiftTypeId, key) => {
      if (!newMap.has(key)) {
        const [employeeId, date] = key.split(':');
        removed.push({
          employeeId,
          date,
          previousShiftId: shiftTypeId,
          newShiftId: 'OFF', // 削除 = OFF扱い
        });
      }
    });

    return {
      added,
      removed,
      modified,
      unchanged,
      totalChanges: added.length + removed.length + modified.length,
    };
  }

  /**
   * 最近の履歴エントリをフィルタ
   */
  static filterRecent(
    entries: ScheduleHistoryEntry[],
    days: number = 30
  ): ScheduleHistoryEntry[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return entries.filter(e => e.timestamp >= cutoff);
  }

  /**
   * バージョンでソート
   */
  static sortByVersion(
    entries: ScheduleHistoryEntry[],
    ascending: boolean = false
  ): ScheduleHistoryEntry[] {
    return [...entries].sort((a, b) =>
      ascending ? a.version - b.version : b.version - a.version
    );
  }
}
