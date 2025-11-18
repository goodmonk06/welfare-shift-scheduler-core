import { describe, it, expect } from 'vitest';
import { STANDARD_SHIFT_TYPES, ShiftTypeUtil } from '../ShiftType';

describe('ShiftType', () => {
  describe('STANDARD_SHIFT_TYPES', () => {
    it('should have all required shift types', () => {
      expect(STANDARD_SHIFT_TYPES.EARLY).toBeDefined();
      expect(STANDARD_SHIFT_TYPES.DAY_A).toBeDefined();
      expect(STANDARD_SHIFT_TYPES.DAY_B).toBeDefined();
      expect(STANDARD_SHIFT_TYPES.LATE).toBeDefined();
      expect(STANDARD_SHIFT_TYPES.NIGHT_START).toBeDefined();
      expect(STANDARD_SHIFT_TYPES.NIGHT_END).toBeDefined();
      expect(STANDARD_SHIFT_TYPES.OFF).toBeDefined();
    });

    it('should have correct working hours', () => {
      expect(STANDARD_SHIFT_TYPES.EARLY.workingHours).toBe(8);
      expect(STANDARD_SHIFT_TYPES.DAY_A.workingHours).toBe(8);
      expect(STANDARD_SHIFT_TYPES.NIGHT_START.workingHours).toBe(16);
      expect(STANDARD_SHIFT_TYPES.OFF.workingHours).toBe(0);
    });

    it('should correctly identify night shifts', () => {
      expect(STANDARD_SHIFT_TYPES.NIGHT_START.isNightShift).toBe(true);
      expect(STANDARD_SHIFT_TYPES.EARLY.isNightShift).toBe(false);
      expect(STANDARD_SHIFT_TYPES.DAY_A.isNightShift).toBe(false);
    });
  });

  describe('ShiftTypeUtil', () => {
    describe('timeToMinutes', () => {
      it('should convert time string to minutes', () => {
        expect(ShiftTypeUtil.timeToMinutes('07:00')).toBe(420);
        expect(ShiftTypeUtil.timeToMinutes('16:30')).toBe(990);
        expect(ShiftTypeUtil.timeToMinutes('00:00')).toBe(0);
        expect(ShiftTypeUtil.timeToMinutes('23:59')).toBe(1439);
      });
    });

    describe('hasTimeOverlap', () => {
      it('should return false for OFF shifts', () => {
        const result = ShiftTypeUtil.hasTimeOverlap(
          STANDARD_SHIFT_TYPES.OFF,
          STANDARD_SHIFT_TYPES.DAY_A
        );
        expect(result).toBe(false);
      });

      it('should return true for night shifts overlapping with other shifts', () => {
        const result = ShiftTypeUtil.hasTimeOverlap(
          STANDARD_SHIFT_TYPES.NIGHT_START,
          STANDARD_SHIFT_TYPES.EARLY
        );
        expect(result).toBe(true);
      });
    });
  });
});
