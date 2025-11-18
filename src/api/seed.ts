/**
 * Seed データ投入スクリプト
 *
 * デモ用の従業員データを投入し、サンプルスケジュールを生成する
 */
import { storage } from './storage';
import { Employee, Role, Skill, EmploymentType } from '../domain';

const sampleEmployees: Employee[] = [
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

async function seed() {
  console.log('='.repeat(60));
  console.log('Seeding database...');
  console.log('='.repeat(60));

  try {
    // 既存データをクリア
    await storage.clear();
    console.log('✓ Cleared existing data');

    // 従業員データを投入
    for (const employee of sampleEmployees) {
      await storage.createEmployee(employee);
      console.log(`✓ Created employee: ${employee.name} (${employee.id})`);
    }

    console.log();
    console.log('='.repeat(60));
    console.log(`Seed completed successfully!`);
    console.log(`Total employees: ${sampleEmployees.length}`);
    console.log('='.repeat(60));
    console.log();
    console.log('You can now:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Generate a schedule:');
    console.log('   POST http://localhost:3000/api/schedules/generate');
    console.log('   Body: {"yearMonth": "2025-01"}');
    console.log();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// スクリプトとして直接実行された場合
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seed };
