import { Employee, Schedule, ShiftType } from '../domain';
import { Constraint } from '../constraints';

/**
 * スケジュール生成リクエスト
 */
export interface ScheduleGenerationRequest {
  /** 年月 (YYYY-MM形式) */
  yearMonth: string;

  /** 従業員リスト */
  employees: Employee[];

  /** 利用可能なシフトタイプ */
  shiftTypes: ShiftType[];

  /** ハード制約 */
  hardConstraints: Constraint[];

  /** ソフト制約 */
  softConstraints: Constraint[];

  /** 各日・各シフトタイプごとの必要人数 (オプション) */
  staffingRequirements?: Map<string, Map<string, number>>;

  /** タイムアウト (ミリ秒、オプション) */
  timeoutMs?: number;
}

/**
 * スケジュール生成結果
 */
export interface ScheduleGenerationResult {
  /** 生成されたスケジュール */
  schedule: Schedule;

  /** 成功したかどうか */
  success: boolean;

  /** ハード制約を満たしているか */
  feasible: boolean;

  /** 違反した制約の総数 */
  totalViolations: number;

  /** 全体の満足度スコア (0-100) */
  overallScore: number;

  /** エラーメッセージ (失敗時) */
  errorMessage?: string;
}

/**
 * ソルバーインターフェース
 */
export interface Solver {
  /**
   * スケジュールを生成
   */
  generateSchedule(request: ScheduleGenerationRequest): Promise<ScheduleGenerationResult>;

  /**
   * ソルバーの名前
   */
  getName(): string;
}
