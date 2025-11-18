/**
 * 介護・福祉事業所向けシフト自動生成エンジン
 *
 * このライブラリは、介護施設のシフトスケジュール生成を自動化するためのコアエンジンです。
 * 制約ソルバーを使用して、従業員の希望やスキル、法令遵守などを考慮した
 * 最適なシフトスケジュールを生成します。
 *
 * @packageDocumentation
 */

// ドメインモデル
export {
  // Employee関連
  Employee,
  EmployeeUtil,
  EmploymentType,
  WorkPreference,

  // Role関連
  Role,
  Skill,
  ROLE_NAMES,

  // ShiftType関連
  ShiftType,
  STANDARD_SHIFT_TYPES,
  ShiftTypeUtil,

  // ShiftAssignment関連
  ShiftAssignment,
  Schedule,
  ShiftAssignmentUtil,
} from './domain';

// 制約
export {
  // 型定義
  Constraint,
  ConstraintViolation,
  ConstraintEvaluationResult,

  // ハード制約
  NoDoubleBookingConstraint,
  NoShiftAfterNightShiftConstraint,
  RespectUnavailableDatesConstraint,
  MaxShiftsPerMonthConstraint,
  MaxConsecutiveWorkDaysConstraint,
  NightShiftCapabilityConstraint,
  getAllHardConstraints,

  // ソフト制約
  RespectOffRequestsConstraint,
  FairNightShiftDistributionConstraint,
  RespectShiftPreferencesConstraint,
  AvoidLongConsecutiveWorkConstraint,
  MinShiftsPerMonthConstraint,
  getAllSoftConstraints,
} from './constraints';

// ソルバー
export {
  // 型定義
  Solver,
  ScheduleGenerationRequest,
  ScheduleGenerationResult,

  // 実装
  NaiveSolver,
} from './solver';

/**
 * ライブラリのバージョン情報
 */
export const VERSION = '0.1.0';

/**
 * 簡易的なスケジュール生成関数
 *
 * @example
 * ```typescript
 * import { generateSchedule, createSampleEmployees } from 'welfare-shift-scheduler-core';
 *
 * const result = await generateSchedule({
 *   yearMonth: '2025-01',
 *   employees: createSampleEmployees(),
 * });
 *
 * console.log(`スコア: ${result.overallScore}`);
 * ```
 */
export async function generateSchedule(options: {
  yearMonth: string;
  employees: Employee[];
  shiftTypes?: ShiftType[];
  hardConstraints?: Constraint[];
  softConstraints?: Constraint[];
  timeoutMs?: number;
}): Promise<ScheduleGenerationResult> {
  const { NaiveSolver } = await import('./solver');
  const { STANDARD_SHIFT_TYPES } = await import('./domain');
  const { getAllHardConstraints, getAllSoftConstraints } = await import('./constraints');

  const solver = new NaiveSolver();

  const request: ScheduleGenerationRequest = {
    yearMonth: options.yearMonth,
    employees: options.employees,
    shiftTypes: options.shiftTypes || Object.values(STANDARD_SHIFT_TYPES),
    hardConstraints: options.hardConstraints || getAllHardConstraints(),
    softConstraints: options.softConstraints || getAllSoftConstraints(),
    timeoutMs: options.timeoutMs,
  };

  return solver.generateSchedule(request);
}

// 型の再エクスポート（利便性のため）
import type {
  Employee,
  ShiftType,
  Schedule,
} from './domain';
import type {
  Constraint,
  ConstraintEvaluationResult,
} from './constraints';
import type {
  ScheduleGenerationRequest,
  ScheduleGenerationResult,
} from './solver';

export type {
  Employee as IEmployee,
  ShiftType as IShiftType,
  Schedule as ISchedule,
  Constraint as IConstraint,
  ConstraintEvaluationResult as IConstraintEvaluationResult,
  ScheduleGenerationRequest as IScheduleGenerationRequest,
  ScheduleGenerationResult as IScheduleGenerationResult,
};
