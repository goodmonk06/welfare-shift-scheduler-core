import {
  Employee,
  Schedule,
  ShiftAssignmentUtil,
  EmployeeUtil,
  STANDARD_SHIFT_TYPES,
} from '../domain';
import { Constraint, ConstraintEvaluationResult, ConstraintViolation } from './types';

/**
 * ソフト制約: 希望休をなるべく守る
 */
export class RespectOffRequestsConstraint implements Constraint {
  id = 'SOFT_RESPECT_OFF_REQUESTS';
  name = '希望休の考慮';
  description = '従業員の希望休をなるべく守る';
  type: 'SOFT' = 'SOFT';

  evaluate(schedule: Schedule, employees: Employee[]): ConstraintEvaluationResult {
    const violations: ConstraintViolation[] = [];
    let totalRequests = 0;
    let satisfiedRequests = 0;

    employees.forEach(employee => {
      employee.preferences.forEach(pref => {
        if (pref.preferredShiftId === 'OFF') {
          totalRequests++;
          const assignment = ShiftAssignmentUtil.getAssignment(schedule, employee.id, pref.date);

          if (assignment?.shiftTypeId === 'OFF') {
            satisfiedRequests++;
          } else {
            const severity = pref.priority === 3 ? 'HIGH' : pref.priority === 2 ? 'MEDIUM' : 'LOW';
            violations.push({
              constraintId: this.id,
              constraintName: this.name,
              description: `${employee.name}の${pref.date}の希望休（優先度${pref.priority}）が守られていません`,
              employeeId: employee.id,
              date: pref.date,
              severity,
            });
          }
        }
      });
    });

    const score = totalRequests > 0 ? (satisfiedRequests / totalRequests) * 100 : 100;

    return {
      satisfied: violations.length === 0,
      violations,
      score,
    };
  }
}

/**
 * ソフト制約: 夜勤回数を公平にする
 */
export class FairNightShiftDistributionConstraint implements Constraint {
  id = 'SOFT_FAIR_NIGHT_SHIFTS';
  name = '夜勤の公平な配分';
  description = '夜勤可能な従業員間で夜勤回数をなるべく均等にする';
  type: 'SOFT' = 'SOFT';

  evaluate(schedule: Schedule, employees: Employee[]): ConstraintEvaluationResult {
    const violations: ConstraintViolation[] = [];

    // 夜勤可能な従業員のみを対象
    const nightShiftCapableEmployees = employees.filter(e => EmployeeUtil.canWorkNightShift(e));

    if (nightShiftCapableEmployees.length === 0) {
      return { satisfied: true, violations: [], score: 100 };
    }

    // 各従業員の夜勤回数をカウント
    const nightShiftCounts = new Map<string, number>();
    nightShiftCapableEmployees.forEach(employee => {
      const assignments = ShiftAssignmentUtil.getAssignmentsByEmployee(schedule, employee.id);
      const nightShifts = assignments.filter(a => {
        const shift = STANDARD_SHIFT_TYPES[a.shiftTypeId];
        return shift?.isNightShift;
      });
      nightShiftCounts.set(employee.id, nightShifts.length);
    });

    // 平均夜勤回数を計算
    const counts = Array.from(nightShiftCounts.values());
    const average = counts.reduce((sum, count) => sum + count, 0) / counts.length;
    const maxDeviation = Math.max(...counts.map(count => Math.abs(count - average)));

    // 偏差が大きい場合は違反
    nightShiftCounts.forEach((count, employeeId) => {
      const deviation = Math.abs(count - average);
      if (deviation > 2) { // 平均から2回以上ずれている場合
        const employee = nightShiftCapableEmployees.find(e => e.id === employeeId);
        violations.push({
          constraintId: this.id,
          constraintName: this.name,
          description: `${employee?.name}の夜勤回数${count}が平均${average.toFixed(1)}から大きく離れています`,
          employeeId,
          severity: deviation > 3 ? 'HIGH' : 'MEDIUM',
        });
      }
    });

    // スコア計算: 偏差が小さいほど高スコア
    const score = Math.max(0, 100 - (maxDeviation * 10));

    return {
      satisfied: violations.length === 0,
      violations,
      score,
    };
  }
}

/**
 * ソフト制約: 希望シフトをなるべく守る
 */
export class RespectShiftPreferencesConstraint implements Constraint {
  id = 'SOFT_RESPECT_SHIFT_PREFERENCES';
  name = '希望シフトの考慮';
  description = '従業員の希望するシフトをなるべく割り当てる';
  type: 'SOFT' = 'SOFT';

  evaluate(schedule: Schedule, employees: Employee[]): ConstraintEvaluationResult {
    const violations: ConstraintViolation[] = [];
    let totalPreferences = 0;
    let satisfiedPreferences = 0;

    employees.forEach(employee => {
      employee.preferences.forEach(pref => {
        if (pref.preferredShiftId !== 'OFF') {
          totalPreferences++;
          const assignment = ShiftAssignmentUtil.getAssignment(schedule, employee.id, pref.date);

          if (assignment?.shiftTypeId === pref.preferredShiftId) {
            satisfiedPreferences++;
          } else {
            const severity = pref.priority === 3 ? 'HIGH' : pref.priority === 2 ? 'MEDIUM' : 'LOW';
            violations.push({
              constraintId: this.id,
              constraintName: this.name,
              description: `${employee.name}の${pref.date}の希望シフト「${pref.preferredShiftId}」（優先度${pref.priority}）が守られていません`,
              employeeId: employee.id,
              date: pref.date,
              severity,
            });
          }
        }
      });
    });

    const score = totalPreferences > 0 ? (satisfiedPreferences / totalPreferences) * 100 : 100;

    return {
      satisfied: violations.length === 0,
      violations,
      score,
    };
  }
}

/**
 * ソフト制約: 連続勤務を避ける（推奨最大日数以下にする）
 */
export class AvoidLongConsecutiveWorkConstraint implements Constraint {
  id = 'SOFT_AVOID_LONG_CONSECUTIVE';
  name = '長時間連続勤務の回避';
  description = '連続勤務をなるべく短くする（推奨は5日以下）';
  type: 'SOFT' = 'SOFT';

  private readonly RECOMMENDED_MAX_CONSECUTIVE = 5;

  evaluate(schedule: Schedule, employees: Employee[]): ConstraintEvaluationResult {
    const violations: ConstraintViolation[] = [];
    let totalConsecutivePeriods = 0;
    let goodConsecutivePeriods = 0;

    employees.forEach(employee => {
      const assignments = ShiftAssignmentUtil.getAssignmentsByEmployee(schedule, employee.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      let consecutiveDays = 0;
      let consecutiveStartDate = '';

      assignments.forEach((assignment, index) => {
        const isWorkDay = assignment.shiftTypeId !== 'OFF' && assignment.shiftTypeId !== 'NIGHT_END';

        if (isWorkDay) {
          if (consecutiveDays === 0) {
            consecutiveStartDate = assignment.date;
          }
          consecutiveDays++;
        } else {
          if (consecutiveDays > 0) {
            totalConsecutivePeriods++;
            if (consecutiveDays <= this.RECOMMENDED_MAX_CONSECUTIVE) {
              goodConsecutivePeriods++;
            } else {
              violations.push({
                constraintId: this.id,
                constraintName: this.name,
                description: `${employee.name}が${consecutiveStartDate}から${consecutiveDays}日連続勤務（推奨は${this.RECOMMENDED_MAX_CONSECUTIVE}日以下）`,
                employeeId: employee.id,
                date: consecutiveStartDate,
                severity: consecutiveDays > 7 ? 'HIGH' : 'MEDIUM',
              });
            }
          }
          consecutiveDays = 0;
        }
      });

      // 最後まで連続勤務の場合
      if (consecutiveDays > 0) {
        totalConsecutivePeriods++;
        if (consecutiveDays <= this.RECOMMENDED_MAX_CONSECUTIVE) {
          goodConsecutivePeriods++;
        } else {
          violations.push({
            constraintId: this.id,
            constraintName: this.name,
            description: `${employee.name}が${consecutiveStartDate}から${consecutiveDays}日連続勤務（推奨は${this.RECOMMENDED_MAX_CONSECUTIVE}日以下）`,
            employeeId: employee.id,
            date: consecutiveStartDate,
            severity: consecutiveDays > 7 ? 'HIGH' : 'MEDIUM',
          });
        }
      }
    });

    const score = totalConsecutivePeriods > 0
      ? (goodConsecutivePeriods / totalConsecutivePeriods) * 100
      : 100;

    return {
      satisfied: violations.length === 0,
      violations,
      score,
    };
  }
}

/**
 * ソフト制約: 最小シフト数を満たす
 */
export class MinShiftsPerMonthConstraint implements Constraint {
  id = 'SOFT_MIN_SHIFTS_PER_MONTH';
  name = '月間最小シフト数';
  description = '従業員の月間最小シフト数を満たす';
  type: 'SOFT' = 'SOFT';

  evaluate(schedule: Schedule, employees: Employee[]): ConstraintEvaluationResult {
    const violations: ConstraintViolation[] = [];
    let totalEmployees = 0;
    let satisfiedEmployees = 0;

    employees.forEach(employee => {
      totalEmployees++;
      const assignments = ShiftAssignmentUtil.getAssignmentsByEmployee(schedule, employee.id);
      const workingShifts = assignments.filter(a => a.shiftTypeId !== 'OFF' && a.shiftTypeId !== 'NIGHT_END');

      if (workingShifts.length >= employee.minShiftsPerMonth) {
        satisfiedEmployees++;
      } else {
        violations.push({
          constraintId: this.id,
          constraintName: this.name,
          description: `${employee.name}の月間シフト数${workingShifts.length}が最小値${employee.minShiftsPerMonth}を下回っています`,
          employeeId: employee.id,
          severity: 'MEDIUM',
        });
      }
    });

    const score = totalEmployees > 0 ? (satisfiedEmployees / totalEmployees) * 100 : 100;

    return {
      satisfied: violations.length === 0,
      violations,
      score,
    };
  }
}

/**
 * すべてのソフト制約を取得
 */
export function getAllSoftConstraints(): Constraint[] {
  return [
    new RespectOffRequestsConstraint(),
    new FairNightShiftDistributionConstraint(),
    new RespectShiftPreferencesConstraint(),
    new AvoidLongConsecutiveWorkConstraint(),
    new MinShiftsPerMonthConstraint(),
  ];
}
