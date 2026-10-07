/**
 * Vercel Serverless Function: /api/simulate
 *
 * スープチラー急速冷却シミュレーション サーバーサイドAPI
 * (Vercel Serverless / Node.js / Edge ランタイム対応)
 */

import {
  validateAndNormalizeParams,
  runServerSimulation,
} from '../src/server/simulationService';

// Vercel Serverless Function (Node.js runtime / Express compatible)
export default async function handler(req: any, res: any) {
  // CORS ヘッダー
  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      endpoint: '/api/simulate',
      description: 'QULIYA CHILLER 伝熱物理シミュレーションAPI (POSTにてパラメータを送信してください)',
      parameters: {
        soup_mass: 'スープ質量 [kg] (例: 45)',
        pot_diameter: '寸胴鍋内径 [mm] (例: 450)',
        water_temp: '給水温度 [℃] (例: 18)',
        target_temp: '目標冷却温度 [℃] (デフォルト: 30)',
        flow_rate: '冷却水流量 [L/min] (例: 18)',
        rpm: '攪拌・回転数 [RPM] (例: 70)',
        mode: "'quliya' | 'coil' | 'sink' (デフォルト: 'quliya')",
      },
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. POST is required.' });
  }

  try {
    const rawBody = req.body;
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : (rawBody || {});

    // バリデーション & 正規化
    const validation = validateAndNormalizeParams(body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // サーバーサイド物理シミュレーション実行 (中間変数は返却せず安全にマスク)
    const result = runServerSimulation(validation.params);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('API /api/simulate error:', error);
    return res.status(500).json({ error: error.message || '内部計算処理中にエラーが発生しました。' });
  }
}

// Next.js App Router / Edge Runtime 用のエクスポート (POST)
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

    const result = runServerSimulation(validation.params);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || '内部計算処理中にエラーが発生しました。' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
