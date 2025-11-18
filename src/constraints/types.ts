import { Employee, Schedule } from '../domain';

/**
 * 制約違反
 */
export interface ConstraintViolation {
  /** 制約ID */
  constraintId: string;

  /** 制約名 */
  constraintName: string;

  /** 違反の説明 */
  description: string;

  /** 関連する従業員ID */
  employeeId?: string;

  /** 関連する日付 */
  date?: string;

  /** 重大度 (ハード制約の場合はCRITICAL) */
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * 制約評価結果
 */
export interface ConstraintEvaluationResult {
  /** 制約を満たしているか */
  satisfied: boolean;

  /** 違反のリスト */
  violations: ConstraintViolation[];

  /** スコア（ソフト制約の場合、0-100） */
  score?: number;
}

/**
 * 制約インターフェース
 */
export interface Constraint {
  /** 制約ID */
  id: string;

  /** 制約名 */
  name: string;

  /** 制約の説明 */
  description: string;

  /** ハード制約かソフト制約か */
  type: 'HARD' | 'SOFT';

  /**
   * スケジュールが制約を満たしているかを評価
   */
  evaluate(schedule: Schedule, employees: Employee[]): ConstraintEvaluationResult;
}
