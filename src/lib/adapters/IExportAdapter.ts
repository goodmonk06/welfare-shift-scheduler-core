/**
 * Export adapter interface
 *
 * Abstraction for exporting schedules to various formats
 */

import { Schedule } from '../../domain';

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'ical';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  locale?: string;
  timezone?: string;
  customTemplate?: string;
}

export interface ExportResult {
  success: boolean;
  data?: Buffer | string;
  filename?: string;
  mimeType?: string;
  error?: string;
}

/**
 * Export adapter interface
 */
export interface IExportAdapter {
  /**
   * Export schedule to specified format
   */
  export(schedule: Schedule, options: ExportOptions): Promise<ExportResult>;

  /**
   * Check if format is supported
   */
  supports(format: ExportFormat): boolean;
}

/**
 * CSV export adapter (simple implementation)
 */
export class CSVExportAdapter implements IExportAdapter {
  supports(format: ExportFormat): boolean {
    return format === 'csv';
  }

  async export(schedule: Schedule, options: ExportOptions): Promise<ExportResult> {
    if (!this.supports(options.format)) {
      return {
        success: false,
        error: `Format ${options.format} not supported`,
      };
    }

    try {
      const lines: string[] = [];

      // Header
      lines.push('Employee ID,Employee Name,Date,Shift Type');

      // Data rows
      schedule.assignments.forEach(assignment => {
        lines.push(
          `${assignment.employeeId},,${assignment.date},${assignment.shiftTypeId}`
        );
      });

      const csvData = lines.join('\n');

      return {
        success: true,
        data: csvData,
        filename: `schedule-${schedule.yearMonth}.csv`,
        mimeType: 'text/csv',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }
}

/**
 * No-op export adapter (returns empty result)
 */
export class NoOpExportAdapter implements IExportAdapter {
  supports(): boolean {
    return false;
  }

  async export(): Promise<ExportResult> {
    return {
      success: false,
      error: 'Export not implemented',
    };
  }
}
