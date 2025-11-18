import {
  Employee,
  Schedule,
  ShiftAssignment,
  ShiftAssignmentUtil,
  EmployeeUtil,
  STANDARD_SHIFT_TYPES,
} from '../domain';
import { Constraint, ConstraintEvaluationResult, ConstraintViolation } from './types';

/**
 * ハード制約: 同じ従業員が同じ日に複数のシフト（OFF以外）に割り当てられていないか
 */
export class NoDoubleBookingConstraint implements Constraint {
  id = 'HARD_NO_DOUBLE_BOOKING';
  name = '二重予約禁止';
  description = '同じ従業員が同じ日に複数のシフト（OFF以外）に割り当てられてはいけない';
  type: 'HARD' = 'HARD';

  evaluate(schedule: Schedule, employees: Employee[]): ConstraintEvaluationResult {
    const violations: ConstraintViolation[] = [];

    employees.forEach(employee => {
      const assignments = ShiftAssignmentUtil.getAssignmentsByEmployee(schedule, employee.id);

      // 日付ごとにグループ化
      const assignmentsByDate = new Map<string, ShiftAssignment[]>();
      assignments.forEach(assignment => {
        const existing = assignmentsByDate.get(assignment.date) || [];
        existing.push(assignment);
        assignmentsByDate.set(assignment.date, existing);
      });

      // 同じ日に複数のシフト（OFF以外）があるかチェック
      assignmentsByDate.forEach((dayAssignments, date) => {
        const nonOffShifts = dayAssignments.filter(a => a.shiftTypeId !== 'OFF');
        if (nonOffShifts.length > 1) {
          violations.push({
            constraintId: this.id,
            constraintName: this.name,
            description: `${employee.name}が${date}に${nonOffShifts.length}個のシフトに割り当てられています`,
            employeeId: employee.id,
            date,
            severity: 'CRITICAL',
          });
        }
      });
    });

    return {
      satisfied: violations.length === 0,
      violations,
    };
  }
}

/**
 * ハード制約: 夜勤明けの日は他のシフトに入れない
 */
export class NoShiftAfterNightShiftConstraint implements Constraint {
  id = 'HARD_NO_SHIFT_AFTER_NIGHT';
  name = '夜勤明け後の勤務禁止';
  description = '夜勤明けの日（夜勤入りの翌日）は他のシフトに入れない';
  type: 'HARD' = 'HARD';

  evaluate(schedule: Schedule, employees: Employee[]): ConstraintEvaluationResult {
    const violations: ConstraintViolation[] = [];

    employees.forEach(employee => {
      const assignments = ShiftAssignmentUtil.getAssignmentsByEmployee(schedule, employee.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      for (let i = 0; i < assignments.length - 1; i++) {
        const current = assignments[i];
        const next = assignments[i + 1];

        // 夜勤入りの翌日かチェック
        const currentShift = STANDARD_SHIFT_TYPES[current.shiftTypeId];
        if (currentShift?.isNightShiftStart) {
          const currentDate = new Date(current.date);
          const nextDate = new Date(next.date);
          const diffDays = Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

          // 翌日に夜勤明け以外のシフトがある場合は違反
          if (diffDays === 1 && next.shiftTypeId !== 'NIGHT_END' && next.shiftTypeId !== 'OFF') {
            violations.push({
              constraintId: this.id,
              constraintName: this.name,
              description: `${employee.name}が${current.date}に夜勤入りをした翌日${next.date}に${next.shiftTypeId}が割り当てられています`,
              employeeId: employee.id,
              date: next.date,
              severity: 'CRITICAL',
            });
          }
        }
      }
    });

    return {
      satisfied: violations.length === 0,
      violations,
    };
  }
}

/**
 * ハード制約: 勤務不可日には割り当てない
 */
export class RespectUnavailableDatesConstraint implements Constraint {
  id = 'HARD_RESPECT_UNAVAILABLE';
  name = '勤務不可日の遵守';
  description = '従業員が指定した勤務不可日には割り当てない';
  type: 'HARD' = 'HARD';

  evaluate(schedule: Schedule, employees: Employee[]): ConstraintEvaluationResult {
    const violations: ConstraintViolation[] = [];

    employees.forEach(employee => {
      employee.unavailableDates.forEach(unavailableDate => {
        const assignment = ShiftAssignmentUtil.getAssignment(schedule, employee.id, unavailableDate);
        if (assignment && assignment.shiftTypeId !== 'OFF') {
          violations.push({
            constraintId: this.id,
            constraintName: this.name,
            description: `${employee.name}の勤務不可日${unavailableDate}に${assignment.shiftTypeId}が割り当てられています`,
            employeeId: employee.id,
            date: unavailableDate,
            severity: 'CRITICAL',
          });
        }
      });
    });

    return {
      satisfied: violations.length === 0,
      violations,
    };
  }
}

/**
 * ハード制約: 月間最大シフト数を超えない
 */
export class MaxShiftsPerMonthConstraint implements Constraint {
  id = 'HARD_MAX_SHIFTS_PER_MONTH';
  name = '月間最大シフト数';
  description = '従業員の月間最大シフト数を超えてはいけない';
  type: 'HARD' = 'HARD';

  evaluate(schedule: Schedule, employees: Employee[]): ConstraintEvaluationResult {
    const violations: ConstraintViolation[] = [];

    employees.forEach(employee => {
      const assignments = ShiftAssignmentUtil.getAssignmentsByEmployee(schedule, employee.id);
      const workingShifts = assignments.filter(a => a.shiftTypeId !== 'OFF' && a.shiftTypeId !== 'NIGHT_END');

      if (workingShifts.length > employee.maxShiftsPerMonth) {
        violations.push({
          constraintId: this.id,
          constraintName: this.name,
          description: `${employee.name}の月間シフト数${workingShifts.length}が最大値${employee.maxShiftsPerMonth}を超えています`,
          employeeId: employee.id,
          severity: 'CRITICAL',
        });
      }
    });

    return {
      satisfied: violations.length === 0,
      violations,
    };
  }
}

/**
 * ハード制約: 連続勤務日数を超えない
 */
export class MaxConsecutiveWorkDaysConstraint implements Constraint {
  id = 'HARD_MAX_CONSECUTIVE_WORK';
  name = '最大連続勤務日数';
  description = '従業員の連続勤務日数の上限を超えてはいけない';
  type: 'HARD' = 'HARD';

  evaluate(schedule: Schedule, employees: Employee[]): ConstraintEvaluationResult {
    const violations: ConstraintViolation[] = [];

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

          if (consecutiveDays > employee.maxConsecutiveWorkDays) {
            violations.push({
              constraintId: this.id,
              constraintName: this.name,
              description: `${employee.name}が${consecutiveStartDate}から${assignment.date}まで${consecutiveDays}日連続勤務で、上限${employee.maxConsecutiveWorkDays}日を超えています`,
              employeeId: employee.id,
              date: assignment.date,
              severity: 'CRITICAL',
            });
          }
        } else {
          consecutiveDays = 0;
        }
      });
    });

    return {
      satisfied: violations.length === 0,
      violations,
    };
  }
}

/**
 * ハード制約: 夜勤可能スキルがない従業員は夜勤に入れない
 */
export class NightShiftCapabilityConstraint implements Constraint {
  id = 'HARD_NIGHT_SHIFT_CAPABILITY';
  name = '夜勤可能スキル';
  description = '夜勤可能スキルを持たない従業員は夜勤に入れない';
  type: 'HARD' = 'HARD';

  evaluate(schedule: Schedule, employees: Employee[]): ConstraintEvaluationResult {
    const violations: ConstraintViolation[] = [];

    employees.forEach(employee => {
      if (!EmployeeUtil.canWorkNightShift(employee)) {
        const assignments = ShiftAssignmentUtil.getAssignmentsByEmployee(schedule, employee.id);
        assignments.forEach(assignment => {
          const shift = STANDARD_SHIFT_TYPES[assignment.shiftTypeId];
          if (shift?.isNightShift) {
            violations.push({
              constraintId: this.id,
              constraintName: this.name,
              description: `${employee.name}は夜勤不可ですが、${assignment.date}に夜勤が割り当てられています`,
              employeeId: employee.id,
              date: assignment.date,
              severity: 'CRITICAL',
            });
          }
        });
      }
    });

    return {
      satisfied: violations.length === 0,
      violations,
    };
  }
}

/**
 * すべてのハード制約を取得
 */
export function getAllHardConstraints(): Constraint[] {
  return [
    new NoDoubleBookingConstraint(),
    new NoShiftAfterNightShiftConstraint(),
    new RespectUnavailableDatesConstraint(),
    new MaxShiftsPerMonthConstraint(),
    new MaxConsecutiveWorkDaysConstraint(),
    new NightShiftCapabilityConstraint(),
  ];
}
