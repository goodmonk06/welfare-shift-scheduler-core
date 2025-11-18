# welfare-shift-scheduler-core

介護・福祉事業所向けのシフト自動生成エンジン - REST API + コアライブラリ

## Overview（概要）

このプロジェクトは、日本の介護施設における複雑なシフト作成を自動化するためのシステムです。従業員のスキル、希望休、労働基準法の遵守など、多数の制約条件を考慮しながら、最適なシフトスケジュールを生成します。

**Phase 2完了:** 完全に動作するREST API、テストスイート、Docker環境を実装しました。

### Key Features（主な特徴）

- ✅ 日本の介護施設に特化したシフトタイプ（早番、日勤A/B、遅番、夜勤入り/明けなど）
- ✅ ハード制約（6種類）とソフト制約（5種類）による柔軟なスケジュール最適化
- ✅ REST API による外部システムとの統合
- ✅ Zod によるエンドツーエンドの型安全性とバリデーション
- ✅ 拡張可能なソルバーインターフェース
- ✅ インメモリ動作（将来的にPostgreSQL対応予定）
- ✅ Vitest によるテストカバレッジ
- ✅ Docker 対応で簡単にデプロイ可能

## Tech Stack（技術スタック）

**Backend:**
- Node.js 20+
- TypeScript 5.3+
- Express.js (REST API)
- Zod (バリデーション)

**Testing:**
- Vitest (テストフレームワーク)

**Infrastructure:**
- Docker & Docker Compose
- (将来) PostgreSQL

**Solver:**
- NaiveSolver (ヒューリスティック実装)
- (将来) OR-Tools統合予定

## Domain Model Summary（ドメインモデル概要）

### 主要エンティティ

1. **Employee（従業員）**
   - 基本情報、職種、スキル
   - 勤務制限（最大/最小シフト数、連続勤務日数）
   - 希望休・勤務不可日

2. **ShiftType（シフトタイプ）**
   - 早番 (07:00-16:00)
   - 日勤A (08:30-17:30)
   - 日勤B (09:00-18:00)
   - 遅番 (11:00-20:00)
   - 夜勤入り (16:00-翌10:00)
   - 夜勤明け (10:00-12:00)
   - 休み

3. **Schedule（スケジュール）**
   - 月次のシフト割り当て
   - 制約違反数と満足度スコア
   - メタデータ（生成時間など）

4. **Constraints（制約）**
   - **ハード制約**: 二重予約禁止、夜勤明け後勤務禁止、勤務不可日遵守など
   - **ソフト制約**: 希望休考慮、夜勤公平配分、連続勤務回避など

### アーキテクチャ

```
src/
├── domain/           # ドメインモデル
│   ├── Employee.ts
│   ├── Role.ts
│   ├── ShiftType.ts
│   └── ShiftAssignment.ts
├── constraints/      # 制約定義
│   ├── hardConstraints.ts
│   └── softConstraints.ts
├── solver/           # ソルバー実装
│   ├── types.ts
│   └── NaiveSolver.ts
├── api/              # REST API
│   ├── server.ts
│   ├── routes/
│   ├── schemas.ts    # Zodバリデーション
│   ├── storage.ts    # インメモリストレージ
│   └── middleware.ts
├── examples/         # サンプル実装
└── index.ts          # ライブラリエントリーポイント
```

## Getting Started

### Requirements（前提条件）

- Node.js 20以上
- npm または yarn
- (オプション) Docker & Docker Compose

### Setup Steps（セットアップ手順）

#### 1. リポジトリのクローンと依存関係のインストール

```bash
# クローン
git clone <repository-url>
cd welfare-shift-scheduler-core

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
```

#### 2. オプションA: ローカル開発

```bash
# Seed データの投入（デモ用の従業員6名を登録）
npm run seed

# 開発サーバーの起動（ホットリロード対応）
npm run dev
```

サーバーが起動したら、ブラウザで http://localhost:3000 を開いて動作確認できます。

#### 2. オプションB: Docker で起動

```bash
# Dockerイメージのビルドと起動
docker compose up --build

# またはバックグラウンドで起動
docker compose up -d
```

### デモフローの実行

#### Step 1: ヘルスチェック

```bash
curl http://localhost:3000/api/health
```

**レスポンス例:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-18T00:00:00.000Z",
  "uptime": 123.456,
  "storage": {
    "employeeCount": 6,
    "scheduleCount": 0
  }
}
```

#### Step 2: 従業員一覧の取得

```bash
curl http://localhost:3000/api/employees
```

**レスポンス例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "E001",
      "name": "佐藤 太郎",
      "role": "CARE_WORKER",
      "skills": ["CARE_SKILLS", "NIGHT_SHIFT_CAPABLE"],
      ...
    },
    ...
  ],
  "count": 6
}
```

#### Step 3: スケジュールの生成

```bash
curl -X POST http://localhost:3000/api/schedules/generate \
  -H "Content-Type: application/json" \
  -d '{"yearMonth": "2025-01"}'
```

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "schedule": {
      "yearMonth": "2025-01",
      "assignments": [...],
      "generatedAt": "2025-01-18T00:00:00.000Z",
      "metadata": {
        "generationTimeMs": 127
      }
    },
    "feasible": true,
    "totalViolations": 3,
    "overallScore": 85.2
  },
  "message": "Schedule generated successfully"
}
```

#### Step 4: 生成したスケジュールの取得

```bash
curl http://localhost:3000/api/schedules/2025-01
```

## API Reference

### Endpoints

#### Employee Management

```
GET    /api/employees           - 従業員一覧取得
GET    /api/employees/:id       - 従業員詳細取得
POST   /api/employees           - 従業員作成
PUT    /api/employees/:id       - 従業員更新
DELETE /api/employees/:id       - 従業員削除
```

#### Schedule Management

```
POST   /api/schedules/generate  - スケジュール生成
GET    /api/schedules           - スケジュール一覧取得
GET    /api/schedules/:yearMonth - スケジュール詳細取得
DELETE /api/schedules/:yearMonth - スケジュール削除
```

#### Health Check

```
GET    /api/health              - ヘルスチェック
```

### リクエスト例

#### 従業員の作成

```bash
curl -X POST http://localhost:3000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "id": "E007",
    "name": "新規 従業員",
    "role": "CARE_WORKER",
    "skills": ["CARE_SKILLS"],
    "employmentType": "PART_TIME",
    "maxShiftsPerMonth": 15,
    "minShiftsPerMonth": 12,
    "maxConsecutiveWorkDays": 5,
    "maxWeeklyHours": 30,
    "maxMonthlyHours": 120,
    "preferences": [],
    "unavailableDates": []
  }'
```

## テストの実行

```bash
# テスト実行
npm test

# テスト（UIモード）
npm run test:ui

# カバレッジ付きテスト
npm run test:coverage
```

## プログラム的な使用方法

ライブラリとしても使用できます。

```typescript
import {
  generateSchedule,
  Employee,
  Role,
  Skill,
  EmploymentType,
} from 'welfare-shift-scheduler-core';

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

const result = await generateSchedule({
  yearMonth: '2025-01',
  employees,
});

console.log(`実行可能: ${result.feasible}`);
console.log(`満足度スコア: ${result.overallScore.toFixed(2)}`);
console.log(`違反数: ${result.totalViolations}`);
```

## 制約詳細

### ハード制約（必ず満たすべき制約）

1. **二重予約禁止**: 同じ従業員が同じ日に複数のシフト（OFF以外）に入らない
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

## 開発コマンド

```bash
# 開発サーバー（ホットリロード）
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# テスト
npm test

# 型チェック
npm run typecheck

# Linter
npm run lint

# フォーマット
npm run format

# Seedデータ投入
npm run seed

# サンプルスクリプト実行
npm run example
```

## Future Extensions（将来の拡張）

### 短期（Phase 3）
- [ ] PostgreSQL データベース連携
- [ ] 従業員・スケジュールの永続化
- [ ] ページネーション機能
- [ ] フィルタリング・ソート機能
- [ ] より詳細なログ出力

### 中期（Phase 4）
- [ ] OR-Tools 統合による高度な最適化
- [ ] 複数施設の管理
- [ ] シフト変更リクエスト機能
- [ ] Webフロントエンド（React）
- [ ] 認証・認可（JWT）
- [ ] リアルタイム通知

### 長期（Phase 5+）
- [ ] 機械学習によるシフト需要予測
- [ ] モバイルアプリ（React Native）
- [ ] 勤務実績との比較分析
- [ ] レポート・ダッシュボード機能
- [ ] カレンダー連携（Google Calendar等）
- [ ] マルチテナント対応

## Troubleshooting

### ポート3000が既に使用されている

```bash
# .envファイルでポートを変更
PORT=3001

# または環境変数で指定
PORT=3001 npm run dev
```

### Dockerコンテナが起動しない

```bash
# ログを確認
docker compose logs

# コンテナを再ビルド
docker compose down
docker compose up --build
```

## ライセンス

MIT

## コントリビューション

Issue、Pull Requestを歓迎します。

---

© 2025 welfare-shift-scheduler-core
