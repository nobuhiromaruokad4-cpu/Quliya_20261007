/**
 * Vercel Serverless Function: /api/simulate-3modes
 *
 * 3方式 (QULIYA式, コイル式, シンク式) 同時冷却比較シミュレーションAPI
 * コイル式・シンク式は回転数=0(攪拌なし)、流量の影響のみを受ける仕様を厳格に遵守
 */

import {
  validateAndNormalizeParams,
  runServerSimulation,
} from '../src/server/simulationService';

export default async function handler(req: any, res: any) {
  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. POST is required.' });
  }

  try {
    const rawBody = req.body;
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : (rawBody || {});

    const validation = validateAndNormalizeParams(body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const baseParams = validation.params;

    // 1. QULIYA式 (指定のRPM & 流量)
    const quliyaRes = runServerSimulation({
      ...baseParams,
      mode: 'quliya',
    });

    // 2. コイル式 (RPMは強制0、流量のみ影響)
    const coilRes = runServerSimulation({
      ...baseParams,
      mode: 'coil',
      rpm: 0,
    });

    // 3. シンク式 (RPMは強制0、流量のみ影響)
    const sinkRes = runServerSimulation({
      ...baseParams,
      mode: 'sink',
      rpm: 0,
    });

    return res.status(200).json({
      quliya: quliyaRes,
      coil: coilRes,
      sink: sinkRes,
    });
  } catch (error: any) {
    console.error('API /api/simulate-3modes error:', error);
    return res.status(500).json({ error: error.message || '内部計算処理中にエラーが発生しました。' });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateAndNormalizeParams(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const baseParams = validation.params;

    const quliyaRes = runServerSimulation({ ...baseParams, mode: 'quliya' });
    const coilRes = runServerSimulation({ ...baseParams, mode: 'coil', rpm: 0 });
    const sinkRes = runServerSimulation({ ...baseParams, mode: 'sink', rpm: 0 });

    return new Response(
      JSON.stringify({
        quliya: quliyaRes,
        coil: coilRes,
        sink: sinkRes,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || '計算処理エラー' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
