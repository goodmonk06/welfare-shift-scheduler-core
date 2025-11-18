import {
  Employee,
  Role,
  Skill,
  EmploymentType,
  STANDARD_SHIFT_TYPES,
  ShiftType,
} from '../domain';
import { getAllHardConstraints, getAllSoftConstraints } from '../constraints';
import { NaiveSolver, ScheduleGenerationRequest } from '../solver';

/**
 * 小規模介護施設のサンプルデータ
 */
function createSampleEmployees(): Employee[] {
  return [
    {
      id: 'E001',
      name: '佐藤 太郎',
      role: Role.CARE_WORKER,
      skills: [Skill.CARE_SKILLS, Skill.NIGHT_SHIFT_CAPABLE, Skill.DEMENTIA_CARE],
      employmentType: EmploymentType.FULL_TIME,
      maxShiftsPerMonth: 22,
      minShiftsPerMonth: 20,
      maxNightShiftsPerMonth: 5,
      minNightShiftsPerMonth: 3,
      maxConsecutiveWorkDays: 6,
      maxWeeklyHours: 40,
      maxMonthlyHours: 180,
      preferences: [
        { date: '2025-01-05', preferredShiftId: 'OFF', priority: 3 },
        { date: '2025-01-12', preferredShiftId: 'OFF', priority: 2 },
      ],
      unavailableDates: [],
    },
    {
      id: 'E002',
      name: '鈴木 花子',
      role: Role.NURSE,
      skills: [Skill.MEDICAL_TREATMENT, Skill.NIGHT_SHIFT_CAPABLE, Skill.CARE_SKILLS],
      employmentType: EmploymentType.FULL_TIME,
      maxShiftsPerMonth: 22,
      minShiftsPerMonth: 20,
      maxNightShiftsPerMonth: 6,
      minNightShiftsPerMonth: 4,
      maxConsecutiveWorkDays: 6,
      maxWeeklyHours: 40,
      maxMonthlyHours: 180,
      preferences: [
        { date: '2025-01-10', preferredShiftId: 'DAY_A', priority: 2 },
        { date: '2025-01-20', preferredShiftId: 'OFF', priority: 3 },
      ],
      unavailableDates: ['2025-01-15'],
    },
    {
      id: 'E003',
      name: '田中 一郎',
      role: Role.CARE_WORKER,
      skills: [Skill.CARE_SKILLS, Skill.NIGHT_SHIFT_CAPABLE, Skill.BATHING_ASSISTANCE],
      employmentType: EmploymentType.FULL_TIME,
      maxShiftsPerMonth: 22,
      minShiftsPerMonth: 20,
      maxNightShiftsPerMonth: 5,
      minNightShiftsPerMonth: 3,
      maxConsecutiveWorkDays: 6,
      maxWeeklyHours: 40,
      maxMonthlyHours: 180,
      preferences: [
        { date: '2025-01-08', preferredShiftId: 'OFF', priority: 3 },
      ],
      unavailableDates: [],
    },
    {
      id: 'E004',
      name: '山田 美咲',
      role: Role.CARE_ASSISTANT,
      skills: [Skill.CARE_SKILLS, Skill.MEAL_ASSISTANCE],
      employmentType: EmploymentType.PART_TIME,
      maxShiftsPerMonth: 15,
      minShiftsPerMonth: 12,
      maxConsecutiveWorkDays: 5,
      maxWeeklyHours: 30,
      maxMonthlyHours: 120,
      preferences: [
        { date: '2025-01-13', preferredShiftId: 'OFF', priority: 3 },
        { date: '2025-01-27', preferredShiftId: 'OFF', priority: 3 },
      ],
      unavailableDates: [],
      notes: '夜勤不可',
    },
    {
      id: 'E005',
      name: '高橋 健太',
      role: Role.CARE_WORKER,
      skills: [Skill.CARE_SKILLS, Skill.NIGHT_SHIFT_CAPABLE, Skill.REHABILITATION],
      employmentType: EmploymentType.FULL_TIME,
      maxShiftsPerMonth: 22,
      minShiftsPerMonth: 20,
      maxNightShiftsPerMonth: 5,
      minNightShiftsPerMonth: 3,
      maxConsecutiveWorkDays: 6,
      maxWeeklyHours: 40,
      maxMonthlyHours: 180,
      preferences: [
        { date: '2025-01-18', preferredShiftId: 'OFF', priority: 2 },
      ],
      unavailableDates: [],
    },
    {
      id: 'E006',
      name: '伊藤 由美',
      role: Role.CARE_WORKER,
      skills: [Skill.CARE_SKILLS, Skill.DEMENTIA_CARE],
      employmentType: EmploymentType.PART_TIME,
      maxShiftsPerMonth: 15,
      minShiftsPerMonth: 12,
      maxConsecutiveWorkDays: 5,
      maxWeeklyHours: 30,
      maxMonthlyHours: 120,
      preferences: [
        { date: '2025-01-06', preferredShiftId: 'OFF', priority: 3 },
        { date: '2025-01-21', preferredShiftId: 'OFF', priority: 2 },
      ],
      unavailableDates: [],
      notes: '夜勤不可',
    },
  ];
}

/**
 * 使用するシフトタイプを取得
 */
function getShiftTypes(): ShiftType[] {
  return [
    STANDARD_SHIFT_TYPES.EARLY,
    STANDARD_SHIFT_TYPES.DAY_A,
    STANDARD_SHIFT_TYPES.DAY_B,
    STANDARD_SHIFT_TYPES.LATE,
    STANDARD_SHIFT_TYPES.NIGHT_START,
    STANDARD_SHIFT_TYPES.NIGHT_END,
    STANDARD_SHIFT_TYPES.OFF,
  ];
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('='.repeat(60));
  console.log('介護施設シフト自動生成エンジン - サンプル実行');
  console.log('='.repeat(60));
  console.log();

  // サンプルデータの作成
  const employees = createSampleEmployees();
  const shiftTypes = getShiftTypes();
  const hardConstraints = getAllHardConstraints();
  const softConstraints = getAllSoftConstraints();

  console.log(`従業員数: ${employees.length}名`);
  employees.forEach(emp => {
    console.log(`  - ${emp.name} (${emp.role}) [${emp.employmentType}]`);
  });
  console.log();

  console.log(`シフトタイプ数: ${shiftTypes.length}種類`);
  shiftTypes.forEach(shift => {
    if (shift.id !== 'OFF' && shift.id !== 'NIGHT_END') {
      console.log(`  - ${shift.name} (${shift.startTime}-${shift.endTime}, 必要人数: ${shift.requiredStaff})`);
    }
  });
  console.log();

  // スケジュール生成リクエストの作成
  const request: ScheduleGenerationRequest = {
    yearMonth: '2025-01',
    employees,
    shiftTypes,
    hardConstraints,
    softConstraints,
    timeoutMs: 30000,
  };

  // ソルバーの作成と実行
  const solver = new NaiveSolver();
  console.log(`ソルバー: ${solver.getName()}`);
  console.log('スケジュール生成中...');
  console.log();

  const result = await solver.generateSchedule(request);

  // 結果の表示
  console.log('='.repeat(60));
  console.log('生成結果');
  console.log('='.repeat(60));
  console.log(`成功: ${result.success ? 'はい' : 'いいえ'}`);
  console.log(`実行可能: ${result.feasible ? 'はい（ハード制約を満たす）' : 'いいえ（ハード制約違反あり）'}`);
  console.log(`違反数: ${result.totalViolations}`);
  console.log(`満足度スコア: ${result.overallScore.toFixed(2)}点`);
  console.log(`生成時間: ${result.schedule.metadata?.generationTimeMs}ms`);
  console.log();

  if (result.errorMessage) {
    console.error(`エラー: ${result.errorMessage}`);
    return;
  }

  // シフト割り当てのサマリー
  console.log('='.repeat(60));
  console.log('従業員別シフト数');
  console.log('='.repeat(60));
  employees.forEach(emp => {
    const empAssignments = result.schedule.assignments.filter(a => a.employeeId === emp.id);
    const workShifts = empAssignments.filter(a => a.shiftTypeId !== 'OFF' && a.shiftTypeId !== 'NIGHT_END');
    const nightShifts = empAssignments.filter(a => {
      const shift = STANDARD_SHIFT_TYPES[a.shiftTypeId];
      return shift?.isNightShift;
    });

    console.log(`${emp.name}:`);
    console.log(`  勤務日数: ${workShifts.length}日 (最小${emp.minShiftsPerMonth}~最大${emp.maxShiftsPerMonth})`);
    if (emp.maxNightShiftsPerMonth) {
      console.log(`  夜勤回数: ${nightShifts.length}回 (最小${emp.minNightShiftsPerMonth || 0}~最大${emp.maxNightShiftsPerMonth})`);
    }
  });
  console.log();

  // 制約評価の詳細
  console.log('='.repeat(60));
  console.log('制約評価');
  console.log('='.repeat(60));

  console.log('ハード制約:');
  for (const constraint of hardConstraints) {
    const evalResult = constraint.evaluate(result.schedule, employees);
    const status = evalResult.satisfied ? '✓' : '✗';
    console.log(`  ${status} ${constraint.name}: ${evalResult.violations.length}件の違反`);
    if (evalResult.violations.length > 0 && evalResult.violations.length <= 3) {
      evalResult.violations.forEach(v => {
        console.log(`      - ${v.description}`);
      });
    }
  }
  console.log();

  console.log('ソフト制約:');
  for (const constraint of softConstraints) {
    const evalResult = constraint.evaluate(result.schedule, employees);
    const status = evalResult.satisfied ? '✓' : '△';
    const score = evalResult.score?.toFixed(1) || 'N/A';
    console.log(`  ${status} ${constraint.name}: スコア ${score}点 (違反${evalResult.violations.length}件)`);
  }
  console.log();

  // サンプルスケジュール表示（最初の7日間）
  console.log('='.repeat(60));
  console.log('サンプルスケジュール（1月1日～7日）');
  console.log('='.repeat(60));
  for (let day = 1; day <= 7; day++) {
    const dateStr = `2025-01-${day.toString().padStart(2, '0')}`;
    console.log(`\n${dateStr}:`);

    employees.forEach(emp => {
      const assignment = result.schedule.assignments.find(
        a => a.employeeId === emp.id && a.date === dateStr
      );
      const shiftName = assignment ? STANDARD_SHIFT_TYPES[assignment.shiftTypeId]?.name || assignment.shiftTypeId : '未割当';
      console.log(`  ${emp.name}: ${shiftName}`);
    });
  }

  console.log();
  console.log('='.repeat(60));
  console.log('完了');
  console.log('='.repeat(60));
}

// 実行
main().catch(error => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
