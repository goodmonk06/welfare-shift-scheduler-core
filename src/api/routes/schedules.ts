import { Router } from 'express';
import { storage } from '../storage';
import { validateRequest, asyncHandler, AppError } from '../middleware';
import { generateScheduleSchema } from '../schemas';
import { NaiveSolver } from '../../solver';
import { getAllHardConstraints, getAllSoftConstraints } from '../../constraints';
import { STANDARD_SHIFT_TYPES } from '../../domain';

const router = Router();

/**
 * POST /api/schedules/generate
 * スケジュールを生成
 */
router.post(
  '/generate',
  validateRequest(generateScheduleSchema),
  asyncHandler(async (req, res) => {
    const { yearMonth, employeeIds, timeoutMs } = req.body;

    // 従業員を取得
    let employees = await storage.getAllEmployees();

    // 特定の従業員のみを対象とする場合
    if (employeeIds && employeeIds.length > 0) {
      employees = await storage.getEmployeesByIds(employeeIds);
      if (employees.length === 0) {
        throw new AppError(400, 'No valid employees found for the given IDs');
      }
    }

    if (employees.length === 0) {
      throw new AppError(400, 'No employees available. Please add employees first.');
    }

    // スケジュール生成
    const solver = new NaiveSolver();
    const result = await solver.generateSchedule({
      yearMonth,
      employees,
      shiftTypes: Object.values(STANDARD_SHIFT_TYPES),
      hardConstraints: getAllHardConstraints(),
      softConstraints: getAllSoftConstraints(),
      timeoutMs: timeoutMs || 30000,
    });

    // 保存
    await storage.saveSchedule(result.schedule);

    res.status(201).json({
      success: result.success,
      data: {
        schedule: result.schedule,
        feasible: result.feasible,
        totalViolations: result.totalViolations,
        overallScore: result.overallScore,
      },
      message: result.feasible
        ? 'Schedule generated successfully'
        : 'Schedule generated with constraint violations',
    });
  })
);

/**
 * GET /api/schedules/:yearMonth
 * スケジュールを取得
 */
router.get(
  '/:yearMonth',
  asyncHandler(async (req, res) => {
    const { yearMonth } = req.params;

    // yearMonth形式のバリデーション
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
      throw new AppError(400, 'Invalid yearMonth format. Expected YYYY-MM');
    }

    const schedule = await storage.getSchedule(yearMonth);

    if (!schedule) {
      throw new AppError(404, `Schedule for ${yearMonth} not found`);
    }

    res.json({
      success: true,
      data: schedule,
    });
  })
);

/**
 * GET /api/schedules
 * すべてのスケジュールを取得
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const schedules = await storage.getAllSchedules();

    res.json({
      success: true,
      data: schedules,
      count: schedules.length,
    });
  })
);

/**
 * DELETE /api/schedules/:yearMonth
 * スケジュールを削除
 */
router.delete(
  '/:yearMonth',
  asyncHandler(async (req, res) => {
    const { yearMonth } = req.params;
    const deleted = await storage.deleteSchedule(yearMonth);

    if (!deleted) {
      throw new AppError(404, `Schedule for ${yearMonth} not found`);
    }

    res.json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  })
);

export default router;
