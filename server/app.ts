/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Express } from 'express';
import { apiRouter } from './routes/api.routes';

/**
 * Khởi tạo ứng dụng Express Backend
 */
export function createExpressApp(): Express {
  const app = express();

  // Middleware phân tích payload JSON và URL-encoded với dung lượng hỗ trợ lớn cho dataset
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Gắn các API Routes vào tiền tố /api
  app.use('/api', apiRouter);

  return app;
}
