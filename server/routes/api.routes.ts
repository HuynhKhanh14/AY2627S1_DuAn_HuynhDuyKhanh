/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { DatasetController } from '../controllers/dataset.controller';
import { MiningController } from '../controllers/mining.controller';
import { SanitizeController } from '../controllers/sanitize.controller';

export const apiRouter = Router();

// Health check endpoint cho Docker container
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    app: 'PPRIM-Explorer',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    student: 'Huynh Duy Khanh - DA139',
    advisor: 'ThS. Nguyen Chi Thien',
  });
});

// Dataset Endpoints
apiRouter.get('/dataset/sample', DatasetController.getSampleDataset);
apiRouter.post('/dataset/preprocess', DatasetController.preprocessUploadedData);

// Mining Endpoints
apiRouter.post('/mine', MiningController.runMining);

// Sanitization & Benchmark Endpoints
apiRouter.post('/sanitize', SanitizeController.runSanitize);
apiRouter.post('/benchmark', SanitizeController.runBenchmark);
