import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (error) {
    console.error('Healthcheck DB Ping Error:', error);
    dbStatus = 'unhealthy';
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus === 'healthy';

  const payload = {
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'FinanzApp (Fin593 Ecuador)',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    components: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    },
    latencyMs: responseTimeMs,
    version: '1.0.0',
  };

  return NextResponse.json(payload, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
