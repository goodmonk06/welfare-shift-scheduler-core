# welfare-shift-scheduler-core

介護・福祉事業所向けのシフト自動生成エンジン。制約条件・ロール・勤務パターンを定義して最適化するコアライブラリ。

## 特徴

- 日本の介護施設に特化したシフトタイプ（早番、日勤A/B、遅番、夜勤入り/明けなど）
- ハード制約とソフト制約の柔軟な定義
- 拡張可能なソルバーインターフェース
- TypeScriptによる型安全な実装
- インメモリ動作でDBレスで利用可能

## Tech Stack

- Node.js 20+
- TypeScript 5.3+
- 将来的にOR-Toolsなどの制約ソルバーと統合可能

## インストール

```bash
npm install welfare-shift-scheduler-core
```

## クイックスタート

### 基本的な使い方

```typescript
import {
  generateSchedule,
  Employee,
  Role,
  Skill,
  EmploymentType,
} from 'welfare-shift-scheduler-core';

// 従業員データの準備
const employees: Employee[] = [
  {
    id: 'E001',
    name: '佐藤 太郎',
    role: Role.CARE_WORKER,
    skills: [Skill.CARE_SKILLS, Skill.NIGHT_SHIFT_CAPABLE],
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
    ],
    unavailableDates: [],
  },
  // ... 他の従業員
];

// スケジュール生成
const result = await generateSchedule({
  yearMonth: '2025-01',
  employees,
});

// 結果の確認
console.log(`実行可能: ${result.feasible}`);
console.log(`満足度スコア: ${result.overallScore.toFixed(2)}`);
console.log(`違反数: ${result.totalViolations}`);

// 生成されたスケジュールの利用
const schedule = result.schedule;
schedule.assignments.forEach(assignment => {
  console.log(`${assignment.date}: ${assignment.employeeId} -> ${assignment.shiftTypeId}`);
});
```

### カスタム制約の利用

```typescript
import {
  NaiveSolver,
  getAllHardConstraints,
  getAllSoftConstraints,
  STANDARD_SHIFT_TYPES,
} from 'welfare-shift-scheduler-core';

const solver = new NaiveSolver();

const result = await solver.generateSchedule({
  yearMonth: '2025-01',
  employees: employees,
  shiftTypes: Object.values(STANDARD_SHIFT_TYPES),
  hardConstraints: getAllHardConstraints(),
  softConstraints: getAllSoftConstraints(),
  timeoutMs: 30000,
});
```

## アーキテクチャ

```
src/
├── domain/           # ドメインモデル
│   ├── Employee.ts       # 従業員モデル
│   ├── Role.ts           # 職種・スキル定義
│   ├── ShiftType.ts      # シフトタイプ定義
│   └── ShiftAssignment.ts # シフト割り当て
├── constraints/      # 制約定義
│   ├── types.ts          # 制約の型定義
│   ├── hardConstraints.ts # ハード制約（必須）
│   └── softConstraints.ts # ソフト制約（最適化目標）
├── solver/           # ソルバー実装
│   ├── types.ts          # ソルバーインターフェース
│   └── NaiveSolver.ts    # シンプルなヒューリスティック実装
├── examples/         # サンプル実装
│   └── smallFacilityExample.ts
└── index.ts          # エントリーポイント
```

## ドメインモデル

### ShiftType（シフトタイプ）

日本の介護施設で一般的なシフトパターン：

- **早番** (EARLY): 07:00-16:00
- **日勤A** (DAY_A): 08:30-17:30
- **日勤B** (DAY_B): 09:00-18:00
- **遅番** (LATE): 11:00-20:00
- **夜勤入り** (NIGHT_START): 16:00-翌10:00 (16時間)
- **夜勤明け** (NIGHT_END): 10:00-12:00 (引き継ぎ時間)
- **休み** (OFF)

### Employee（従業員）

主な属性：
- 基本情報: ID、名前、職種、雇用形態
- スキル: 保有スキルのリスト
- 勤務制限: 最大/最小シフト数、連続勤務日数、労働時間上限
- 希望: 勤務希望、勤務不可日

### Role（職種）

- 介護福祉士 (CARE_WORKER)
- 看護師 (NURSE)
- ケアマネージャー (CARE_MANAGER)
- 介護助手 (CARE_ASSISTANT)
- 理学療法士 (PHYSICAL_THERAPIST)
- 作業療法士 (OCCUPATIONAL_THERAPIST)
- など

## 制約

### ハード制約（必ず満たすべき制約）

1. **二重予約禁止**: 同じ従業員が同じ日に複数のシフトに入らない
2. **夜勤明け後の勤務禁止**: 夜勤入りの翌日は他のシフトに入れない
3. **勤務不可日の遵守**: 従業員が指定した勤務不可日には割り当てない
4. **月間最大シフト数**: 従業員の月間最大シフト数を超えない
5. **最大連続勤務日数**: 連続勤務日数の上限を超えない
6. **夜勤可能スキル**: 夜勤可能スキルを持たない従業員は夜勤に入れない

### ソフト制約（最適化目標）

1. **希望休の考慮**: 従業員の希望休をなるべく守る
2. **夜勤の公平な配分**: 夜勤可能な従業員間で夜勤回数を均等にする
3. **希望シフトの考慮**: 従業員の希望するシフトをなるべく割り当てる
4. **長時間連続勤務の回避**: 連続勤務をなるべく短くする（推奨5日以下）
5. **月間最小シフト数**: 従業員の月間最小シフト数を満たす

## API インターフェース

### 他システムからの呼び出し方法

このライブラリは、外部システム（例: Webアプリケーション、REST API、バッチ処理など）から以下のように利用できます。

#### パターン1: 簡易関数を使う

```typescript
import { generateSchedule, Employee } from 'welfare-shift-scheduler-core';

// 従業員データ（JSONやDBから取得したデータ）
const employees: Employee[] = await fetchEmployeesFromDatabase();

// スケジュール生成
const result = await generateSchedule({
  yearMonth: '2025-01',
  employees,
});

// 結果を保存
await saveScheduleToDatabase(result.schedule);
```

#### パターン2: ソルバーを直接使う

```typescript
import {
  NaiveSolver,
  ScheduleGenerationRequest,
  getAllHardConstraints,
  getAllSoftConstraints,
  STANDARD_SHIFT_TYPES,
} from 'welfare-shift-scheduler-core';

const solver = new NaiveSolver();

const request: ScheduleGenerationRequest = {
  yearMonth: '2025-01',
  employees: employees,
  shiftTypes: Object.values(STANDARD_SHIFT_TYPES),
  hardConstraints: getAllHardConstraints(),
  softConstraints: getAllSoftConstraints(),
  staffingRequirements: customStaffingMap, // カスタム人員配置要件
  timeoutMs: 60000,
};

const result = await solver.generateSchedule(request);
```

#### パターン3: REST APIとしてラップする例

```typescript
// Express.jsの例
import express from 'express';
import { generateSchedule, Employee } from 'welfare-shift-scheduler-core';

const app = express();
app.use(express.json());

app.post('/api/schedules/generate', async (req, res) => {
  try {
    const { yearMonth, employees } = req.body;

    const result = await generateSchedule({
      yearMonth,
      employees: employees as Employee[],
    });

    res.json({
      success: result.success,
      feasible: result.feasible,
      schedule: result.schedule,
      score: result.overallScore,
      violations: result.totalViolations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

### 入力データ形式

従業員データは以下のJSON形式で渡すことができます：

```json
{
  "yearMonth": "2025-01",
  "employees": [
    {
      "id": "E001",
      "name": "佐藤 太郎",
      "role": "CARE_WORKER",
      "skills": ["CARE_SKILLS", "NIGHT_SHIFT_CAPABLE"],
      "employmentType": "FULL_TIME",
      "maxShiftsPerMonth": 22,
      "minShiftsPerMonth": 20,
      "maxNightShiftsPerMonth": 5,
      "minNightShiftsPerMonth": 3,
      "maxConsecutiveWorkDays": 6,
      "maxWeeklyHours": 40,
      "maxMonthlyHours": 180,
      "preferences": [
        {
          "date": "2025-01-05",
          "preferredShiftId": "OFF",
          "priority": 3
        }
      ],
      "unavailableDates": ["2025-01-15"]
    }
  ]
}
```

### 出力データ形式

```json
{
  "success": true,
  "feasible": true,
  "totalViolations": 2,
  "overallScore": 85.5,
  "schedule": {
    "yearMonth": "2025-01",
    "assignments": [
      {
        "employeeId": "E001",
        "date": "2025-01-01",
        "shiftTypeId": "DAY_A"
      }
    ],
    "generatedAt": "2025-01-01T00:00:00.000Z",
    "metadata": {
      "generationTimeMs": 150
    }
  }
}
```

## サンプル実行

```bash
# 依存パッケージのインストール
npm install

# サンプルプログラムの実行
npm run example
```

サンプル出力：
```
============================================================
介護施設シフト自動生成エンジン - サンプル実行
============================================================

従業員数: 6名
  - 佐藤 太郎 (CARE_WORKER) [FULL_TIME]
  - 鈴木 花子 (NURSE) [FULL_TIME]
  ...

シフトタイプ数: 7種類
  - 早番 (07:00-16:00, 必要人数: 2)
  - 日勤A (08:30-17:30, 必要人数: 3)
  ...

生成結果
============================================================
成功: はい
実行可能: はい（ハード制約を満たす）
違反数: 5
満足度スコア: 82.45点
生成時間: 127ms
```

## 拡張性

### カスタムソルバーの実装

将来的にOR-ToolsやGoogle OR-Toolsなどの高度な制約ソルバーを統合する場合：

```typescript
import { Solver, ScheduleGenerationRequest, ScheduleGenerationResult } from 'welfare-shift-scheduler-core';

class ORToolsSolver implements Solver {
  getName(): string {
    return 'ORToolsSolver';
  }

  async generateSchedule(request: ScheduleGenerationRequest): Promise<ScheduleGenerationResult> {
    // OR-Toolsを使った実装
    // ...
  }
}
```

### カスタム制約の追加

```typescript
import { Constraint, ConstraintEvaluationResult, Schedule, Employee } from 'welfare-shift-scheduler-core';

class CustomConstraint implements Constraint {
  id = 'CUSTOM_CONSTRAINT';
  name = 'カスタム制約';
  description = 'カスタム制約の説明';
  type: 'HARD' | 'SOFT' = 'SOFT';

  evaluate(schedule: Schedule, employees: Employee[]): ConstraintEvaluationResult {
    // カスタムロジック
    return {
      satisfied: true,
      violations: [],
      score: 100,
    };
  }
}
```

## ライセンス

MIT

## 開発

```bash
# ビルド
npm run build

# 開発モード
npm run dev

# サンプル実行
npm run example
```

## ロードマップ

- [ ] OR-Tools統合
- [ ] PostgreSQLデータベース連携
- [ ] より高度な最適化アルゴリズム
- [ ] Webインターフェース
- [ ] 多施設対応
- [ ] シフト変更リクエスト機能
- [ ] 勤務実績との比較分析

## コントリビューション

Issue、Pull Requestを歓迎します。

---

© 2025 welfare-shift-scheduler-core
