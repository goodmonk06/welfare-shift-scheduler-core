import { describe, it, expect } from 'vitest';
import { NaiveSolver } from '../NaiveSolver';
import { Employee, Role, Skill, EmploymentType, STANDARD_SHIFT_TYPES } from '../../domain';
import { getAllHardConstraints, getAllSoftConstraints } from '../../constraints';

describe('NaiveSolver', () => {
  const sampleEmployees: Employee[] = [
    {
      id: 'E001',
      name: 'Employee 1',
      role: Role.CARE_WORKER,
      skills: [Skill.CARE_SKILLS, Skill.NIGHT_SHIFT_CAPABLE],
      employmentType: EmploymentType.FULL_TIME,
      maxShiftsPerMonth: 22,
      minShiftsPerMonth: 20,
      maxConsecutiveWorkDays: 6,
      maxWeeklyHours: 40,
      maxMonthlyHours: 180,
      preferences: [],
      unavailableDates: [],
    },
    {
      id: 'E002',
      name: 'Employee 2',
      role: Role.NURSE,
      skills: [Skill.CARE_SKILLS, Skill.NIGHT_SHIFT_CAPABLE, Skill.MEDICAL_TREATMENT],
      employmentType: EmploymentType.FULL_TIME,
      maxShiftsPerMonth: 22,
      minShiftsPerMonth: 20,
      maxConsecutiveWorkDays: 6,
      maxWeeklyHours: 40,
      maxMonthlyHours: 180,
      preferences: [],
      unavailableDates: [],
    },
  ];

  it('should generate a schedule successfully', async () => {
    const solver = new NaiveSolver();
    const result = await solver.generateSchedule({
      yearMonth: '2025-01',
      employees: sampleEmployees,
      shiftTypes: Object.values(STANDARD_SHIFT_TYPES),
      hardConstraints: getAllHardConstraints(),
      softConstraints: getAllSoftConstraints(),
    });

    expect(result.success).toBe(true);
    expect(result.schedule).toBeDefined();
    expect(result.schedule.yearMonth).toBe('2025-01');
    expect(result.schedule.assignments.length).toBeGreaterThan(0);
  });

  it('should assign shifts to all employees', async () => {
    const solver = new NaiveSolver();
    const result = await solver.generateSchedule({
      yearMonth: '2025-01',
      employees: sampleEmployees,
      shiftTypes: Object.values(STANDARD_SHIFT_TYPES),
      hardConstraints: getAllHardConstraints(),
      softConstraints: getAllSoftConstraints(),
    });

    const employeeIds = new Set(
      result.schedule.assignments.map(a => a.employeeId)
    );

    expect(employeeIds.size).toBe(sampleEmployees.length);
    sampleEmployees.forEach(emp => {
      expect(employeeIds.has(emp.id)).toBe(true);
    });
  });

  it('should calculate feasibility and score', async () => {
    const solver = new NaiveSolver();
    const result = await solver.generateSchedule({
      yearMonth: '2025-01',
      employees: sampleEmployees,
      shiftTypes: Object.values(STANDARD_SHIFT_TYPES),
      hardConstraints: getAllHardConstraints(),
      softConstraints: getAllSoftConstraints(),
    });

    expect(typeof result.feasible).toBe('boolean');
    expect(typeof result.overallScore).toBe('number');
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('should include metadata in schedule', async () => {
    const solver = new NaiveSolver();
    const result = await solver.generateSchedule({
      yearMonth: '2025-01',
      employees: sampleEmployees,
      shiftTypes: Object.values(STANDARD_SHIFT_TYPES),
      hardConstraints: getAllHardConstraints(),
      softConstraints: getAllSoftConstraints(),
    });

    expect(result.schedule.metadata).toBeDefined();
    expect(result.schedule.metadata?.generationTimeMs).toBeGreaterThan(0);
  });

  it('should handle empty employee list gracefully', async () => {
    const solver = new NaiveSolver();
    const result = await solver.generateSchedule({
      yearMonth: '2025-01',
      employees: [],
      shiftTypes: Object.values(STANDARD_SHIFT_TYPES),
      hardConstraints: getAllHardConstraints(),
      softConstraints: getAllSoftConstraints(),
    });

    expect(result.success).toBe(true);
    expect(result.schedule.assignments).toHaveLength(0);
  });
});
