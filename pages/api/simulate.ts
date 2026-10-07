/**
 * Next.js Pages Router API Route: pages/api/simulate.ts
 *
 * スープチラー計算シミュレーター サーバーサイドAPI
 */

import type { IncomingMessage, ServerResponse } from 'http';
import {
  validateAndNormalizeParams,
  runServerSimulation,
} from '../../src/server/simulationService';

interface NextApiRequest extends IncomingMessage {
  body: any;
  method?: string;
}

interface NextApiResponse extends ServerResponse {
  status: (code: number) => NextApiResponse;
  json: (body: any) => void;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. POST is required.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const validation = validateAndNormalizeParams(body);

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const result = runServerSimulation(validation.params);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Simulation error' });
  }
}
