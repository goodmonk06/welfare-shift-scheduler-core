import { Employee, Schedule } from '../domain';

/**
 * インメモリストレージ
 *
 * 本番環境では PostgreSQL などのデータベースに置き換える
 */
export class InMemoryStorage {
  private employees: Map<string, Employee> = new Map();
  private schedules: Map<string, Schedule> = new Map();

  // 従業員操作
  async createEmployee(employee: Employee): Promise<Employee> {
    if (this.employees.has(employee.id)) {
      throw new Error(`Employee with ID ${employee.id} already exists`);
    }
    this.employees.set(employee.id, employee);
    return employee;
  }

  async getEmployee(id: string): Promise<Employee | null> {
    return this.employees.get(id) || null;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    const existing = this.employees.get(id);
    if (!existing) {
      throw new Error(`Employee with ID ${id} not found`);
    }
    const updated = { ...existing, ...updates, id }; // IDは変更不可
    this.employees.set(id, updated);
    return updated;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    return this.employees.delete(id);
  }

  async getEmployeesByIds(ids: string[]): Promise<Employee[]> {
    return ids
      .map(id => this.employees.get(id))
      .filter((emp): emp is Employee => emp !== undefined);
  }

  // スケジュール操作
  async saveSchedule(schedule: Schedule): Promise<Schedule> {
    this.schedules.set(schedule.yearMonth, schedule);
    return schedule;
  }

  async getSchedule(yearMonth: string): Promise<Schedule | null> {
    return this.schedules.get(yearMonth) || null;
  }

  async getAllSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values());
  }

  async deleteSchedule(yearMonth: string): Promise<boolean> {
    return this.schedules.delete(yearMonth);
  }

  // ユーティリティ
  async clear(): Promise<void> {
    this.employees.clear();
    this.schedules.clear();
  }

  async getStats(): Promise<{
    employeeCount: number;
    scheduleCount: number;
  }> {
    return {
      employeeCount: this.employees.size,
      scheduleCount: this.schedules.size,
    };
  }
}

// シングルトンインスタンス
export const storage = new InMemoryStorage();
