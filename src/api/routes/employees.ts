import { Router } from 'express';
import { storage } from '../storage';
import { validateRequest, asyncHandler, AppError } from '../middleware';
import { createEmployeeSchema, updateEmployeeSchema } from '../schemas';

const router = Router();

/**
 * GET /api/employees
 * 従業員一覧を取得
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const employees = await storage.getAllEmployees();
    res.json({
      success: true,
      data: employees,
      count: employees.length,
    });
  })
);

/**
 * GET /api/employees/:id
 * 従業員詳細を取得
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employee = await storage.getEmployee(id);

    if (!employee) {
      throw new AppError(404, `Employee with ID ${id} not found`);
    }

    res.json({
      success: true,
      data: employee,
    });
  })
);

/**
 * POST /api/employees
 * 従業員を作成
 */
router.post(
  '/',
  validateRequest(createEmployeeSchema),
  asyncHandler(async (req, res) => {
    const employee = await storage.createEmployee(req.body);

    res.status(201).json({
      success: true,
      data: employee,
      message: 'Employee created successfully',
    });
  })
);

/**
 * PUT /api/employees/:id
 * 従業員を更新
 */
router.put(
  '/:id',
  validateRequest(updateEmployeeSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employee = await storage.updateEmployee(id, req.body);

    res.json({
      success: true,
      data: employee,
      message: 'Employee updated successfully',
    });
  })
);

/**
 * DELETE /api/employees/:id
 * 従業員を削除
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await storage.deleteEmployee(id);

    if (!deleted) {
      throw new AppError(404, `Employee with ID ${id} not found`);
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  })
);

export default router;
