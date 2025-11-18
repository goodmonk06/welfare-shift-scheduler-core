import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import employeesRouter from './routes/employees';
import schedulesRouter from './routes/schedules';
import healthRouter from './routes/health';
import { errorHandler, requestLogger } from './middleware';

// 環境変数の読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// ルート
app.get('/', (req, res) => {
  res.json({
    name: 'Welfare Shift Scheduler API',
    version: '0.1.0',
    endpoints: {
      health: '/api/health',
      employees: '/api/employees',
      schedules: '/api/schedules',
    },
  });
});

app.use('/api/health', healthRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/schedules', schedulesRouter);

// エラーハンドリング
app.use(errorHandler);

// サーバー起動
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 Welfare Shift Scheduler API Server');
    console.log('='.repeat(60));
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`API Documentation: http://localhost:${PORT}/`);
    console.log('='.repeat(60));
  });
}

export default app;
