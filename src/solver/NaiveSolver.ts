import { Employee, Schedule, ShiftAssignment, STANDARD_SHIFT_TYPES, EmployeeUtil } from '../domain';
import { Solver, ScheduleGenerationRequest, ScheduleGenerationResult } from './types';
import { ConstraintEvaluationResult } from '../constraints';

/**
 * 単純なヒューリスティックによるシフトスケジューラー
 *
 * アルゴリズム:
 * 1. 各日について、必要なシフトタイプごとに従業員を割り当てる
 * 2. 従業員は以下の優先順位で選択:
 *    - 勤務可能（勤務不可日でない）
 *    - ハード制約を違反しない
 *    - これまでの勤務日数が少ない
 *    - 希望シフトに合っている
 * 3. すべての従業員にシフトを割り当て後、制約チェックを実施
 */
export class NaiveSolver implements Solver {
  getName(): string {
    return 'NaiveSolver';
  }

  async generateSchedule(request: ScheduleGenerationRequest): Promise<ScheduleGenerationResult> {
    const startTime = Date.now();

    try {
      // 月の日数を計算
      const [year, month] = request.yearMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();

      // 日付リストを生成
      const dates: string[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${request.yearMonth}-${day.toString().padStart(2, '0')}`;
        dates.push(dateStr);
      }

      // 各従業員の勤務カウンターを初期化
      const employeeWorkCounts = new Map<string, number>();
      const employeeNightShiftCounts = new Map<string, number>();
      request.employees.forEach(emp => {
        employeeWorkCounts.set(emp.id, 0);
        employeeNightShiftCounts.set(emp.id, 0);
      });

      // シフト割り当てリスト
      const assignments: ShiftAssignment[] = [];

      // 各日について処理
      for (const date of dates) {
        // 各シフトタイプについて従業員を割り当て
        for (const shiftType of request.shiftTypes) {
          if (shiftType.id === 'OFF' || shiftType.id === 'NIGHT_END') {
            continue; // OFFと夜勤明けは自動割り当てしない
          }

          // このシフトに必要な人数を取得
          const requiredStaff = request.staffingRequirements?.get(date)?.get(shiftType.id)
            ?? shiftType.requiredStaff;

          // 従業員を優先順位付けして選択
          const candidates = this.rankCandidates(
            request.employees,
            date,
            shiftType.id,
            employeeWorkCounts,
            employeeNightShiftCounts,
            assignments
          );

          // 上位の従業員を割り当て
          for (let i = 0; i < Math.min(requiredStaff, candidates.length); i++) {
            const employee = candidates[i];
            assignments.push({
              employeeId: employee.id,
              date,
              shiftTypeId: shiftType.id,
            });

            // カウンターを更新
            employeeWorkCounts.set(employee.id, (employeeWorkCounts.get(employee.id) || 0) + 1);
            if (shiftType.isNightShift) {
              employeeNightShiftCounts.set(employee.id, (employeeNightShiftCounts.get(employee.id) || 0) + 1);
            }

            // 夜勤入りの場合、翌日に夜勤明けを自動追加
            if (shiftType.isNightShiftStart) {
              const nextDate = this.getNextDate(date);
              if (nextDate) {
                assignments.push({
                  employeeId: employee.id,
                  date: nextDate,
                  shiftTypeId: 'NIGHT_END',
                });
              }
            }
          }
        }

        // この日にシフトが割り当てられていない従業員には「OFF」を割り当て
        for (const employee of request.employees) {
          const hasAssignment = assignments.some(
            a => a.employeeId === employee.id && a.date === date
          );
          if (!hasAssignment) {
            assignments.push({
              employeeId: employee.id,
              date,
              shiftTypeId: 'OFF',
            });
          }
        }
      }

      // スケジュールオブジェクトを作成
      const schedule: Schedule = {
        yearMonth: request.yearMonth,
        assignments,
        generatedAt: new Date(),
        metadata: {
          generationTimeMs: Date.now() - startTime,
        },
      };

      // 制約を評価
      const constraintResults = this.evaluateConstraints(
        schedule,
        request.employees,
        request.hardConstraints,
        request.softConstraints
      );

      return {
        schedule,
        success: true,
        feasible: constraintResults.hardConstraintsSatisfied,
        totalViolations: constraintResults.totalViolations,
        overallScore: constraintResults.overallScore,
      };
    } catch (error) {
      return {
        schedule: {
          yearMonth: request.yearMonth,
          assignments: [],
          generatedAt: new Date(),
        },
        success: false,
        feasible: false,
        totalViolations: 0,
        overallScore: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 候補従業員を優先順位付けしてランク付け
   */
  private rankCandidates(
    employees: Employee[],
    date: string,
    shiftTypeId: string,
    workCounts: Map<string, number>,
    nightShiftCounts: Map<string, number>,
    currentAssignments: ShiftAssignment[]
  ): Employee[] {
    const shift = STANDARD_SHIFT_TYPES[shiftTypeId];

    return employees
      .filter(emp => {
        // 勤務可能日チェック
        if (!EmployeeUtil.isAvailableOnDate(emp, date)) {
          return false;
        }

        // 夜勤の場合、夜勤可能スキルチェック
        if (shift?.isNightShift && !EmployeeUtil.canWorkNightShift(emp)) {
          return false;
        }

        // この日に既に別のシフトが割り当てられていないかチェック
        const hasAssignmentToday = currentAssignments.some(
          a => a.employeeId === emp.id && a.date === date
        );
        if (hasAssignmentToday) {
          return false;
        }

        // 前日が夜勤入りの場合、この日は夜勤明け以外に入れない
        const previousDate = this.getPreviousDate(date);
        if (previousDate) {
          const prevAssignment = currentAssignments.find(
            a => a.employeeId === emp.id && a.date === previousDate
          );
          if (prevAssignment) {
            const prevShift = STANDARD_SHIFT_TYPES[prevAssignment.shiftTypeId];
            if (prevShift?.isNightShiftStart && shiftTypeId !== 'NIGHT_END') {
              return false;
            }
          }
        }

        // 最大シフト数チェック
        const currentWorkCount = workCounts.get(emp.id) || 0;
        if (currentWorkCount >= emp.maxShiftsPerMonth) {
          return false;
        }

        // 夜勤最大数チェック
        if (shift?.isNightShift && emp.maxNightShiftsPerMonth) {
          const currentNightShiftCount = nightShiftCounts.get(emp.id) || 0;
          if (currentNightShiftCount >= emp.maxNightShiftsPerMonth) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // 優先順位1: 希望シフトに合っている
        const aPref = EmployeeUtil.getPreferenceForDate(a, date);
        const bPref = EmployeeUtil.getPreferenceForDate(b, date);
        const aMatchesPref = aPref?.preferredShiftId === shiftTypeId ? aPref.priority : 0;
        const bMatchesPref = bPref?.preferredShiftId === shiftTypeId ? bPref.priority : 0;
        if (aMatchesPref !== bMatchesPref) {
          return bMatchesPref - aMatchesPref; // 優先度が高い方を優先
        }

        // 優先順位2: これまでの勤務日数が少ない
        const aWorkCount = workCounts.get(a.id) || 0;
        const bWorkCount = workCounts.get(b.id) || 0;
        if (aWorkCount !== bWorkCount) {
          return aWorkCount - bWorkCount;
        }

        // 優先順位3: 夜勤の場合、夜勤回数が少ない
        if (shift?.isNightShift) {
          const aNightCount = nightShiftCounts.get(a.id) || 0;
          const bNightCount = nightShiftCounts.get(b.id) || 0;
          if (aNightCount !== bNightCount) {
            return aNightCount - bNightCount;
          }
        }

        return 0;
      });
  }

  /**
   * 制約を評価
   */
  private evaluateConstraints(
    schedule: Schedule,
    employees: Employee[],
    hardConstraints: any[],
    softConstraints: any[]
  ): {
    hardConstraintsSatisfied: boolean;
    totalViolations: number;
    overallScore: number;
  } {
    let totalViolations = 0;
    let hardConstraintsSatisfied = true;

    // ハード制約の評価
    for (const constraint of hardConstraints) {
      const result: ConstraintEvaluationResult = constraint.evaluate(schedule, employees);
      if (!result.satisfied) {
        hardConstraintsSatisfied = false;
        totalViolations += result.violations.length;
      }
    }

    // ソフト制約の評価とスコア計算
    let totalScore = 0;
    for (const constraint of softConstraints) {
      const result: ConstraintEvaluationResult = constraint.evaluate(schedule, employees);
      totalViolations += result.violations.length;
      totalScore += result.score || 0;
    }

    const overallScore = softConstraints.length > 0 ? totalScore / softConstraints.length : 100;

    return {
      hardConstraintsSatisfied,
      totalViolations,
      overallScore,
    };
  }

  /**
   * 翌日の日付を取得
   */
  private getNextDate(date: string): string | null {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  /**
   * 前日の日付を取得
   */
  private getPreviousDate(date: string): string | null {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
}
