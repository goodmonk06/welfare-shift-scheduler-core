import { describe, it, expect } from 'vitest';
import {
  NoDoubleBookingConstraint,
  NoShiftAfterNightShiftConstraint,
  RespectUnavailableDatesConstraint,
} from '../hardConstraints';
import { Employee, Schedule, Role, Skill, EmploymentType } from '../../domain';

describe('Hard Constraints', () => {
  const sampleEmployee: Employee = {
    id: 'E001',
    name: 'Test Employee',
    role: Role.CARE_WORKER,
    skills: [Skill.CARE_SKILLS, Skill.NIGHT_SHIFT_CAPABLE],
    employmentType: EmploymentType.FULL_TIME,
    maxShiftsPerMonth: 22,
    minShiftsPerMonth: 20,
    maxConsecutiveWorkDays: 6,
    maxWeeklyHours: 40,
    maxMonthlyHours: 180,
    preferences: [],
    unavailableDates: ['2025-01-15'],
  };

  describe('NoDoubleBookingConstraint', () => {
    it('should pass when employee has no double bookings', () => {
      const constraint = new NoDoubleBookingConstraint();
      const schedule: Schedule = {
        yearMonth: '2025-01',
        assignments: [
          { employeeId: 'E001', date: '2025-01-01', shiftTypeId: 'DAY_A' },
          { employeeId: 'E001', date: '2025-01-02', shiftTypeId: 'DAY_B' },
        ],
        generatedAt: new Date(),
      };

      const result = constraint.evaluate(schedule, [sampleEmployee]);

      expect(result.satisfied).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail when employee has double bookings', () => {
      const constraint = new NoDoubleBookingConstraint();
      const schedule: Schedule = {
        yearMonth: '2025-01',
        assignments: [
          { employeeId: 'E001', date: '2025-01-01', shiftTypeId: 'DAY_A' },
          { employeeId: 'E001', date: '2025-01-01', shiftTypeId: 'LATE' },
        ],
        generatedAt: new Date(),
      };

      const result = constraint.evaluate(schedule, [sampleEmployee]);

      expect(result.satisfied).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].severity).toBe('CRITICAL');
    });

    it('should allow OFF shift on the same day', () => {
      const constraint = new NoDoubleBookingConstraint();
      const schedule: Schedule = {
        yearMonth: '2025-01',
        assignments: [
          { employeeId: 'E001', date: '2025-01-01', shiftTypeId: 'OFF' },
        ],
        generatedAt: new Date(),
      };

      const result = constraint.evaluate(schedule, [sampleEmployee]);

      expect(result.satisfied).toBe(true);
    });
  });

  describe('NoShiftAfterNightShiftConstraint', () => {
    it('should pass when no shifts after night shift', () => {
      const constraint = new NoShiftAfterNightShiftConstraint();
      const schedule: Schedule = {
        yearMonth: '2025-01',
        assignments: [
          { employeeId: 'E001', date: '2025-01-01', shiftTypeId: 'NIGHT_START' },
          { employeeId: 'E001', date: '2025-01-02', shiftTypeId: 'NIGHT_END' },
          { employeeId: 'E001', date: '2025-01-03', shiftTypeId: 'OFF' },
        ],
        generatedAt: new Date(),
      };

      const result = constraint.evaluate(schedule, [sampleEmployee]);

      expect(result.satisfied).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail when shift assigned after night shift', () => {
      const constraint = new NoShiftAfterNightShiftConstraint();
      const schedule: Schedule = {
        yearMonth: '2025-01',
        assignments: [
          { employeeId: 'E001', date: '2025-01-01', shiftTypeId: 'NIGHT_START' },
          { employeeId: 'E001', date: '2025-01-02', shiftTypeId: 'DAY_A' },
        ],
        generatedAt: new Date(),
      };

      const result = constraint.evaluate(schedule, [sampleEmployee]);

      expect(result.satisfied).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('RespectUnavailableDatesConstraint', () => {
    it('should pass when unavailable dates are respected', () => {
      const constraint = new RespectUnavailableDatesConstraint();
      const schedule: Schedule = {
        yearMonth: '2025-01',
        assignments: [
          { employeeId: 'E001', date: '2025-01-15', shiftTypeId: 'OFF' },
        ],
        generatedAt: new Date(),
      };

      const result = constraint.evaluate(schedule, [sampleEmployee]);

      expect(result.satisfied).toBe(true);
    });

    it('should fail when shift assigned on unavailable date', () => {
      const constraint = new RespectUnavailableDatesConstraint();
      const schedule: Schedule = {
        yearMonth: '2025-01',
        assignments: [
          { employeeId: 'E001', date: '2025-01-15', shiftTypeId: 'DAY_A' },
        ],
        generatedAt: new Date(),
      };

      const result = constraint.evaluate(schedule, [sampleEmployee]);

      expect(result.satisfied).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].date).toBe('2025-01-15');
    });
  });
});
