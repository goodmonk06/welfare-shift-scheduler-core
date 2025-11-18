import { z } from 'zod';
import { Role, Skill, EmploymentType } from '../domain';

/**
 * API バリデーションスキーマ
 */

// 共通スキーマ
export const workPreferenceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredShiftId: z.string(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

// 従業員スキーマ
export const createEmployeeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.nativeEnum(Role),
  skills: z.array(z.nativeEnum(Skill)),
  employmentType: z.nativeEnum(EmploymentType),
  maxShiftsPerMonth: z.number().int().min(0).max(31),
  minShiftsPerMonth: z.number().int().min(0).max(31),
  maxNightShiftsPerMonth: z.number().int().min(0).max(31).optional(),
  minNightShiftsPerMonth: z.number().int().min(0).max(31).optional(),
  maxConsecutiveWorkDays: z.number().int().min(1).max(31),
  maxWeeklyHours: z.number().min(0),
  maxMonthlyHours: z.number().min(0),
  preferences: z.array(workPreferenceSchema).default([]),
  unavailableDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).default([]),
  notes: z.string().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({ id: true });

// スケジュール生成スキーマ
export const generateScheduleSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
  employeeIds: z.array(z.string()).optional(),
  timeoutMs: z.number().int().min(1000).max(300000).optional(),
});

// レスポンススキーマ
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.any().optional(),
});

export const successResponseSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  message: z.string().optional(),
});

// 型エクスポート
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type GenerateScheduleInput = z.infer<typeof generateScheduleSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type SuccessResponse = z.infer<typeof successResponseSchema>;
